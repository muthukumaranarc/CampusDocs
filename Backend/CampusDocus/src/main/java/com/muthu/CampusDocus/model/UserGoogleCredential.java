package com.muthu.CampusDocus.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDateTime;

@Document(collection = "user_google_credentials")
public class UserGoogleCredential {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private String accessToken;

    private String refreshToken;

    private Instant tokenExpiresAt;

    private String scope;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public UserGoogleCredential() {
    }

    public UserGoogleCredential(String userId, String accessToken, String refreshToken, Instant tokenExpiresAt, String scope) {
        this.userId = userId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiresAt = tokenExpiresAt;
        this.scope = scope;
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public Instant getTokenExpiresAt() {
        return tokenExpiresAt;
    }

    public void setTokenExpiresAt(Instant tokenExpiresAt) {
        this.tokenExpiresAt = tokenExpiresAt;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isExpired() {
        if (tokenExpiresAt == null) {
            return true;
        }
        // Consider expired if within 60 seconds of expiry
        return Instant.now().isAfter(tokenExpiresAt.minusSeconds(60));
    }
}
