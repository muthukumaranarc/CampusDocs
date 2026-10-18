package com.muthu.CampusDocus.dto;

import com.muthu.CampusDocus.model.UserRole;

import java.time.LocalDateTime;

public class UserProfileResponse {

    private String id;
    private String email;
    private String displayName;
    private String pictureUrl;
    private UserRole role;
    private boolean onboardingCompleted;
    private Integer age;
    private String phone;
    private String department;
    private String rollNumber;
    private String bio;
    private String headline;
    private String githubUrl;
    private String linkedinUrl;
    private String websiteUrl;
    private String twitterUrl;
    private String otherUrl;
    private String mentorId;
    private String mentorName;
    private String mentorEmail;
    private boolean driveConnected;
    private boolean folderReady;
    private String folderId;
    private LocalDateTime createdAt;

    public UserProfileResponse() {
    }

    public UserProfileResponse(String id, String email, String displayName, String pictureUrl,
                               UserRole role, String mentorId, String mentorName, String mentorEmail,
                               boolean driveConnected, boolean folderReady, String folderId,
                               LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.pictureUrl = pictureUrl;
        this.role = role != null ? role : UserRole.STUDENT;
        this.mentorId = mentorId;
        this.mentorName = mentorName;
        this.mentorEmail = mentorEmail;
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

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void setOnboardingCompleted(boolean onboardingCompleted) {
        this.onboardingCompleted = onboardingCompleted;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getRollNumber() {
        return rollNumber;
    }

    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getMentorId() {
        return mentorId;
    }

    public void setMentorId(String mentorId) {
        this.mentorId = mentorId;
    }

    public String getMentorName() {
        return mentorName;
    }

    public void setMentorName(String mentorName) {
        this.mentorName = mentorName;
    }

    public String getMentorEmail() {
        return mentorEmail;
    }

    public void setMentorEmail(String mentorEmail) {
        this.mentorEmail = mentorEmail;
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

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public String getGithubUrl() {
        return githubUrl;
    }

    public void setGithubUrl(String githubUrl) {
        this.githubUrl = githubUrl;
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public void setLinkedinUrl(String linkedinUrl) {
        this.linkedinUrl = linkedinUrl;
    }

    public String getWebsiteUrl() {
        return websiteUrl;
    }

    public void setWebsiteUrl(String websiteUrl) {
        this.websiteUrl = websiteUrl;
    }

    public String getTwitterUrl() {
        return twitterUrl;
    }

    public void setTwitterUrl(String twitterUrl) {
        this.twitterUrl = twitterUrl;
    }

    public String getOtherUrl() {
        return otherUrl;
    }

    public void setOtherUrl(String otherUrl) {
        this.otherUrl = otherUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
