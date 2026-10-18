package com.muthu.CampusDocus;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@SpringBootApplication
public class CampusDocusApplication {

	private static final Logger log = LoggerFactory.getLogger(CampusDocusApplication.class);

	public static void main(String[] args) {
		loadDotEnv();
		sanitizeMongoUri();
		SpringApplication.run(CampusDocusApplication.class, args);
	}

	private static void sanitizeMongoUri() {
		String rawMongo = System.getProperty("MONGODB_URL");
		if (rawMongo == null || rawMongo.isBlank()) {
			rawMongo = System.getenv("MONGODB_URL");
		}
		if (rawMongo == null || rawMongo.isBlank()) {
			rawMongo = System.getProperty("MONGODB_URI");
		}
		if (rawMongo == null || rawMongo.isBlank()) {
			rawMongo = System.getenv("MONGODB_URI");
		}

		if (rawMongo != null && !rawMongo.isBlank()) {
			String clean = rawMongo.trim();

			// Strip quotes if present
			if ((clean.startsWith("\"") && clean.endsWith("\"")) || (clean.startsWith("'") && clean.endsWith("'"))) {
				if (clean.length() >= 2) {
					clean = clean.substring(1, clean.length() - 1).trim();
				}
			}

			// If inadvertently prefixed with markdown tags like "text" or backticks
			int mongoIdx = clean.indexOf("mongodb://");
			int mongoSrvIdx = clean.indexOf("mongodb+srv://");
			int startIdx = -1;
			if (mongoSrvIdx >= 0 && (mongoIdx < 0 || mongoSrvIdx < mongoIdx)) {
				startIdx = mongoSrvIdx;
			} else if (mongoIdx >= 0) {
				startIdx = mongoIdx;
			}

			if (startIdx > 0) {
				log.warn("Detected prefix before MongoDB scheme in connection string. Stripping leading characters.");
				clean = clean.substring(startIdx);
			}

			// Clean whitespace, carriage returns and newlines
			clean = clean.replaceAll("[\\r\\n\\t]+", "").trim();

			if (clean.startsWith("mongodb://") || clean.startsWith("mongodb+srv://")) {
				// If database name is missing before query params (e.g. mongodb.net/?), insert /campusdocs
				if (clean.contains(".mongodb.net/?")) {
					clean = clean.replace(".mongodb.net/?", ".mongodb.net/campusdocs?");
				} else if (clean.endsWith(".mongodb.net") || clean.endsWith(".mongodb.net/")) {
					clean = clean.endsWith("/") ? clean + "campusdocs" : clean + "/campusdocs";
				}

				// If authSource is not specified, explicitly append authSource=admin for Atlas
				if (!clean.contains("authSource=")) {
					clean += clean.contains("?") ? "&authSource=admin" : "?authSource=admin";
				}

				log.info("Sanitized MongoDB connection URI successfully (Scheme: {}, authSource: admin)",
						clean.startsWith("mongodb+srv://") ? "mongodb+srv" : "mongodb");
				System.setProperty("MONGODB_URL", clean);
				System.setProperty("spring.data.mongodb.uri", clean);
				System.setProperty("spring.mongodb.uri", clean);
			} else {
				log.error("CRITICAL: MONGODB_URL is invalid! It does not start with 'mongodb://' or 'mongodb+srv://'. Raw start: '{}'",
						clean.length() > 20 ? clean.substring(0, 20) : clean);
			}
		}
	}

	private static void loadDotEnv() {
		String[] candidatePaths = {
				".env",
				"Backend/CampusDocus/.env",
				"../.env",
				"../../.env"
		};

		for (String pathStr : candidatePaths) {
			File envFile = new File(pathStr);
			if (envFile.exists() && envFile.isFile()) {
				log.info("Loading environment configuration from: {}", envFile.getAbsolutePath());
				try (BufferedReader reader = new BufferedReader(new FileReader(envFile, StandardCharsets.UTF_8))) {
					String line;
					while ((line = reader.readLine()) != null) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#")) {
							continue;
						}
						int separatorIdx = line.indexOf('=');
						if (separatorIdx > 0) {
							String key = line.substring(0, separatorIdx).trim();
							String value = line.substring(separatorIdx + 1).trim();

							if ((value.startsWith("\"") && value.endsWith("\"")) ||
								(value.startsWith("'") && value.endsWith("'"))) {
								if (value.length() >= 2) {
									value = value.substring(1, value.length() - 1);
								}
							}

							// Set system property if not already set via JVM -D or OS environment
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, value);
							}
						}
					}
					log.info("Successfully loaded .env properties into System environment.");
					return;
				} catch (IOException e) {
					log.warn("Failed to read .env file at {}: {}", envFile.getAbsolutePath(), e.getMessage());
				}
			}
		}

		log.warn("No .env file found in default locations. Relying on system environment variables or application defaults.");
	}

}

