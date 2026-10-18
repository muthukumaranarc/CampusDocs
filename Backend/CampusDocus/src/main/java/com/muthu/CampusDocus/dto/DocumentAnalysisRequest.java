package com.muthu.CampusDocus.dto;

public class DocumentAnalysisRequest {

    private String analysisNotes;
    private String analysisStatus; // PENDING_REVIEW, UNDER_REVIEW, APPROVED, NEEDS_REVISION

    public DocumentAnalysisRequest() {
    }

    public DocumentAnalysisRequest(String analysisNotes, String analysisStatus) {
        this.analysisNotes = analysisNotes;
        this.analysisStatus = analysisStatus;
    }

    public String getAnalysisNotes() {
        return analysisNotes;
    }

    public void setAnalysisNotes(String analysisNotes) {
        this.analysisNotes = analysisNotes;
    }

    public String getAnalysisStatus() {
        return analysisStatus;
    }

    public void setAnalysisStatus(String analysisStatus) {
        this.analysisStatus = analysisStatus;
    }
}
