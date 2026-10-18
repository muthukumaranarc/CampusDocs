package com.muthu.CampusDocus.dto;

public class AssignMentorRequest {

    private String mentorId;

    public AssignMentorRequest() {
    }

    public AssignMentorRequest(String mentorId) {
        this.mentorId = mentorId;
    }

    public String getMentorId() {
        return mentorId;
    }

    public void setMentorId(String mentorId) {
        this.mentorId = mentorId;
    }
}
