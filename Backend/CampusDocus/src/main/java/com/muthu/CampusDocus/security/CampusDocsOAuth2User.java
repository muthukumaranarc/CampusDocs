package com.muthu.CampusDocus.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

public class CampusDocsOAuth2User implements OidcUser {

    private final String userId;
    private final String googleSubject;
    private final String email;
    private final String displayName;
    private final Map<String, Object> attributes;
    private final Collection<? extends GrantedAuthority> authorities;
    private final OidcIdToken idToken;
    private final OidcUserInfo userInfo;

    public CampusDocsOAuth2User(String userId, String googleSubject, String email, String displayName,
                                Map<String, Object> attributes) {
        this(userId, googleSubject, email, displayName, attributes, null, null);
    }

    public CampusDocsOAuth2User(String userId, String googleSubject, String email, String displayName,
                                Map<String, Object> attributes, OidcIdToken idToken, OidcUserInfo userInfo) {
        this.userId = userId;
        this.googleSubject = googleSubject;
        this.email = email;
        this.displayName = displayName;
        this.attributes = attributes;
        this.idToken = idToken;
        this.userInfo = userInfo;
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    public String getUserId() {
        return userId;
    }

    public String getGoogleSubject() {
        return googleSubject;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getName() {
        return googleSubject;
    }

    @Override
    public Map<String, Object> getClaims() {
        return attributes;
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return userInfo;
    }

    @Override
    public OidcIdToken getIdToken() {
        return idToken;
    }
}
