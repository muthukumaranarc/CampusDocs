package com.muthu.CampusDocus.service;

import com.google.api.services.drive.model.File;
import com.muthu.CampusDocus.dto.DocumentFileStream;
import com.muthu.CampusDocus.dto.DocumentResponse;
import com.muthu.CampusDocus.dto.DocumentUpdateRequest;
import com.muthu.CampusDocus.dto.DocumentUploadResponse;
import com.muthu.CampusDocus.dto.PageResponse;
import com.muthu.CampusDocus.exception.DriveException;
import com.muthu.CampusDocus.exception.ResourceNotFoundException;
import com.muthu.CampusDocus.model.Document;
import com.muthu.CampusDocus.model.DocumentCategory;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.repository.DocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentRepository documentRepository;
    private final DocumentValidationService validationService;
    private final GoogleDriveService googleDriveService;
    private final MongoTemplate mongoTemplate;

    public DocumentService(DocumentRepository documentRepository,
                           DocumentValidationService validationService,
                           GoogleDriveService googleDriveService,
                           MongoTemplate mongoTemplate) {
        this.documentRepository = documentRepository;
        this.validationService = validationService;
        this.googleDriveService = googleDriveService;
        this.mongoTemplate = mongoTemplate;
    }

    public DocumentUploadResponse uploadDocument(User user, MultipartFile file, String title, String categoryStr) {
        // Step 1: Server-side validation (file size, extension, MIME, magic bytes, title, category)
        validationService.validateUpload(file, title, categoryStr);
        DocumentCategory category = validationService.validateCategory(categoryStr);

        // Step 2: Validate Google Drive connection
        if (!user.isDriveConnected()) {
            throw new DriveException("Google Drive is not connected. Please connect Google Drive before uploading documents.", true);
        }

        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();
        long fileSize = file.getSize();

        // Step 3: Stream file directly to Google Drive dedicated folder
        File uploadedDriveFile;
        try (InputStream inputStream = file.getInputStream()) {
            uploadedDriveFile = googleDriveService.uploadFile(
                    user,
                    inputStream,
                    originalFilename,
                    contentType,
                    fileSize
            );
        } catch (IOException e) {
            logger.error("Failed to read input stream from multipart file: {}", e.getMessage());
            throw new IllegalArgumentException("Unable to read uploaded file stream.", e);
        }

        // Step 4: Persist metadata in MongoDB Atlas with compensatory rollback on failure
        Document document = new Document(
                user.getId(),
                uploadedDriveFile.getId(),
                originalFilename,
                title.trim(),
                category,
                contentType,
                fileSize,
                uploadedDriveFile.getWebViewLink()
        );

        try {
            Document savedDoc = documentRepository.save(document);
            logger.info("Successfully persisted document metadata in MongoDB Atlas: docId={}, driveFileId={}, userId={}",
                    savedDoc.getId(), savedDoc.getDriveFileId(), user.getId());

            return mapToUploadResponse(savedDoc, "Document uploaded and secured in your Google Drive folder successfully.");

        } catch (Exception dbException) {
            logger.error("MongoDB persistence failed after successful Google Drive upload. Initiating rollback compensation...", dbException);
            // Delete the orphaned file from Google Drive to maintain consistency
            try {
                googleDriveService.deleteFile(user, uploadedDriveFile.getId());
            } catch (Exception deleteEx) {
                logger.error("Failed to delete orphaned Drive file '{}' during rollback: {}", uploadedDriveFile.getId(), deleteEx.getMessage());
            }
            throw new RuntimeException("Database error saving document metadata. The uploaded file was rolled back.", dbException);
        }
    }

    public PageResponse<DocumentResponse> getDocuments(User user,
                                                       String searchTerm,
                                                       String categoryStr,
                                                       String sortBy,
                                                       String sortDirection,
                                                       int page,
                                                       int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 50);

        // Build Sort specification
        String sortField = resolveSortField(sortBy);
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, sortField);
        Pageable pageable = PageRequest.of(safePage, safeSize, sort);

        // Build Criteria list
        List<Criteria> criteriaList = new ArrayList<>();
        criteriaList.add(Criteria.where("userId").is(user.getId()));

        if (categoryStr != null && !categoryStr.isBlank() && !"ALL".equalsIgnoreCase(categoryStr)) {
            try {
                DocumentCategory category = validationService.validateCategory(categoryStr);
                criteriaList.add(Criteria.where("category").is(category));
            } catch (IllegalArgumentException e) {
                logger.warn("Ignoring invalid category filter query: '{}'", categoryStr);
            }
        }

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String escaped = Pattern.quote(searchTerm.trim());
            criteriaList.add(new Criteria().orOperator(
                    Criteria.where("title").regex(escaped, "i"),
                    Criteria.where("originalFileName").regex(escaped, "i")
            ));
        }

        Criteria combined = new Criteria().andOperator(criteriaList.toArray(new Criteria[0]));
        Query query = new Query(combined).with(pageable);
        Query countQuery = new Query(combined);

        long totalElements = mongoTemplate.count(countQuery, Document.class);
        List<Document> documents = mongoTemplate.find(query, Document.class);

        int totalPages = safeSize == 0 ? 1 : (int) Math.ceil((double) totalElements / (double) safeSize);
        boolean isFirst = safePage == 0;
        boolean isLast = safePage >= totalPages - 1;

        List<DocumentResponse> content = documents.stream()
                .map(this::mapToDocumentResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(content, safePage, safeSize, totalElements, totalPages, isFirst, isLast);
    }

    public DocumentFileStream getDocumentStream(User user, String documentId) {
        Document doc = getDocumentAndVerifyOwnership(user, documentId);

        try {
            InputStream inputStream = googleDriveService.downloadFile(user, doc.getDriveFileId());
            return new DocumentFileStream(doc, inputStream);
        } catch (ResourceNotFoundException notFoundEx) {
            // Graceful stale metadata handling: File was moved or deleted directly in Google Drive
            logger.warn("Document file '{}' (Drive ID: {}) missing from Google Drive. Removing stale metadata for docId: {}",
                    doc.getTitle(), doc.getDriveFileId(), doc.getId());
            try {
                documentRepository.delete(doc);
            } catch (Exception e) {
                logger.error("Failed to delete stale document metadata from database: {}", e.getMessage());
            }
            throw new ResourceNotFoundException("The requested document was removed from your Google Drive. Stale metadata has been synchronized.");
        }
    }

    public DocumentResponse updateDocument(User user, String documentId, DocumentUpdateRequest request) {
        Document doc = getDocumentAndVerifyOwnership(user, documentId);

        boolean updated = false;

        if (request != null && request.getTitle() != null) {
            String trimmedTitle = request.getTitle().trim();
            if (trimmedTitle.isEmpty()) {
                throw new IllegalArgumentException("Document title cannot be empty.");
            }
            if (trimmedTitle.length() > 255) {
                throw new IllegalArgumentException("Document title cannot exceed 255 characters.");
            }
            doc.setTitle(trimmedTitle);
            updated = true;
        }

        if (request != null && request.getCategory() != null && !request.getCategory().isBlank()) {
            DocumentCategory category = validationService.validateCategory(request.getCategory());
            doc.setCategory(category);
            updated = true;
        }

        if (updated) {
            doc.setUpdatedAt(LocalDateTime.now());
            Document saved = documentRepository.save(doc);
            logger.info("Updated document metadata for docId: {}, userId: {}", saved.getId(), user.getId());
            return mapToDocumentResponse(saved);
        }

        return mapToDocumentResponse(doc);
    }

    public void deleteDocument(User user, String documentId) {
        Document doc = getDocumentAndVerifyOwnership(user, documentId);

        // Delete from Google Drive first (handles 404 idempotently)
        googleDriveService.deleteFile(user, doc.getDriveFileId());

        // Remove metadata from MongoDB Atlas
        documentRepository.delete(doc);
        logger.info("Successfully deleted document docId: {} and removed Google Drive file: {}", documentId, doc.getDriveFileId());
    }

    public List<DocumentUploadResponse> getRecentDocuments(User user) {
        List<Document> documents = documentRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return documents.stream()
                .limit(5)
                .map(doc -> mapToUploadResponse(doc, null))
                .collect(Collectors.toList());
    }

    private Document getDocumentAndVerifyOwnership(User user, String documentId) {
        if (documentId == null || documentId.isBlank()) {
            throw new IllegalArgumentException("Document ID cannot be blank.");
        }

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

        if (!doc.getUserId().equals(user.getId())) {
            logger.warn("Security violation: User '{}' (ID: {}) attempted to access document '{}' owned by user ID '{}'",
                    user.getEmail(), user.getId(), documentId, doc.getUserId());
            throw new AccessDeniedException("You do not have permission to access or modify this document.");
        }

        return doc;
    }

    private String resolveSortField(String sortBy) {
        if (sortBy == null) return "createdAt";
        return switch (sortBy.toLowerCase()) {
            case "name", "title" -> "title";
            case "size", "filesize" -> "fileSize";
            default -> "createdAt";
        };
    }

    public DocumentResponse mapToDocumentResponse(Document doc) {
        return new DocumentResponse(
                doc.getId(),
                doc.getOriginalFileName(),
                doc.getTitle(),
                doc.getCategory() != null ? doc.getCategory().name() : DocumentCategory.OTHER.name(),
                doc.getCategory() != null ? doc.getCategory().getDisplayName() : "Other",
                doc.getMimeType(),
                doc.getFileSize(),
                doc.getDriveWebViewLink(),
                doc.getCreatedAt(),
                doc.getUpdatedAt()
        );
    }

    private DocumentUploadResponse mapToUploadResponse(Document doc, String message) {
        return new DocumentUploadResponse(
                doc.getId(),
                doc.getDriveFileId(),
                doc.getOriginalFileName(),
                doc.getTitle(),
                doc.getCategory() != null ? doc.getCategory().getDisplayName() : "Other",
                doc.getMimeType(),
                doc.getFileSize(),
                doc.getDriveWebViewLink(),
                doc.getCreatedAt(),
                message
        );
    }
}
