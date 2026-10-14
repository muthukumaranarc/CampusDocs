package com.muthu.CampusDocus.controller;

import com.muthu.CampusDocus.dto.UserProfileResponse;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.security.CampusDocsOAuth2User;
import com.muthu.CampusDocus.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal Object principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"authenticated\":false,\"message\":\"No authenticated session found\"}");
        }

        User user = null;
        if (principal instanceof CampusDocsOAuth2User customUser) {
            user = userService.getUserById(customUser.getUserId());
        } else if (principal instanceof OidcUser oidcUser) {
            user = userService.getUserByGoogleSubject(oidcUser.getSubject());
        } else if (principal instanceof OAuth2User oauth2User) {
            String sub = (String) oauth2User.getAttributes().get("sub");
            user = userService.getUserByGoogleSubject(sub);
        }

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"authenticated\":false,\"message\":\"User record not found\"}");
        }

        UserProfileResponse profile = userService.getUserProfile(user);
        return ResponseEntity.ok(profile);
    }
}
