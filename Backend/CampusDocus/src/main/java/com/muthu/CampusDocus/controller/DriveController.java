package com.muthu.CampusDocus.controller;

import com.google.api.services.drive.model.File;
import com.muthu.CampusDocus.dto.ApiResponse;
import com.muthu.CampusDocus.dto.DriveConnectResponse;
import com.muthu.CampusDocus.dto.DriveStatusResponse;
import com.muthu.CampusDocus.exception.DriveException;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.security.CampusDocsOAuth2User;
import com.muthu.CampusDocus.service.GoogleDriveService;
import com.muthu.CampusDocus.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/drive")
public class DriveController {

    private final GoogleDriveService googleDriveService;
    private final UserService userService;

    public DriveController(GoogleDriveService googleDriveService, UserService userService) {
        this.googleDriveService = googleDriveService;
        this.userService = userService;
    }

    @PostMapping("/connect")
    public ResponseEntity<DriveConnectResponse> initiateDriveConnect() {
        String authorizationUrl = "/oauth2/authorization/google-drive";
        return ResponseEntity.ok(new DriveConnectResponse(authorizationUrl));
    }

    @GetMapping("/status")
    public ResponseEntity<DriveStatusResponse> getDriveStatus(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        DriveStatusResponse status = googleDriveService.getStatus(user);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/folder/ensure")
    public ResponseEntity<DriveStatusResponse> ensureFolder(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        File folder = googleDriveService.ensureDedicatedFolder(user);
        DriveStatusResponse status = new DriveStatusResponse(
                true,
                true,
                folder.getId(),
                folder.getName(),
                "CampusDocs folder is ready."
        );
        return ResponseEntity.ok(status);
    }

    @PostMapping("/disconnect")
    public ResponseEntity<ApiResponse> disconnectDrive(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        userService.disconnectDrive(user.getId());
        return ResponseEntity.ok(new ApiResponse(true, "Google Drive disconnected successfully."));
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
        throw new DriveException("Authentication required to access Drive features", true);
    }
}
