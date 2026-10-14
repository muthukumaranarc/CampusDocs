package com.muthu.CampusDocus.dto;

import java.time.LocalDateTime;

public class UserProfileResponse {

    private String id;
    private String email;
    private String displayName;
    private String pictureUrl;
    private boolean driveConnected;
    private boolean folderReady;
    private String folderId;
    private LocalDateTime createdAt;

    public UserProfileResponse() {
    }

    public UserProfileResponse(String id, String email, String displayName, String pictureUrl,
                               boolean driveConnected, boolean folderReady, String folderId,
                               LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.pictureUrl = pictureUrl;
        this.driveConnected = driveConnected;
        this.folderReady = folderReady;
        this.folderId = folderId;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getPictureUrl() {
        return pictureUrl;
    }

    public void setPictureUrl(String pictureUrl) {
        this.pictureUrl = pictureUrl;
    }

    public boolean isDriveConnected() {
        return driveConnected;
    }

    public void setDriveConnected(boolean driveConnected) {
        this.driveConnected = driveConnected;
    }

    public boolean isFolderReady() {
        return folderReady;
    }

    public void setFolderReady(boolean folderReady) {
        this.folderReady = folderReady;
    }

    public String getFolderId() {
        return folderId;
    }

    public void setFolderId(String folderId) {
        this.folderId = folderId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
