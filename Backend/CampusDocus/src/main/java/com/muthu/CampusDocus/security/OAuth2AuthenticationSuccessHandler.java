package com.muthu.CampusDocus.security;

import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.service.GoogleDriveService;
import com.muthu.CampusDocus.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final OAuth2AuthorizedClientService authorizedClientService;
    private final UserService userService;
    private final GoogleDriveService googleDriveService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public OAuth2AuthenticationSuccessHandler(OAuth2AuthorizedClientService authorizedClientService,
                                              UserService userService,
                                              GoogleDriveService googleDriveService) {
        this.authorizedClientService = authorizedClientService;
        this.userService = userService;
        this.googleDriveService = googleDriveService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        if (response.isCommitted()) {
            logger.debug("Response has already been committed. Unable to redirect.");
            return;
        }

        String targetUrl = cleanFrontendUrl(frontendUrl) + "/dashboard?login=success";

        try {
            if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
                String clientRegistrationId = oauthToken.getAuthorizedClientRegistrationId();
                logger.info("OAuth2 login succeeded for registration: {}", clientRegistrationId);

                User user = resolveUser(authentication.getPrincipal());
                logger.info("Resolved user in success handler: id={}, email={}", user.getId(), user.getEmail());

                OAuth2AuthorizedClient authorizedClient = authorizedClientService.loadAuthorizedClient(
                        clientRegistrationId,
                        oauthToken.getName()
                );

                if (authorizedClient != null && authorizedClient.getAccessToken() != null) {
                    String accessToken = authorizedClient.getAccessToken().getTokenValue();
                    String refreshToken = authorizedClient.getRefreshToken() != null
                            ? authorizedClient.getRefreshToken().getTokenValue()
                            : null;

                    Long expiresInSeconds = null;
                    if (authorizedClient.getAccessToken().getExpiresAt() != null) {
                        expiresInSeconds = Duration.between(Instant.now(), authorizedClient.getAccessToken().getExpiresAt()).toSeconds();
                    }

                    String scopes = String.join(" ", authorizedClient.getClientRegistration().getScopes());

                    boolean hasDriveScope = "google-drive".equals(clientRegistrationId)
                            || (scopes != null && scopes.toLowerCase().contains("drive"));

                    if (hasDriveScope) {
                        logger.info("Saving Google Drive credentials for user ID: {} (scopes: {})", user.getId(), scopes);
                        try {
                            googleDriveService.saveUserCredential(user, accessToken, refreshToken, expiresInSeconds, scopes);
                            googleDriveService.ensureDedicatedFolder(user);
                        } catch (Exception e) {
                            logger.warn("Drive folder or credential setup warning after OAuth: {}", e.getMessage());
                        }

                        if ("google-drive".equals(clientRegistrationId)) {
                            targetUrl = cleanFrontendUrl(frontendUrl) + "/dashboard?drive_connected=true";
                        }
                    }
                }
            }

            getRedirectStrategy().sendRedirect(request, response, targetUrl);

        } catch (Exception ex) {
            logger.error("Error in OAuth2 authentication success handler: ", ex);
            String errorMsg = URLEncoder.encode(
                    "Authentication completed but user session initialization failed: " + ex.getMessage(),
                    StandardCharsets.UTF_8
            );
            getRedirectStrategy().sendRedirect(request, response, cleanFrontendUrl(frontendUrl) + "/login?error=" + errorMsg);
        }
    }

    private User resolveUser(Object principal) {
        if (principal instanceof CampusDocsOAuth2User customUser) {
            if (customUser.getUserId() != null && !customUser.getUserId().isBlank()) {
                try {
                    return userService.getUserById(customUser.getUserId());
                } catch (Exception e) {
                    logger.warn("Could not find user by ID {}: {}. Falling back to subject/email resolution.",
                            customUser.getUserId(), e.getMessage());
                }
            }
            return userService.findOrCreateUser(customUser.getGoogleSubject(), customUser.getEmail(), customUser.getDisplayName(), null);
        }

        if (principal instanceof OidcUser oidcUser) {
            String googleSubject = oidcUser.getSubject();
            String email = oidcUser.getEmail();
            String name = oidcUser.getFullName();
            String picture = oidcUser.getPicture();
            return userService.findOrCreateUser(googleSubject, email, name, picture);
        }

        if (principal instanceof OAuth2User oauth2User) {
            Map<String, Object> attributes = oauth2User.getAttributes();
            String googleSubject = (String) attributes.get("sub");
            String email = (String) attributes.get("email");
            String name = (String) attributes.get("name");
            String picture = (String) attributes.get("picture");
            return userService.findOrCreateUser(googleSubject, email, name, picture);
        }

        throw new IllegalStateException("Unknown principal type: " + (principal != null ? principal.getClass().getName() : "null"));
    }

    private String cleanFrontendUrl(String url) {
        if (url == null || url.isBlank()) {
            return "http://localhost:5173";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
