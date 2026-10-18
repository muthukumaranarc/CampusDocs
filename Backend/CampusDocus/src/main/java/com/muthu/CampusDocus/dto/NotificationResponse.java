package com.muthu.CampusDocus.dto;

import java.time.LocalDateTime;

public class NotificationResponse {

    private String id;
    private String userId;
    private String title;
    private String description;
    private String type;
    private String category;
    private String priority;
    private boolean read;
    private String source;
    private String sourceIcon;
    private String actionLabel;
    private String actionView;
    private LocalDateTime createdAt;

    public NotificationResponse() {
    }

    public NotificationResponse(String id, String userId, String title, String description,
                                String type, String category, String priority, boolean read,
                                String source, String sourceIcon, String actionLabel,
                                String actionView, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.type = type;
        this.category = category;
        this.priority = priority;
        this.read = read;
        this.source = source;
        this.sourceIcon = sourceIcon;
        this.actionLabel = actionLabel;
        this.actionView = actionView;
        this.createdAt = createdAt;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getSourceIcon() {
        return sourceIcon;
    }

    public void setSourceIcon(String sourceIcon) {
        this.sourceIcon = sourceIcon;
    }

    public String getActionLabel() {
        return actionLabel;
    }

    public void setActionLabel(String actionLabel) {
        this.actionLabel = actionLabel;
    }

    public String getActionView() {
        return actionView;
    }

    public void setActionView(String actionView) {
        this.actionView = actionView;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
