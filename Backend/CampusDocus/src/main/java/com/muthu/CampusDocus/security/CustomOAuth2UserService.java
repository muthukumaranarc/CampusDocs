package com.muthu.CampusDocus.security;

import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    private final UserService userService;

    public CustomOAuth2UserService(UserService userService) {
        this.userService = userService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        try {
            OAuth2User oauth2User = super.loadUser(userRequest);
            Map<String, Object> attributes = oauth2User.getAttributes();

            String registrationId = userRequest.getClientRegistration().getRegistrationId();
            logger.info("Processing OAuth2 login for registrationId: {}", registrationId);

            String googleSubject = (String) attributes.get("sub");
            String email = (String) attributes.get("email");
            String name = (String) attributes.get("name");
            String picture = (String) attributes.get("picture");

            if (googleSubject == null || email == null) {
                throw new OAuth2AuthenticationException("Google identity attributes (sub, email) not provided.");
            }

            User user = userService.findOrCreateUser(googleSubject, email, name, picture);

            return new CampusDocsOAuth2User(user.getId(), googleSubject, email, name, attributes);
        } catch (OAuth2AuthenticationException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to authenticate or persist user profile during Google OAuth login: ", e);
            throw new OAuth2AuthenticationException(new org.springframework.security.oauth2.core.OAuth2Error("server_error", e.getMessage(), null), e);
        }
    }
}
