package com.muthu.CampusDocus.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String googleSubject;

    @Indexed(unique = true)
    private String email;

    private String displayName;

    private String pictureUrl;

    private UserRole role = UserRole.STUDENT;

    private boolean onboardingCompleted = false;

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

    // For students: exactly one mentor (1-to-1 from student to mentor, 1-to-N from mentor to students)
    @Indexed
    private String mentorId;
    private String mentorName;
    private String mentorEmail;

    private boolean driveConnected = false;

    private String campusDocsFolderId;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public User() {
    }

    public User(String googleSubject, String email, String displayName, String pictureUrl) {
        this.googleSubject = googleSubject;
        this.email = email;
        this.displayName = displayName;
        this.pictureUrl = pictureUrl;
        this.role = UserRole.STUDENT;
        this.driveConnected = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public User(String email, String displayName, UserRole role) {
        this.email = email;
        this.displayName = displayName;
        this.role = role != null ? role : UserRole.STUDENT;
        this.driveConnected = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getGoogleSubject() {
        return googleSubject;
    }

    public void setGoogleSubject(String googleSubject) {
        this.googleSubject = googleSubject;
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
        return role != null ? role : UserRole.STUDENT;
    }

    public void setRole(UserRole role) {
        this.role = role;
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

    public String getCampusDocsFolderId() {
        return campusDocsFolderId;
    }

    public void setCampusDocsFolderId(String campusDocsFolderId) {
        this.campusDocsFolderId = campusDocsFolderId;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
