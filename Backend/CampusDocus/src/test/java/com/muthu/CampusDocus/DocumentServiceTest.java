package com.muthu.CampusDocus;

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
import com.muthu.CampusDocus.service.DocumentService;
import com.muthu.CampusDocus.service.DocumentValidationService;
import com.muthu.CampusDocus.service.GoogleDriveService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private GoogleDriveService googleDriveService;

    @Mock
    private MongoTemplate mongoTemplate;

    private DocumentValidationService validationService;
    private DocumentService documentService;

    private User testUser;
    private User otherUser;
    private MockMultipartFile validPdfFile;

    @BeforeEach
    void setUp() {
        validationService = new DocumentValidationService();
        ReflectionTestUtils.setField(validationService, "maxFileSizeBytes", 10485760L); // 10 MB

        documentService = new DocumentService(documentRepository, validationService, googleDriveService, mongoTemplate);

        testUser = new User("google-sub-123", "student@college.edu", "Student Name", "https://avatar.url");
        testUser.setId("user-mongo-id-1");
        testUser.setDriveConnected(true);
        testUser.setCampusDocsFolderId("campusdocs-drive-folder-id");

        otherUser = new User("google-sub-999", "other@college.edu", "Other User", "https://avatar.url/2");
        otherUser.setId("user-mongo-id-2");
        otherUser.setDriveConnected(true);

        byte[] fakePdfBytes = "%PDF-1.4 sample pdf content for testing".getBytes(StandardCharsets.UTF_8);
        validPdfFile = new MockMultipartFile(
                "file",
                "grade_sheet.pdf",
                "application/pdf",
                fakePdfBytes
        );
    }

    // ==========================================
    // MODULE 2 TESTS (Upload & Compensatory Rollback)
    // ==========================================

    @Test
    @DisplayName("Should successfully upload document and persist metadata")
    void uploadDocument_success() {
        File mockedDriveFile = new File();
        mockedDriveFile.setId("drive-file-id-456");
        mockedDriveFile.setWebViewLink("https://drive.google.com/file/d/drive-file-id-456/view");

        when(googleDriveService.uploadFile(eq(testUser), any(InputStream.class), eq("grade_sheet.pdf"), eq("application/pdf"), anyLong()))
                .thenReturn(mockedDriveFile);

        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            doc.setId("mongo-doc-id-789");
            return doc;
        });

        DocumentUploadResponse response = documentService.uploadDocument(testUser, validPdfFile, "Semester 1 Grade Sheet", "ACADEMIC_RECORDS");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("mongo-doc-id-789");
        assertThat(response.getDriveFileId()).isEqualTo("drive-file-id-456");
        assertThat(response.getTitle()).isEqualTo("Semester 1 Grade Sheet");
        assertThat(response.getCategory()).isEqualTo("Academic Records");
        assertThat(response.getMimeType()).isEqualTo("application/pdf");

        verify(googleDriveService).uploadFile(eq(testUser), any(InputStream.class), eq("grade_sheet.pdf"), eq("application/pdf"), anyLong());
        verify(documentRepository).save(any(Document.class));
    }

    @Test
    @DisplayName("Should reject upload when user Google Drive is not connected")
    void uploadDocument_driveNotConnected_throwsException() {
        testUser.setDriveConnected(false);

        assertThatThrownBy(() -> documentService.uploadDocument(testUser, validPdfFile, "Title", "CERTIFICATES"))
                .isInstanceOf(DriveException.class)
                .hasMessageContaining("Google Drive is not connected");

        verify(googleDriveService, never()).uploadFile(any(), any(), any(), any(), anyLong());
        verify(documentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should trigger compensatory rollback if database save fails after Drive upload")
    void uploadDocument_dbFails_triggersRollback() {
        File mockedDriveFile = new File();
        mockedDriveFile.setId("orphan-drive-id");

        when(googleDriveService.uploadFile(eq(testUser), any(InputStream.class), anyString(), anyString(), anyLong()))
                .thenReturn(mockedDriveFile);

        when(documentRepository.save(any(Document.class))).thenThrow(new RuntimeException("MongoDB connection timeout"));

        assertThatThrownBy(() -> documentService.uploadDocument(testUser, validPdfFile, "Grade Sheet", "ACADEMIC_RECORDS"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Database error saving document metadata. The uploaded file was rolled back.");

        verify(googleDriveService).deleteFile(testUser, "orphan-drive-id");
    }

    // ==========================================
    // MODULE 3 TESTS
    // ==========================================

    @Test
    @DisplayName("1. Should list documents filtered by current user only")
    void listDocuments_currentAuthenticatedUserOnly() {
        Document doc1 = new Document(testUser.getId(), "d-1", "doc1.pdf", "Doc 1", DocumentCategory.ACADEMIC_RECORDS, "application/pdf", 1024L, "link1");
        doc1.setId("m-1");

        when(mongoTemplate.count(any(Query.class), eq(Document.class))).thenReturn(1L);
        when(mongoTemplate.find(any(Query.class), eq(Document.class))).thenReturn(List.of(doc1));

        PageResponse<DocumentResponse> result = documentService.getDocuments(testUser, null, null, "createdAt", "desc", 0, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo("m-1");
        assertThat(result.getTotalElements()).isEqualTo(1L);
    }

    @Test
    @DisplayName("2. Should support search, category filter, sorting, and pagination")
    void listDocuments_searchFilterSortingPagination() {
        Document doc = new Document(testUser.getId(), "d-2", "marksheet.pdf", "Final Marksheet", DocumentCategory.CERTIFICATES, "application/pdf", 2048L, "link2");
        doc.setId("m-2");

        when(mongoTemplate.count(any(Query.class), eq(Document.class))).thenReturn(1L);
        when(mongoTemplate.find(any(Query.class), eq(Document.class))).thenReturn(List.of(doc));

        PageResponse<DocumentResponse> result = documentService.getDocuments(testUser, "marksheet", "CERTIFICATES", "title", "asc", 0, 5);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Final Marksheet");
        assertThat(result.getContent().get(0).getCategory()).isEqualTo("CERTIFICATES");
    }

    @Test
    @DisplayName("4. Should prevent a user from previewing another user's document")
    void preventPreview_anotherUsersDocument() {
        Document otherDoc = new Document(otherUser.getId(), "d-other", "secret.pdf", "Other Secret", DocumentCategory.PERSONAL_DOCUMENTS, "application/pdf", 1024L, "link");
        otherDoc.setId("m-other");

        when(documentRepository.findById("m-other")).thenReturn(Optional.of(otherDoc));

        assertThatThrownBy(() -> documentService.getDocumentStream(testUser, "m-other"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You do not have permission");

        verify(googleDriveService, never()).downloadFile(any(), any());
    }

    @Test
    @DisplayName("5. Should prevent a user from downloading another user's document")
    void preventDownload_anotherUsersDocument() {
        Document otherDoc = new Document(otherUser.getId(), "d-other-2", "secret2.pdf", "Other Secret 2", DocumentCategory.PERSONAL_DOCUMENTS, "application/pdf", 1024L, "link");
        otherDoc.setId("m-other-2");

        when(documentRepository.findById("m-other-2")).thenReturn(Optional.of(otherDoc));

        assertThatThrownBy(() -> documentService.getDocumentStream(testUser, "m-other-2"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You do not have permission");

        verify(googleDriveService, never()).downloadFile(any(), any());
    }

    @Test
    @DisplayName("6. Should prevent a user from renaming another user's document")
    void preventRename_anotherUsersDocument() {
        Document otherDoc = new Document(otherUser.getId(), "d-other-3", "file.pdf", "Other Title", DocumentCategory.OTHER, "application/pdf", 1024L, "link");
        otherDoc.setId("m-other-3");

        when(documentRepository.findById("m-other-3")).thenReturn(Optional.of(otherDoc));

        DocumentUpdateRequest updateReq = new DocumentUpdateRequest("Hacked Title", null);

        assertThatThrownBy(() -> documentService.updateDocument(testUser, "m-other-3", updateReq))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You do not have permission");

        verify(documentRepository, never()).save(any());
    }

    @Test
    @DisplayName("7. Should prevent a user from deleting another user's document")
    void preventDelete_anotherUsersDocument() {
        Document otherDoc = new Document(otherUser.getId(), "d-other-4", "file.pdf", "Other Title", DocumentCategory.OTHER, "application/pdf", 1024L, "link");
        otherDoc.setId("m-other-4");

        when(documentRepository.findById("m-other-4")).thenReturn(Optional.of(otherDoc));

        assertThatThrownBy(() -> documentService.deleteDocument(testUser, "m-other-4"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You do not have permission");

        verify(googleDriveService, never()).deleteFile(any(), any());
        verify(documentRepository, never()).delete(any());
    }

    @Test
    @DisplayName("8. Successful preview and download with mocked Google Drive streaming")
    void successfulPreviewAndDownload_streamFromDrive() {
        Document myDoc = new Document(testUser.getId(), "drive-123", "grade_sheet.pdf", "Grade Sheet", DocumentCategory.ACADEMIC_RECORDS, "application/pdf", 1024L, "link");
        myDoc.setId("doc-123");

        when(documentRepository.findById("doc-123")).thenReturn(Optional.of(myDoc));

        InputStream mockedStream = new ByteArrayInputStream("PDF-BYTE-STREAM".getBytes(StandardCharsets.UTF_8));
        when(googleDriveService.downloadFile(testUser, "drive-123")).thenReturn(mockedStream);

        DocumentFileStream result = documentService.getDocumentStream(testUser, "doc-123");

        assertThat(result).isNotNull();
        assertThat(result.getDocument().getId()).isEqualTo("doc-123");
        assertThat(result.getInputStream()).isNotNull();

        verify(googleDriveService).downloadFile(testUser, "drive-123");
    }

    @Test
    @DisplayName("9. Successful rename and category update")
    void successfulRenameAndCategoryUpdate() {
        Document myDoc = new Document(testUser.getId(), "drive-123", "grade_sheet.pdf", "Old Title", DocumentCategory.OTHER, "application/pdf", 1024L, "link");
        myDoc.setId("doc-123");

        when(documentRepository.findById("doc-123")).thenReturn(Optional.of(myDoc));
        when(documentRepository.save(any(Document.class))).thenAnswer(i -> i.getArgument(0));

        DocumentUpdateRequest updateReq = new DocumentUpdateRequest("Updated Certificate Title", "CERTIFICATES");
        DocumentResponse updated = documentService.updateDocument(testUser, "doc-123", updateReq);

        assertThat(updated.getTitle()).isEqualTo("Updated Certificate Title");
        assertThat(updated.getCategory()).isEqualTo("CERTIFICATES");
        assertThat(updated.getCategoryDisplayName()).isEqualTo("Certificates");

        verify(documentRepository).save(myDoc);
    }

    @Test
    @DisplayName("10. Successful deletion from Drive and metadata cleanup")
    void successfulDeletionFromDriveAndMetadataCleanup() {
        Document myDoc = new Document(testUser.getId(), "drive-to-delete", "grade_sheet.pdf", "Grade Sheet", DocumentCategory.ACADEMIC_RECORDS, "application/pdf", 1024L, "link");
        myDoc.setId("doc-to-delete");

        when(documentRepository.findById("doc-to-delete")).thenReturn(Optional.of(myDoc));

        documentService.deleteDocument(testUser, "doc-to-delete");

        verify(googleDriveService).deleteFile(testUser, "drive-to-delete");
        verify(documentRepository).delete(myDoc);
    }

    @Test
    @DisplayName("11. Handling files deleted directly from Google Drive (graceful stale metadata cleanup)")
    void handlingFilesDeletedDirectlyFromGoogleDrive_cleansUpStaleMetadata() {
        Document myDoc = new Document(testUser.getId(), "missing-drive-id", "lost.pdf", "Lost Document", DocumentCategory.ACADEMIC_RECORDS, "application/pdf", 1024L, "link");
        myDoc.setId("doc-lost");

        when(documentRepository.findById("doc-lost")).thenReturn(Optional.of(myDoc));
        when(googleDriveService.downloadFile(testUser, "missing-drive-id"))
                .thenThrow(new ResourceNotFoundException("File not found in Google Drive"));

        assertThatThrownBy(() -> documentService.getDocumentStream(testUser, "doc-lost"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Stale metadata has been synchronized");

        // Verify stale database metadata was deleted
        verify(documentRepository).delete(myDoc);
    }

    @Test
    @DisplayName("12. Handling Drive API failures without falsely reporting success during deletion")
    void handlingDriveApiFailures_doesNotFalselyReportSuccess() {
        Document myDoc = new Document(testUser.getId(), "drive-err-id", "doc.pdf", "Doc", DocumentCategory.ACADEMIC_RECORDS, "application/pdf", 1024L, "link");
        myDoc.setId("doc-err");

        when(documentRepository.findById("doc-err")).thenReturn(Optional.of(myDoc));
        org.mockito.Mockito.doThrow(new DriveException("Google Drive service unavailable", false))
                .when(googleDriveService).deleteFile(testUser, "drive-err-id");

        assertThatThrownBy(() -> documentService.deleteDocument(testUser, "doc-err"))
                .isInstanceOf(DriveException.class)
                .hasMessageContaining("Google Drive service unavailable");

        // Verify database metadata was NOT deleted because Drive deletion failed
        verify(documentRepository, never()).delete(any());
    }
}
