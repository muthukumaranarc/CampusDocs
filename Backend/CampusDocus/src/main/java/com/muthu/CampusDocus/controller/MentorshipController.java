package com.muthu.CampusDocus.controller;

import com.muthu.CampusDocus.dto.AdminStatsResponse;
import com.muthu.CampusDocus.dto.ApiResponse;
import com.muthu.CampusDocus.dto.AssignMentorRequest;
import com.muthu.CampusDocus.dto.CreateUserRequest;
import com.muthu.CampusDocus.dto.DocumentAnalysisRequest;
import com.muthu.CampusDocus.dto.DocumentResponse;
import com.muthu.CampusDocus.dto.FriendsResponse;
import com.muthu.CampusDocus.dto.MenteeResponse;
import com.muthu.CampusDocus.dto.MentorResponse;
import com.muthu.CampusDocus.dto.UserProfileResponse;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.model.UserRole;
import com.muthu.CampusDocus.security.CampusDocsOAuth2User;
import com.muthu.CampusDocus.service.DocumentService;
import com.muthu.CampusDocus.service.MentorshipService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class MentorshipController {

    private final MentorshipService mentorshipService;
    private final DocumentService documentService;
    private final UserService userService;

    public MentorshipController(MentorshipService mentorshipService,
                                DocumentService documentService,
                                UserService userService) {
        this.mentorshipService = mentorshipService;
        this.documentService = documentService;
        this.userService = userService;
    }

    // ==========================================
    // STUDENT ENDPOINTS
    // ==========================================

    @GetMapping("/api/mentorship/my-mentor")
    public ResponseEntity<MentorResponse> getMyMentor(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        return mentorshipService.getAssignedMentor(user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/api/mentorship/friends")
    public ResponseEntity<FriendsResponse> getFriends(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(mentorshipService.getFriends(user));
    }

    @GetMapping("/api/mentorship/available-mentors")
    public ResponseEntity<List<MentorResponse>> getAvailableMentors(@AuthenticationPrincipal Object principal) {
        resolveUser(principal);
        return ResponseEntity.ok(mentorshipService.getAvailableMentors());
    }

    @PostMapping("/api/mentorship/select-mentor/{mentorId}")
    public ResponseEntity<UserProfileResponse> selectMentor(@PathVariable("mentorId") String mentorId,
                                                            @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        UserProfileResponse updated = mentorshipService.selectMentor(user, mentorId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/api/mentorship/available-students")
    public ResponseEntity<List<UserProfileResponse>> getAvailableStudents(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(mentorshipService.getAvailableStudents(user));
    }

    @PostMapping("/api/mentorship/select-students")
    public ResponseEntity<ApiResponse> selectStudents(@RequestBody List<String> studentIds,
                                                       @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        mentorshipService.selectStudents(user, studentIds);
        return ResponseEntity.ok(new ApiResponse(true, "Students assigned successfully."));
    }

    @GetMapping("/api/mentorship/mentees")
    public ResponseEntity<List<MenteeResponse>> getMentees(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(mentorshipService.getMentees(user));
    }

    @GetMapping("/api/mentorship/mentees/{studentId}/documents")
    public ResponseEntity<List<DocumentResponse>> getMenteeDocuments(@PathVariable("studentId") String studentId,
                                                                     @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(documentService.getMenteeDocuments(user, studentId));
    }

    @PostMapping("/api/mentorship/documents/{documentId}/analyze")
    public ResponseEntity<DocumentResponse> analyzeDocument(@PathVariable("documentId") String documentId,
                                                            @RequestBody DocumentAnalysisRequest request,
                                                            @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        DocumentResponse response = documentService.analyzeDocument(user, documentId, request);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // ADMIN ENDPOINTS
    // ==========================================

    @GetMapping("/api/admin/users")
    public ResponseEntity<List<UserProfileResponse>> getAllUsers(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(mentorshipService.getAllUsers(user));
    }

    @PostMapping("/api/admin/users")
    public ResponseEntity<UserProfileResponse> createUser(@RequestBody CreateUserRequest request,
                                                          @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        UserProfileResponse created = mentorshipService.createUser(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/api/admin/users/{userId}/role")
    public ResponseEntity<UserProfileResponse> updateUserRole(@PathVariable("userId") String userId,
                                                              @RequestBody Map<String, String> body,
                                                              @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        String roleStr = body.get("role");
        UserRole newRole = UserRole.fromString(roleStr);
        UserProfileResponse updated = mentorshipService.updateUserRole(user, userId, newRole);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/api/admin/students/{studentId}/mentor")
    public ResponseEntity<UserProfileResponse> assignMentor(@PathVariable("studentId") String studentId,
                                                            @RequestBody AssignMentorRequest request,
                                                            @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        UserProfileResponse updated = mentorshipService.assignMentor(user, studentId, request.getMentorId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/api/admin/users/{userId}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable("userId") String userId,
                                                  @AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        mentorshipService.deleteUser(user, userId);
        return ResponseEntity.ok(new ApiResponse(true, "User deleted successfully."));
    }

    @GetMapping("/api/admin/stats")
    public ResponseEntity<AdminStatsResponse> getAdminStats(@AuthenticationPrincipal Object principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(mentorshipService.getAdminStats(user));
    }

    // Helper for principal resolution
    private User resolveUser(Object principal) {
        if (principal instanceof CampusDocsOAuth2User customUser) {
            return userService.getUserById(customUser.getUserId());
        } else if (principal instanceof OidcUser oidcUser) {
            return userService.getUserByGoogleSubject(oidcUser.getSubject());
        } else if (principal instanceof OAuth2User oauth2User) {
            String sub = (String) oauth2User.getAttributes().get("sub");
            return userService.getUserByGoogleSubject(sub);
        }
        throw new AccessDeniedException("Authentication required to access this resource.");
    }
}
