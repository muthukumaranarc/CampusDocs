package com.muthu.CampusDocus.dto;

public class OnboardingRequest {

    private String role; // "STUDENT" or "MENTOR"
    private Integer age;
    private String department;
    private String rollNumber;
    private String phone;
    private String bio;

    public OnboardingRequest() {
    }

    public OnboardingRequest(String role, Integer age, String department, String rollNumber, String phone, String bio) {
        this.role = role;
        this.age = age;
        this.department = department;
        this.rollNumber = rollNumber;
        this.phone = phone;
        this.bio = bio;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }
}
