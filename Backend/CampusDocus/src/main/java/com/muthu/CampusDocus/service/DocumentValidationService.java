package com.muthu.CampusDocus.service;

import com.muthu.CampusDocus.model.DocumentCategory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;

@Service
public class DocumentValidationService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentValidationService.class);

    // Default 10 MB in bytes = 10 * 1024 * 1024
    @Value("${app.upload.max-file-size:10485760}")
    private long maxFileSizeBytes;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    // Magic Bytes (File Signatures)
    private static final byte[] PDF_MAGIC = new byte[]{0x25, 0x50, 0x44, 0x46}; // %PDF
    private static final byte[] JPEG_MAGIC = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}; // FF D8 FF
    private static final byte[] PNG_MAGIC = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}; // 89 50 4E 47 0D 0A 1A 0A

    public void validateUpload(MultipartFile file, String title, String categoryStr) {
        validateFilePresenceAndSize(file);
        validateTitle(title);
        validateCategory(categoryStr);
        validateFileTypeAndSignature(file);
    }

    private void validateFilePresenceAndSize(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty or not provided.");
        }

        if (file.getSize() > maxFileSizeBytes) {
            long maxMb = maxFileSizeBytes / (1024 * 1024);
            throw new IllegalArgumentException(String.format(
                    "File size (%s bytes) exceeds maximum allowable limit of %d MB.",
                    file.getSize(), maxMb
            ));
        }
    }

    private void validateTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Document title is required.");
        }
        if (title.trim().length() > 150) {
            throw new IllegalArgumentException("Document title cannot exceed 150 characters.");
        }
    }

    public DocumentCategory validateCategory(String categoryStr) {
        DocumentCategory category = DocumentCategory.fromString(categoryStr);
        if (category == null) {
            throw new IllegalArgumentException(
                    "Invalid category. Allowed values: Academic Records, Certificates, Identification Documents, Personal Documents, Other."
            );
        }
        return category;
    }

    private void validateFileTypeAndSignature(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("File must have a valid extension (.pdf, .jpg, .jpeg, .png).");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported file extension: ." + extension + ". Allowed formats: PDF, JPG, JPEG, PNG.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Unsupported MIME type: " + contentType + ". Allowed: PDF, JPG, JPEG, PNG.");
        }

        // Validate File Signature (Magic Bytes)
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[8];
            int read = is.read(header);
            if (read < 3) {
                throw new IllegalArgumentException("File is too small or corrupt to determine format.");
            }

            boolean matchesSignature = false;
            switch (extension) {
                case "pdf" -> matchesSignature = startsWith(header, PDF_MAGIC);
                case "jpg", "jpeg" -> matchesSignature = startsWith(header, JPEG_MAGIC);
                case "png" -> matchesSignature = startsWith(header, PNG_MAGIC);
            }

            if (!matchesSignature) {
                logger.warn("Security check failed: file '{}' claims extension '{}' but magic bytes do not match.",
                        originalFilename, extension);
                throw new IllegalArgumentException("File content signature does not match declared extension ." + extension);
            }

        } catch (IOException e) {
            logger.error("Error reading file stream during validation: {}", e.getMessage());
            throw new IllegalArgumentException("Failed to read file for signature verification.", e);
        }
    }

    private boolean startsWith(byte[] source, byte[] prefix) {
        if (source == null || source.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (source[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }
}
