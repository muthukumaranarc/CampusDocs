package com.muthu.CampusDocus.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "announcements")
public class Announcement {

    @Id
    private String id;

    @Indexed
    private String authorId;

    private String authorName;

    private String authorEmail;

    private String authorRole; // STUDENT, MENTOR, ADMIN

    private String authorDepartment;

    private String authorPictureUrl;

    private String title;

    private String content;

    private String category; // CAMPUS_EVENT, ACADEMIC_NOTICE, WORKSHOP, STUDENT_CLUB, RESEARCH, GENERAL

    private String priority; // NORMAL, IMPORTANT, URGENT

    private boolean pinned;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public Announcement() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.priority = "NORMAL";
        this.category = "GENERAL";
        this.pinned = false;
    }

    public Announcement(String authorId, String authorName, String authorEmail, String authorRole,
                        String authorDepartment, String authorPictureUrl, String title, String content,
                        String category, String priority, boolean pinned) {
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorEmail = authorEmail;
        this.authorRole = authorRole;
        this.authorDepartment = authorDepartment;
        this.authorPictureUrl = authorPictureUrl;
        this.title = title;
        this.content = content;
        this.category = category != null && !category.isBlank() ? category : "GENERAL";
        this.priority = priority != null && !priority.isBlank() ? priority : "NORMAL";
        this.pinned = pinned;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAuthorId() {
        return authorId;
    }

    public void setAuthorId(String authorId) {
        this.authorId = authorId;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getAuthorEmail() {
        return authorEmail;
    }

    public void setAuthorEmail(String authorEmail) {
        this.authorEmail = authorEmail;
    }

    public String getAuthorRole() {
        return authorRole;
    }

    public void setAuthorRole(String authorRole) {
        this.authorRole = authorRole;
    }

    public String getAuthorDepartment() {
        return authorDepartment;
    }

    public void setAuthorDepartment(String authorDepartment) {
        this.authorDepartment = authorDepartment;
    }

    public String getAuthorPictureUrl() {
        return authorPictureUrl;
    }

    public void setAuthorPictureUrl(String authorPictureUrl) {
        this.authorPictureUrl = authorPictureUrl;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
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

    public boolean isPinned() {
        return pinned;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
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
