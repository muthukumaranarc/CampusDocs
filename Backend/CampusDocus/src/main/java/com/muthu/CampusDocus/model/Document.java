package com.muthu.CampusDocus.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@org.springframework.data.mongodb.core.mapping.Document(collection = "documents")
public class Document {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String driveFileId;

    private String originalFileName;

    private String title;

    private DocumentCategory category;

    private String mimeType;

    private Long fileSize;

    private String driveWebViewLink;

    // Mentorship Analysis fields
    private String analysisNotes;
    private String analysisStatus = "PENDING_REVIEW"; // PENDING_REVIEW, UNDER_REVIEW, APPROVED, NEEDS_REVISION
    private LocalDateTime analyzedAt;
    private String analyzedByMentorId;
    private String analyzedByMentorName;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public Document() {
    }

    public Document(String userId, String driveFileId, String originalFileName, String title,
                    DocumentCategory category, String mimeType, Long fileSize, String driveWebViewLink) {
        this.userId = userId;
        this.driveFileId = driveFileId;
        this.originalFileName = originalFileName;
        this.title = title;
        this.category = category;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.driveWebViewLink = driveWebViewLink;
        this.analysisStatus = "PENDING_REVIEW";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getDriveFileId() {
        return driveFileId;
    }

    public void setDriveFileId(String driveFileId) {
        this.driveFileId = driveFileId;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public DocumentCategory getCategory() {
        return category;
    }

    public void setCategory(DocumentCategory category) {
        this.category = category;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getDriveWebViewLink() {
        return driveWebViewLink;
    }

    public void setDriveWebViewLink(String driveWebViewLink) {
        this.driveWebViewLink = driveWebViewLink;
    }

    public String getAnalysisNotes() {
        return analysisNotes;
    }

    public void setAnalysisNotes(String analysisNotes) {
        this.analysisNotes = analysisNotes;
    }

    public String getAnalysisStatus() {
        return analysisStatus != null ? analysisStatus : "PENDING_REVIEW";
    }

    public void setAnalysisStatus(String analysisStatus) {
        this.analysisStatus = analysisStatus;
    }

    public LocalDateTime getAnalyzedAt() {
        return analyzedAt;
    }

    public void setAnalyzedAt(LocalDateTime analyzedAt) {
        this.analyzedAt = analyzedAt;
    }

    public String getAnalyzedByMentorId() {
        return analyzedByMentorId;
    }

    public void setAnalyzedByMentorId(String analyzedByMentorId) {
        this.analyzedByMentorId = analyzedByMentorId;
    }

    public String getAnalyzedByMentorName() {
        return analyzedByMentorName;
    }

    public void setAnalyzedByMentorName(String analyzedByMentorName) {
        this.analyzedByMentorName = analyzedByMentorName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
