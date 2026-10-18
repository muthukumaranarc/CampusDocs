package com.muthu.CampusDocus.dto;

public class AdminStatsResponse {

    private long totalStudents;
    private long totalMentors;
    private long totalAdmins;
    private long totalDocuments;
    private long unassignedStudents;
    private long pendingReviewsCount;

    public AdminStatsResponse() {
    }

    public AdminStatsResponse(long totalStudents, long totalMentors, long totalAdmins,
                              long totalDocuments, long unassignedStudents, long pendingReviewsCount) {
        this.totalStudents = totalStudents;
        this.totalMentors = totalMentors;
        this.totalAdmins = totalAdmins;
        this.totalDocuments = totalDocuments;
        this.unassignedStudents = unassignedStudents;
        this.pendingReviewsCount = pendingReviewsCount;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getTotalMentors() {
        return totalMentors;
    }

    public void setTotalMentors(long totalMentors) {
        this.totalMentors = totalMentors;
    }

    public long getTotalAdmins() {
        return totalAdmins;
    }

    public void setTotalAdmins(long totalAdmins) {
        this.totalAdmins = totalAdmins;
    }

    public long getTotalDocuments() {
        return totalDocuments;
    }

    public void setTotalDocuments(long totalDocuments) {
        this.totalDocuments = totalDocuments;
    }

    public long getUnassignedStudents() {
        return unassignedStudents;
    }

    public void setUnassignedStudents(long unassignedStudents) {
        this.unassignedStudents = unassignedStudents;
    }

    public long getPendingReviewsCount() {
        return pendingReviewsCount;
    }

    public void setPendingReviewsCount(long pendingReviewsCount) {
        this.pendingReviewsCount = pendingReviewsCount;
    }
}
