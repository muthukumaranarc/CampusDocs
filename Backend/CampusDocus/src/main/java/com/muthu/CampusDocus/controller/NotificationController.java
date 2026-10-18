package com.muthu.CampusDocus.controller;

import com.muthu.CampusDocus.dto.ApiResponse;
import com.muthu.CampusDocus.dto.NotificationResponse;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.security.CampusDocsOAuth2User;
import com.muthu.CampusDocus.service.NotificationService;
import com.muthu.CampusDocus.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(notificationService.getUserNotifications(user));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        long count = notificationService.getUnreadCount(user);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable("id") String id,
                                                           @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(notificationService.markAsRead(user, id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse> markAllAsRead(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(new ApiResponse(true, "All notifications marked as read."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteNotification(@PathVariable("id") String id,
                                                           @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        notificationService.deleteNotification(user, id);
        return ResponseEntity.ok(new ApiResponse(true, "Notification deleted successfully."));
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
        throw new AccessDeniedException("Authentication required to access notifications.");
    }
}
