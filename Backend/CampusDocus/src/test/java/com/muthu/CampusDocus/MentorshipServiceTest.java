package com.muthu.CampusDocus;

import com.muthu.CampusDocus.dto.AdminStatsResponse;
import com.muthu.CampusDocus.dto.CreateUserRequest;
import com.muthu.CampusDocus.dto.DocumentAnalysisRequest;
import com.muthu.CampusDocus.dto.DocumentResponse;
import com.muthu.CampusDocus.dto.MenteeResponse;
import com.muthu.CampusDocus.dto.MentorResponse;
import com.muthu.CampusDocus.dto.UserProfileResponse;
import com.muthu.CampusDocus.model.Document;
import com.muthu.CampusDocus.model.DocumentCategory;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.model.UserRole;
import com.muthu.CampusDocus.repository.DocumentRepository;
import com.muthu.CampusDocus.repository.UserRepository;
import com.muthu.CampusDocus.service.DocumentService;
import com.muthu.CampusDocus.service.MentorshipService;
import com.muthu.CampusDocus.service.NotificationService;
import com.muthu.CampusDocus.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MentorshipServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    private MentorshipService mentorshipService;

    private User adminUser;
    private User mentorUser;
    private User studentUser1;
    private User studentUser2;

    @BeforeEach
    void setUp() {
        mentorshipService = new MentorshipService(userRepository, documentRepository, userService, notificationService);

        adminUser = new User("admin@college.edu", "Admin User", UserRole.ADMIN);
        adminUser.setId("admin-1");

        mentorUser = new User("mentor@college.edu", "Dr. Mentor", UserRole.MENTOR);
        mentorUser.setId("mentor-1");

        studentUser1 = new User("student1@college.edu", "Alice Student", UserRole.STUDENT);
        studentUser1.setId("student-1");

        studentUser2 = new User("student2@college.edu", "Bob Student", UserRole.STUDENT);
        studentUser2.setId("student-2");
    }

    @Test
    @DisplayName("Admin can assign a mentor to student, supporting 1 mentor to N students")
    void assignMentor_Success() {
        when(userRepository.findById("student-1")).thenReturn(Optional.of(studentUser1));
        when(userRepository.findById("mentor-1")).thenReturn(Optional.of(mentorUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse expectedProfile = new UserProfileResponse();
        expectedProfile.setId("student-1");
        expectedProfile.setMentorId("mentor-1");
        expectedProfile.setMentorName("Dr. Mentor");
        when(userService.getUserProfile(any(User.class))).thenReturn(expectedProfile);

        UserProfileResponse response = mentorshipService.assignMentor(adminUser, "student-1", "mentor-1");

        assertThat(response.getMentorId()).isEqualTo("mentor-1");
        assertThat(studentUser1.getMentorId()).isEqualTo("mentor-1");
        assertThat(studentUser1.getMentorName()).isEqualTo("Dr. Mentor");
    }

    @Test
    @DisplayName("Assigning mentor to non-student throws IllegalArgumentException")
    void assignMentor_TargetNotStudent_ThrowsException() {
        when(userRepository.findById("mentor-1")).thenReturn(Optional.of(mentorUser));

        assertThatThrownBy(() -> mentorshipService.assignMentor(adminUser, "mentor-1", "mentor-1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only students can be assigned to a mentor");
    }

    @Test
    @DisplayName("Student can select an available mentor")
    void selectMentor_Student_Success() {
        when(userRepository.findById("mentor-1")).thenReturn(Optional.of(mentorUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse expectedProfile = new UserProfileResponse();
        expectedProfile.setMentorId("mentor-1");
        when(userService.getUserProfile(any(User.class))).thenReturn(expectedProfile);

        UserProfileResponse response = mentorshipService.selectMentor(studentUser1, "mentor-1");

        assertThat(response.getMentorId()).isEqualTo("mentor-1");
        assertThat(studentUser1.getMentorId()).isEqualTo("mentor-1");
    }

    @Test
    @DisplayName("Mentor can view their assigned mentees with document counts")
    void getMentees_Success() {
        studentUser1.setMentorId("mentor-1");
        studentUser2.setMentorId("mentor-1");

        when(userRepository.findByMentorId("mentor-1")).thenReturn(List.of(studentUser1, studentUser2));

        Document doc1 = new Document("student-1", "d1", "report.pdf", "Lab Report", DocumentCategory.ACADEMIC_RECORDS, "application/pdf", 100L, null);
        doc1.setAnalysisStatus("PENDING_REVIEW");

        when(documentRepository.findByUserIdOrderByCreatedAtDesc("student-1")).thenReturn(List.of(doc1));
        when(documentRepository.findByUserIdOrderByCreatedAtDesc("student-2")).thenReturn(Collections.emptyList());

        List<MenteeResponse> mentees = mentorshipService.getMentees(mentorUser);

        assertThat(mentees).hasSize(2);
        assertThat(mentees.get(0).getId()).isEqualTo("student-1");
        assertThat(mentees.get(0).getDocumentCount()).isEqualTo(1);
        assertThat(mentees.get(0).getPendingReviewCount()).isEqualTo(1);
        assertThat(mentees.get(1).getDocumentCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("Non-mentor cannot access mentees list")
    void getMentees_NonMentor_ThrowsAccessDenied() {
        assertThatThrownBy(() -> mentorshipService.getMentees(studentUser1))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only mentors can access the mentees list");
    }

    @Test
    @DisplayName("Admin can create a new student or mentor")
    void createUser_Admin_Success() {
        CreateUserRequest req = new CreateUserRequest("newstudent@college.edu", "Charlie New", UserRole.STUDENT, null);

        when(userRepository.findByEmail("newstudent@college.edu")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse expected = new UserProfileResponse();
        expected.setEmail("newstudent@college.edu");
        expected.setRole(UserRole.STUDENT);
        when(userService.getUserProfile(any(User.class))).thenReturn(expected);

        UserProfileResponse response = mentorshipService.createUser(adminUser, req);

        assertThat(response.getEmail()).isEqualTo("newstudent@college.edu");
        assertThat(response.getRole()).isEqualTo(UserRole.STUDENT);
    }

    @Test
    @DisplayName("Non-admin cannot create users")
    void createUser_NonAdmin_ThrowsAccessDenied() {
        CreateUserRequest req = new CreateUserRequest("test@college.edu", "Test User", UserRole.STUDENT, null);

        assertThatThrownBy(() -> mentorshipService.createUser(mentorUser, req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Administrator privileges are required");
    }

    @Test
    @DisplayName("Admin can fetch system statistics")
    void getAdminStats_Success() {
        when(userRepository.countByRole(UserRole.STUDENT)).thenReturn(10L);
        when(userRepository.countByRole(UserRole.MENTOR)).thenReturn(3L);
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(1L);
        when(documentRepository.count()).thenReturn(25L);

        studentUser1.setMentorId(null);
        when(userRepository.findByRole(UserRole.STUDENT)).thenReturn(List.of(studentUser1));

        Document doc = new Document("student-1", "d1", "file.pdf", "File", DocumentCategory.CERTIFICATES, "application/pdf", 50L, null);
        doc.setAnalysisStatus("PENDING_REVIEW");
        when(documentRepository.findAll()).thenReturn(List.of(doc));

        AdminStatsResponse stats = mentorshipService.getAdminStats(adminUser);

        assertThat(stats.getTotalStudents()).isEqualTo(10L);
        assertThat(stats.getTotalMentors()).isEqualTo(3L);
        assertThat(stats.getTotalAdmins()).isEqualTo(1L);
        assertThat(stats.getTotalDocuments()).isEqualTo(25L);
        assertThat(stats.getUnassignedStudents()).isEqualTo(1L);
        assertThat(stats.getPendingReviewsCount()).isEqualTo(1L);
    }
}
