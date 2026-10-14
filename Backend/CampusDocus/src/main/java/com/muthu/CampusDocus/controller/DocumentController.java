package com.muthu.CampusDocus.controller;

import com.muthu.CampusDocus.dto.DocumentFileStream;
import com.muthu.CampusDocus.dto.DocumentResponse;
import com.muthu.CampusDocus.dto.DocumentUpdateRequest;
import com.muthu.CampusDocus.dto.DocumentUploadResponse;
import com.muthu.CampusDocus.dto.PageResponse;
import com.muthu.CampusDocus.model.Document;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.security.CampusDocsOAuth2User;
import com.muthu.CampusDocus.service.DocumentService;
import com.muthu.CampusDocus.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private static final Logger logger = LoggerFactory.getLogger(DocumentController.class);

    private final DocumentService documentService;
    private final UserService userService;

    public DocumentController(DocumentService documentService, UserService userService) {
        this.documentService = documentService;
        this.userService = userService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentUploadResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @AuthenticationPrincipal Object principal) {

        User user = resolveUser(principal);
        logger.info("Upload request received from user '{}' for document title '{}'", user.getEmail(), title);

        DocumentUploadResponse response = documentService.uploadDocument(user, file, title, category);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<DocumentResponse>> getDocuments(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "sortDirection", defaultValue = "desc") String sortDirection,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @AuthenticationPrincipal Object principal) {

        User user = resolveUser(principal);
        PageResponse<DocumentResponse> response = documentService.getDocuments(
                user, query, category, sortBy, sortDirection, page, size
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<DocumentUploadResponse>> getRecentDocuments(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        List<DocumentUploadResponse> recent = documentService.getRecentDocuments(user);
        return ResponseEntity.ok(recent);
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<StreamingResponseBody> previewDocument(
            @PathVariable("id") String id,
            @AuthenticationPrincipal Object principal) {

        User user = resolveUser(principal);
        return streamDocument(user, id, true);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<StreamingResponseBody> downloadDocument(
            @PathVariable("id") String id,
            @AuthenticationPrincipal Object principal) {

        User user = resolveUser(principal);
        return streamDocument(user, id, false);
    }

    @RequestMapping(value = "/{id}", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<DocumentResponse> updateDocument(
            @PathVariable("id") String id,
            @RequestBody DocumentUpdateRequest request,
            @AuthenticationPrincipal Object principal) {

        User user = resolveUser(principal);
        logger.info("Update request received from user '{}' for document ID '{}'", user.getEmail(), id);

        DocumentResponse updated = documentService.updateDocument(user, id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteDocument(
            @PathVariable("id") String id,
            @AuthenticationPrincipal Object principal) {

        User user = resolveUser(principal);
        logger.info("Delete request received from user '{}' for document ID '{}'", user.getEmail(), id);

        documentService.deleteDocument(user, id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Document deleted successfully."
        ));
    }

    private ResponseEntity<StreamingResponseBody> streamDocument(User user, String id, boolean inline) {
        DocumentFileStream fileStream = documentService.getDocumentStream(user, id);
        Document doc = fileStream.getDocument();

        String safeFilename = sanitizeFilename(doc.getOriginalFileName());
        ContentDisposition disposition = ContentDisposition.builder(inline ? "inline" : "attachment")
                .filename(safeFilename, StandardCharsets.UTF_8)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);

        if (doc.getMimeType() != null && !doc.getMimeType().isBlank()) {
            headers.setContentType(MediaType.parseMediaType(doc.getMimeType()));
        } else {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        }

        if (doc.getFileSize() != null && doc.getFileSize() > 0) {
            headers.setContentLength(doc.getFileSize());
        }

        headers.setCacheControl(CacheControl.noCache().mustRevalidate());

        StreamingResponseBody responseBody = outputStream -> {
            try (InputStream is = fileStream.getInputStream()) {
                is.transferTo(outputStream);
            }
        };

        return ResponseEntity.ok()
                .headers(headers)
                .body(responseBody);
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "document";
        }
        String clean = filename.replaceAll("[/\\\\\\r\\n\\t]", "_").replace('\0', '_').trim();
        return clean.isEmpty() ? "document" : clean;
    }

    private User resolveUser(Object principal) {
        if (principal instanceof CampusDocsOAuth2User customUser) {
            return userService.getUserById(customUser.getUserId());
        } else if (principal instanceof OidcUser oidcUser) {
            return userService.getUserByGoogleSubject(oidcUser.getSubject());
        } else if (principal instanceof OAuth2User oauth2User) {
            String sub = (String) oauth2User.getAttributes().get("sub");
            return userService.getUserByGoogleSubject(sub);
        }
        throw new AccessDeniedException("Authentication required to access documents.");
    }
}
