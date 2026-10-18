package com.muthu.CampusDocus.security;

import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CustomOidcUserService extends OidcUserService {

    private static final Logger logger = LoggerFactory.getLogger(CustomOidcUserService.class);

    private final UserService userService;

    public CustomOidcUserService(UserService userService) {
        this.userService = userService;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        try {
            OidcUser oidcUser = super.loadUser(userRequest);
            Map<String, Object> attributes = oidcUser.getAttributes();

            String registrationId = userRequest.getClientRegistration().getRegistrationId();
            logger.info("Processing Google OIDC login for registrationId: {}", registrationId);

            String googleSubject = oidcUser.getSubject();
            String email = oidcUser.getEmail();
            String name = oidcUser.getFullName();
            String picture = oidcUser.getPicture();

            if (googleSubject == null || email == null) {
                throw new OAuth2AuthenticationException("Google OIDC attributes (sub, email) missing.");
            }

            User user = userService.findOrCreateUser(googleSubject, email, name, picture);
            logger.info("Successfully persisted/synced user in MongoDB: id={}, email={}", user.getId(), user.getEmail());

            return new CampusDocsOAuth2User(
                    user.getId(),
                    googleSubject,
                    email,
                    name,
                    attributes,
                    oidcUser.getIdToken(),
                    oidcUser.getUserInfo()
            );
        } catch (OAuth2AuthenticationException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to authenticate or persist user profile during Google OIDC login: ", e);
            throw new OAuth2AuthenticationException(new org.springframework.security.oauth2.core.OAuth2Error("server_error", e.getMessage(), null), e);
        }
    }
}
