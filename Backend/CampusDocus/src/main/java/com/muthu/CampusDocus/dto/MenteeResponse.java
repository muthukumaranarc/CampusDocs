package com.muthu.CampusDocus.dto;

import java.time.LocalDateTime;

public class MenteeResponse {

    private String id;
    private String displayName;
    private String email;
    private String pictureUrl;
    private long documentCount;
    private long pendingReviewCount;
    private long approvedCount;
    private long needsRevisionCount;
    private LocalDateTime createdAt;

    public MenteeResponse() {
    }

    public MenteeResponse(String id, String displayName, String email, String pictureUrl,
                          long documentCount, long pendingReviewCount, long approvedCount,
                          long needsRevisionCount, LocalDateTime createdAt) {
        this.id = id;
        this.displayName = displayName;
        this.email = email;
        this.pictureUrl = pictureUrl;
        this.documentCount = documentCount;
        this.pendingReviewCount = pendingReviewCount;
        this.approvedCount = approvedCount;
        this.needsRevisionCount = needsRevisionCount;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPictureUrl() {
        return pictureUrl;
    }

    public void setPictureUrl(String pictureUrl) {
        this.pictureUrl = pictureUrl;
    }

    public long getDocumentCount() {
        return documentCount;
    }

    public void setDocumentCount(long documentCount) {
        this.documentCount = documentCount;
    }

    public long getPendingReviewCount() {
        return pendingReviewCount;
    }

    public void setPendingReviewCount(long pendingReviewCount) {
        this.pendingReviewCount = pendingReviewCount;
    }

    public long getApprovedCount() {
        return approvedCount;
    }

    public void setApprovedCount(long approvedCount) {
        this.approvedCount = approvedCount;
    }

    public long getNeedsRevisionCount() {
        return needsRevisionCount;
    }

    public void setNeedsRevisionCount(long needsRevisionCount) {
        this.needsRevisionCount = needsRevisionCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
