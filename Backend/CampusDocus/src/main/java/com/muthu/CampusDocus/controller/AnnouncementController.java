package com.muthu.CampusDocus.controller;

import com.muthu.CampusDocus.dto.AnnouncementResponse;
import com.muthu.CampusDocus.dto.ApiResponse;
import com.muthu.CampusDocus.dto.CreateAnnouncementRequest;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.security.CampusDocsOAuth2User;
import com.muthu.CampusDocus.service.AnnouncementService;
import com.muthu.CampusDocus.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final UserService userService;

    public AnnouncementController(AnnouncementService announcementService, UserService userService) {
        this.announcementService = announcementService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<AnnouncementResponse>> getAllAnnouncements() {
        return ResponseEntity.ok(announcementService.getAllAnnouncements());
    }

    @PostMapping
    public ResponseEntity<AnnouncementResponse> createAnnouncement(@RequestBody CreateAnnouncementRequest request,
                                                                   @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        AnnouncementResponse response = announcementService.createAnnouncement(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteAnnouncement(@PathVariable("id") String id,
                                                           @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        announcementService.deleteAnnouncement(user, id);
        return ResponseEntity.ok(new ApiResponse(true, "Announcement deleted successfully."));
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
        throw new AccessDeniedException("Authentication required to manage announcements.");
    }
}
