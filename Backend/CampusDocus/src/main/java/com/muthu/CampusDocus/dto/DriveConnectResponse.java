package com.muthu.CampusDocus.dto;

public class DriveConnectResponse {

    private String authorizationUrl;

    public DriveConnectResponse() {
    }

    public DriveConnectResponse(String authorizationUrl) {
        this.authorizationUrl = authorizationUrl;
    }

    public String getAuthorizationUrl() {
        return authorizationUrl;
    }

    public void setAuthorizationUrl(String authorizationUrl) {
        this.authorizationUrl = authorizationUrl;
    }
}
