package com.muthu.CampusDocus.dto;

import com.muthu.CampusDocus.model.UserRole;

public class CreateUserRequest {

    private String email;
    private String displayName;
    private UserRole role = UserRole.STUDENT;
    private String mentorId;

    public CreateUserRequest() {
    }

    public CreateUserRequest(String email, String displayName, UserRole role, String mentorId) {
        this.email = email;
        this.displayName = displayName;
        this.role = role != null ? role : UserRole.STUDENT;
        this.mentorId = mentorId;
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

    public UserRole getRole() {
        return role;
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
}
