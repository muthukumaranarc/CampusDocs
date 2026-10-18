package com.muthu.CampusDocus.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String title;

    private String description;

    private String type; // verification, mentor, drive, academic, system

    private String category;

    private String priority; // normal, high, urgent, low

    private boolean read;

    private String source;

    private String sourceIcon;

    private String actionLabel;

    private String actionView;

    @CreatedDate
    private LocalDateTime createdAt;

    public Notification() {
        this.createdAt = LocalDateTime.now();
        this.read = false;
        this.priority = "normal";
        this.type = "system";
    }

    public Notification(String userId, String title, String description, String type,
                        String category, String priority, String source, String sourceIcon,
                        String actionLabel, String actionView) {
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.type = type != null ? type : "system";
        this.category = category != null ? category : "SYSTEM NOTICE";
        this.priority = priority != null ? priority : "normal";
        this.source = source != null ? source : "CampusDocs System";
        this.sourceIcon = sourceIcon != null ? sourceIcon : "bell";
        this.actionLabel = actionLabel;
        this.actionView = actionView;
        this.read = false;
        this.createdAt = LocalDateTime.now();
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
