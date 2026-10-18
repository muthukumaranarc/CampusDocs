package com.muthu.CampusDocus.dto;

import java.time.LocalDateTime;

public class DocumentResponse {

    private String id;
    private String originalFileName;
    private String title;
    private String category;
    private String categoryDisplayName;
    private String mimeType;
    private Long fileSize;
    private String driveWebViewLink;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Student & Mentor Analysis metadata
    private String studentId;
    private String studentName;
    private String studentEmail;
    private String analysisNotes;
    private String analysisStatus;
    private LocalDateTime analyzedAt;
    private String analyzedByMentorName;

    public DocumentResponse() {
    }

    public DocumentResponse(String id, String originalFileName, String title,
                            String category, String categoryDisplayName,
                            String mimeType, Long fileSize,
                            String driveWebViewLink,
                            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.originalFileName = originalFileName;
        this.title = title;
        this.category = category;
        this.categoryDisplayName = categoryDisplayName;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.driveWebViewLink = driveWebViewLink;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.analysisStatus = "PENDING_REVIEW";
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCategoryDisplayName() {
        return categoryDisplayName;
    }

    public void setCategoryDisplayName(String categoryDisplayName) {
        this.categoryDisplayName = categoryDisplayName;
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

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
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

    public String getAnalyzedByMentorName() {
        return analyzedByMentorName;
    }

    public void setAnalyzedByMentorName(String analyzedByMentorName) {
        this.analyzedByMentorName = analyzedByMentorName;
    }
}
