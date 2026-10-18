package com.muthu.CampusDocus.dto;

public class MentorResponse {

    private String id;
    private String displayName;
    private String email;
    private String pictureUrl;
    private long menteeCount;

    public MentorResponse() {
    }

    public MentorResponse(String id, String displayName, String email, String pictureUrl, long menteeCount) {
        this.id = id;
        this.displayName = displayName;
        this.email = email;
        this.pictureUrl = pictureUrl;
        this.menteeCount = menteeCount;
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

    public long getMenteeCount() {
        return menteeCount;
    }

    public void setMenteeCount(long menteeCount) {
        this.menteeCount = menteeCount;
    }
}
