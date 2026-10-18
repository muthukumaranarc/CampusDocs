package com.muthu.CampusDocus.model;

public enum UserRole {
    ADMIN,
    MENTOR,
    STUDENT;

    public static UserRole fromString(String role) {
        if (role == null || role.isBlank()) {
            return STUDENT;
        }
        try {
            return UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return STUDENT;
        }
    }
}
