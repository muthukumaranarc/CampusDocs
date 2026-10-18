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
		SpringApplication.run(CampusDocusApplication.class, args);
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

