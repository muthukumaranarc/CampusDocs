package com.muthu.CampusDocus.dto;

import java.time.LocalDateTime;

public class DocumentUploadResponse {

    private String id;
    private String driveFileId;
    private String originalFileName;
    private String title;
    private String category;
    private String mimeType;
    private Long fileSize;
    private String driveWebViewLink;
    private LocalDateTime uploadedAt;
    private String message;

    public DocumentUploadResponse() {
    }

    public DocumentUploadResponse(String id, String driveFileId, String originalFileName, String title,
                                  String category, String mimeType, Long fileSize,
                                  String driveWebViewLink, LocalDateTime uploadedAt, String message) {
        this.id = id;
        this.driveFileId = driveFileId;
        this.originalFileName = originalFileName;
        this.title = title;
        this.category = category;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.driveWebViewLink = driveWebViewLink;
        this.uploadedAt = uploadedAt;
        this.message = message;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
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

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
