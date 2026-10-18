package com.muthu.CampusDocus.controller;

import com.muthu.CampusDocus.dto.ApiResponse;
import com.muthu.CampusDocus.dto.OnboardingRequest;
import com.muthu.CampusDocus.dto.UpdateProfileRequest;
import com.muthu.CampusDocus.dto.UserProfileResponse;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.security.CampusDocsOAuth2User;
import com.muthu.CampusDocus.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/onboarding")
    public ResponseEntity<UserProfileResponse> completeOnboarding(
            @RequestBody OnboardingRequest request,
            @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        UserProfileResponse response = userService.completeOnboarding(user, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        UserProfileResponse response = userService.updateProfile(user, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/directory")
    public ResponseEntity<List<UserProfileResponse>> getCampusDirectory() {
        return ResponseEntity.ok(userService.getCampusDirectory());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUserProfileById(@PathVariable("id") String id) {
        User targetUser = userService.getUserById(id);
        return ResponseEntity.ok(userService.getUserProfile(targetUser));
    }

    @DeleteMapping("/account")
    public ResponseEntity<ApiResponse> deleteAccount(
            @AuthenticationPrincipal Object principal,
            HttpServletRequest request,
            HttpServletResponse response) {
        User user = resolveUser(principal);
        userService.deleteUserAccount(user);

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();

        return ResponseEntity.ok(new ApiResponse(true, "Your CampusDocs account and associations have been successfully deleted."));
    }

    private User resolveUser(Object principal) {
        if (principal instanceof CampusDocsOAuth2User customUser) {
            return userService.getUserById(customUser.getUserId());
        } else if (principal instanceof OidcUser oidcUser) {
            return userService.getUserByGoogleSubject(oidcUser.getSubject());
        } else if (principal instanceof OAuth2User oauth2User) {
            String sub = (String) oauth2User.getAttributes().get("sub");
            return userService.getUserByGoogleSubject(sub);
        }
        throw new AccessDeniedException("Authentication required to access user profile.");
    }
}
