package com.muthu.CampusDocus.dto;

public class CreateAnnouncementRequest {

    private String title;
    private String content;
    private String category; // CAMPUS_EVENT, ACADEMIC_NOTICE, WORKSHOP, STUDENT_CLUB, RESEARCH, GENERAL
    private String priority; // NORMAL, IMPORTANT, URGENT
    private Boolean pinned;

    public CreateAnnouncementRequest() {
    }

    public CreateAnnouncementRequest(String title, String content, String category, String priority, Boolean pinned) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.priority = priority;
        this.pinned = pinned;
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

    public Boolean getPinned() {
        return pinned;
    }

    public void setPinned(Boolean pinned) {
        this.pinned = pinned;
    }
}
