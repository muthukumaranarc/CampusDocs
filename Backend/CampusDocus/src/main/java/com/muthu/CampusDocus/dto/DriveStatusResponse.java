package com.muthu.CampusDocus.dto;

public class DriveStatusResponse {

    private boolean driveConnected;
    private boolean folderReady;
    private String folderId;
    private String folderName;
    private String message;

    public DriveStatusResponse() {
    }

    public DriveStatusResponse(boolean driveConnected, boolean folderReady, String folderId, String folderName, String message) {
        this.driveConnected = driveConnected;
        this.folderReady = folderReady;
        this.folderId = folderId;
        this.folderName = folderName;
        this.message = message;
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

    public String getFolderName() {
        return folderName;
    }

    public void setFolderName(String folderName) {
        this.folderName = folderName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
