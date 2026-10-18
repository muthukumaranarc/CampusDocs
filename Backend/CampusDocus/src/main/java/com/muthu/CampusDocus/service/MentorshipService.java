package com.muthu.CampusDocus.service;

import com.muthu.CampusDocus.dto.AdminStatsResponse;
import com.muthu.CampusDocus.dto.CreateUserRequest;
import com.muthu.CampusDocus.dto.FriendsResponse;
import com.muthu.CampusDocus.dto.MenteeResponse;
import com.muthu.CampusDocus.dto.MentorResponse;
import com.muthu.CampusDocus.dto.UserProfileResponse;
import com.muthu.CampusDocus.exception.ResourceNotFoundException;
import com.muthu.CampusDocus.model.Document;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.model.UserRole;
import com.muthu.CampusDocus.repository.DocumentRepository;
import com.muthu.CampusDocus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MentorshipService {

    private static final Logger logger = LoggerFactory.getLogger(MentorshipService.class);

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public MentorshipService(UserRepository userRepository,
                             DocumentRepository documentRepository,
                             UserService userService,
                             NotificationService notificationService) {
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    // ==========================================
    // STUDENT METHODS
    // ==========================================

    public Optional<MentorResponse> getAssignedMentor(User studentUser) {
        if (studentUser.getMentorId() != null && !studentUser.getMentorId().isBlank()) {
            Optional<User> found = userRepository.findById(studentUser.getMentorId());
            if (found.isPresent()) {
                User m = found.get();
                return Optional.of(new MentorResponse(
                        m.getId(),
                        m.getDisplayName() != null ? m.getDisplayName() : m.getEmail(),
                        m.getEmail(),
                        m.getPictureUrl(),
                        userRepository.countByMentorId(m.getId())
                ));
            }
        }

        if (studentUser.getMentorEmail() != null && !studentUser.getMentorEmail().isBlank()) {
            Optional<User> byEmail = userRepository.findByEmail(studentUser.getMentorEmail());
            if (byEmail.isPresent()) {
                User m = byEmail.get();
                studentUser.setMentorId(m.getId());
                userRepository.save(studentUser);
                return Optional.of(new MentorResponse(
                        m.getId(),
                        m.getDisplayName() != null ? m.getDisplayName() : m.getEmail(),
                        m.getEmail(),
                        m.getPictureUrl(),
                        userRepository.countByMentorId(m.getId())
                ));
            }
        }

        if (studentUser.getMentorName() != null && !studentUser.getMentorName().isBlank()) {
            return Optional.of(new MentorResponse(
                    studentUser.getMentorId() != null ? studentUser.getMentorId() : "assigned-mentor-id",
                    studentUser.getMentorName(),
                    studentUser.getMentorEmail() != null ? studentUser.getMentorEmail() : "mentor@campusdocs.edu",
                    null,
                    1
            ));
        }

        return Optional.empty();
    }

    public FriendsResponse getFriends(User currentUser) {
        MentorResponse myMentor = getAssignedMentor(currentUser).orElse(null);
        String myMentorId = currentUser.getMentorId();
        String myMentorEmail = currentUser.getMentorEmail();

        List<User> allStudents = userRepository.findByRole(UserRole.STUDENT);
        List<UserProfileResponse> sameMentorFriends = new ArrayList<>();
        List<UserProfileResponse> otherMentorStudents = new ArrayList<>();

        for (User student : allStudents) {
            if (student.getId() != null && student.getId().equals(currentUser.getId())) {
                continue;
            }

            boolean isSameMentor = false;
            if (myMentorId != null && !myMentorId.isBlank() && myMentorId.equals(student.getMentorId())) {
                isSameMentor = true;
            } else if (myMentorEmail != null && !myMentorEmail.isBlank() && myMentorEmail.equalsIgnoreCase(student.getMentorEmail())) {
                isSameMentor = true;
            }

            UserProfileResponse profile = userService.getUserProfile(student);
            if (isSameMentor) {
                sameMentorFriends.add(profile);
            } else {
                otherMentorStudents.add(profile);
            }
        }

        return new FriendsResponse(myMentor, sameMentorFriends, otherMentorStudents);
    }

    public List<MentorResponse> getAvailableMentors() {
        if (userRepository.countByRole(UserRole.MENTOR) == 0) {
            seedInitialMentors();
        }

        List<User> mentors = userRepository.findByRoleOrderByDisplayNameAsc(UserRole.MENTOR);
        if (mentors.isEmpty()) {
            mentors = userRepository.findByRole(UserRole.MENTOR);
        }

        return mentors.stream()
                .map(m -> new MentorResponse(
                        m.getId(),
                        m.getDisplayName() != null ? m.getDisplayName() : m.getEmail(),
                        m.getEmail(),
                        m.getPictureUrl(),
                        userRepository.countByMentorId(m.getId())
                ))
                .collect(Collectors.toList());
    }

    private void seedInitialMentors() {
        try {
            User mentor1 = new User("anitha.sharma@campusdocs.edu", "Prof. Anitha Sharma", UserRole.MENTOR);
            mentor1.setDepartment("Computer Science & Engineering");
            mentor1.setBio("Associate Professor & Academic Advisor. Specializing in Software Engineering and Distributed Data.");
            mentor1.setRollNumber("FAC-CSE-104");
            mentor1.setOnboardingCompleted(true);
            userRepository.save(mentor1);

            User mentor2 = new User("rajesh.kumar@campusdocs.edu", "Dr. Rajesh Kumar", UserRole.MENTOR);
            mentor2.setDepartment("Information Technology");
            mentor2.setBio("Professor & Head of Department. Research in Data Science and Network Security.");
            mentor2.setRollNumber("FAC-IT-201");
            mentor2.setOnboardingCompleted(true);
            userRepository.save(mentor2);
        } catch (Exception e) {
            logger.warn("Could not seed default mentors: {}", e.getMessage());
        }
    }

    public UserProfileResponse selectMentor(User studentUser, String mentorId) {
        if (studentUser.getRole() != UserRole.STUDENT) {
            throw new IllegalArgumentException("Only student accounts can be connected to a mentor.");
        }

        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found with ID: " + mentorId));

        if (mentor.getRole() != UserRole.MENTOR) {
            throw new IllegalArgumentException("The selected user is not a Mentor.");
        }

        studentUser.setMentorId(mentor.getId());
        studentUser.setMentorName(mentor.getDisplayName());
        studentUser.setMentorEmail(mentor.getEmail());
        studentUser.setUpdatedAt(LocalDateTime.now());

        User updated = userRepository.save(studentUser);
        logger.info("Student '{}' connected to Mentor '{}'", studentUser.getEmail(), mentor.getEmail());

        try {
            notificationService.createNotification(
                    studentUser.getId(),
                    "Connected to Faculty Mentor " + mentor.getDisplayName(),
                    "You are now connected with " + mentor.getDisplayName() + " (" + mentor.getEmail() + "). They can now review your coursework and verify certificates.",
                    "mentor",
                    "FACULTY MENTOR",
                    "normal",
                    "Faculty Mentor Cell",
                    "user-check",
                    "My Mentor Workspace →",
                    "mentor"
            );
        } catch (Exception ex) {
            logger.warn("Could not create mentor selection notification: {}", ex.getMessage());
        }

        return userService.getUserProfile(updated);
    }

    // ==========================================
    // MENTOR METHODS
    // ==========================================

    public List<UserProfileResponse> getAvailableStudents(User mentorUser) {
        // Return students who do not yet have a mentor or students already assigned to this mentor
        List<User> students = userRepository.findByRoleOrderByDisplayNameAsc(UserRole.STUDENT);
        return students.stream()
                .filter(s -> s.getMentorId() == null || s.getMentorId().isBlank() || s.getMentorId().equals(mentorUser.getId()))
                .map(userService::getUserProfile)
                .collect(Collectors.toList());
    }

    public void selectStudents(User mentorUser, List<String> studentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            return;
        }

        for (String studentId : studentIds) {
            Optional<User> studentOpt = userRepository.findById(studentId);
            if (studentOpt.isPresent()) {
                User student = studentOpt.get();
                if (student.getRole() == UserRole.STUDENT) {
                    student.setMentorId(mentorUser.getId());
                    student.setMentorName(mentorUser.getDisplayName());
                    student.setMentorEmail(mentorUser.getEmail());
                    student.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(student);
                    logger.info("Mentor '{}' selected Student '{}'", mentorUser.getEmail(), student.getEmail());
                }
            }
        }
    }

    public List<MenteeResponse> getMentees(User mentorUser) {
        if (mentorUser.getRole() != UserRole.MENTOR && mentorUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only mentors can access the mentees list.");
        }

        List<User> students = userRepository.findByMentorId(mentorUser.getId());
        List<MenteeResponse> menteeResponses = new ArrayList<>();

        for (User student : students) {
            List<Document> docs = documentRepository.findByUserIdOrderByCreatedAtDesc(student.getId());
            long totalDocs = docs.size();
            long pending = docs.stream().filter(d -> "PENDING_REVIEW".equalsIgnoreCase(d.getAnalysisStatus())).count();
            long approved = docs.stream().filter(d -> "APPROVED".equalsIgnoreCase(d.getAnalysisStatus())).count();
            long needsRevision = docs.stream().filter(d -> "NEEDS_REVISION".equalsIgnoreCase(d.getAnalysisStatus())).count();

            menteeResponses.add(new MenteeResponse(
                    student.getId(),
                    student.getDisplayName(),
                    student.getEmail(),
                    student.getPictureUrl(),
                    totalDocs,
                    pending,
                    approved,
                    needsRevision,
                    student.getCreatedAt()
            ));
        }

        return menteeResponses;
    }

    // ==========================================
    // ADMIN METHODS
    // ==========================================

    public List<UserProfileResponse> getAllUsers(User adminUser) {
        verifyAdmin(adminUser);
        return userRepository.findAll().stream()
                .map(userService::getUserProfile)
                .collect(Collectors.toList());
    }

    public UserProfileResponse createUser(User adminUser, CreateUserRequest request) {
        verifyAdmin(adminUser);

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (request.getDisplayName() == null || request.getDisplayName().isBlank()) {
            throw new IllegalArgumentException("Name is required.");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("A user with email '" + email + "' already exists.");
        }

        UserRole role = request.getRole() != null ? request.getRole() : UserRole.STUDENT;
        User newUser = new User(email, request.getDisplayName().trim(), role);

        // If assigning a mentor to student
        if (role == UserRole.STUDENT && request.getMentorId() != null && !request.getMentorId().isBlank()) {
            User mentor = userRepository.findById(request.getMentorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mentor not found with ID: " + request.getMentorId()));
            if (mentor.getRole() != UserRole.MENTOR) {
                throw new IllegalArgumentException("Target user is not a Mentor.");
            }
            newUser.setMentorId(mentor.getId());
            newUser.setMentorName(mentor.getDisplayName());
            newUser.setMentorEmail(mentor.getEmail());
        }

        User saved = userRepository.save(newUser);
        logger.info("Admin created user: email={}, role={}", saved.getEmail(), saved.getRole());
        return userService.getUserProfile(saved);
    }

    public UserProfileResponse updateUserRole(User adminUser, String userId, UserRole newRole) {
        verifyAdmin(adminUser);

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (newRole == null) {
            throw new IllegalArgumentException("Role cannot be null.");
        }

        // Prevent leaving system without an admin
        if (targetUser.getRole() == UserRole.ADMIN && newRole != UserRole.ADMIN) {
            long adminCount = userRepository.countByRole(UserRole.ADMIN);
            if (adminCount <= 1) {
                throw new IllegalArgumentException("Cannot change role. The system must have at least one Administrator.");
            }
        }

        // If target was a mentor and is being changed to student, unassign their mentees
        if (targetUser.getRole() == UserRole.MENTOR && newRole != UserRole.MENTOR) {
            List<User> mentees = userRepository.findByMentorId(targetUser.getId());
            for (User mentee : mentees) {
                mentee.setMentorId(null);
                mentee.setMentorName(null);
                mentee.setMentorEmail(null);
                userRepository.save(mentee);
            }
        }

        // If changed to MENTOR or ADMIN, clear mentorId
        if (newRole != UserRole.STUDENT) {
            targetUser.setMentorId(null);
            targetUser.setMentorName(null);
            targetUser.setMentorEmail(null);
        }

        targetUser.setRole(newRole);
        targetUser.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(targetUser);

        logger.info("Admin updated role for user {} to {}", targetUser.getEmail(), newRole);
        return userService.getUserProfile(saved);
    }

    public UserProfileResponse assignMentor(User adminUser, String studentId, String mentorId) {
        verifyAdmin(adminUser);

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        if (student.getRole() != UserRole.STUDENT) {
            throw new IllegalArgumentException("Only students can be assigned to a mentor.");
        }

        // Allow unassigning mentor if mentorId is null or blank
        if (mentorId == null || mentorId.isBlank()) {
            student.setMentorId(null);
            student.setMentorName(null);
            student.setMentorEmail(null);
            student.setUpdatedAt(LocalDateTime.now());
            User saved = userRepository.save(student);
            logger.info("Admin unassigned mentor for student {}", student.getEmail());
            return userService.getUserProfile(saved);
        }

        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found with ID: " + mentorId));

        if (mentor.getRole() != UserRole.MENTOR) {
            throw new IllegalArgumentException("The selected user is not a Mentor.");
        }

        student.setMentorId(mentor.getId());
        student.setMentorName(mentor.getDisplayName());
        student.setMentorEmail(mentor.getEmail());
        student.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(student);
        logger.info("Admin assigned mentor '{}' to student '{}'", mentor.getEmail(), student.getEmail());

        try {
            notificationService.createNotification(
                    student.getId(),
                    "Faculty Mentor Assigned: " + mentor.getDisplayName(),
                    "Campus Administrator assigned " + mentor.getDisplayName() + " as your official faculty mentor.",
                    "mentor",
                    "FACULTY MENTOR",
                    "high",
                    "Campus Administration",
                    "user-check",
                    "My Mentor Workspace →",
                    "mentor"
            );
        } catch (Exception ex) {
            logger.warn("Could not create admin mentor assign notification: {}", ex.getMessage());
        }

        return userService.getUserProfile(saved);
    }

    public void deleteUser(User adminUser, String userId) {
        verifyAdmin(adminUser);

        if (adminUser.getId().equals(userId)) {
            throw new IllegalArgumentException("You cannot delete your own Administrator account.");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (targetUser.getRole() == UserRole.ADMIN) {
            long adminCount = userRepository.countByRole(UserRole.ADMIN);
            if (adminCount <= 1) {
                throw new IllegalArgumentException("Cannot delete the only Administrator in the system.");
            }
        }

        // If mentor, unassign their mentees
        if (targetUser.getRole() == UserRole.MENTOR) {
            List<User> mentees = userRepository.findByMentorId(targetUser.getId());
            for (User mentee : mentees) {
                mentee.setMentorId(null);
                mentee.setMentorName(null);
                mentee.setMentorEmail(null);
                userRepository.save(mentee);
            }
        }

        userRepository.delete(targetUser);
        logger.info("Admin deleted user: id={}, email={}", userId, targetUser.getEmail());
    }

    public AdminStatsResponse getAdminStats(User adminUser) {
        verifyAdmin(adminUser);

        long totalStudents = userRepository.countByRole(UserRole.STUDENT);
        long totalMentors = userRepository.countByRole(UserRole.MENTOR);
        long totalAdmins = userRepository.countByRole(UserRole.ADMIN);
        long totalDocuments = documentRepository.count();

        List<User> students = userRepository.findByRole(UserRole.STUDENT);
        long unassignedStudents = students.stream().filter(s -> s.getMentorId() == null || s.getMentorId().isBlank()).count();

        List<Document> allDocs = documentRepository.findAll();
        long pendingReviews = allDocs.stream()
                .filter(d -> "PENDING_REVIEW".equalsIgnoreCase(d.getAnalysisStatus()))
                .count();

        return new AdminStatsResponse(
                totalStudents,
                totalMentors,
                totalAdmins,
                totalDocuments,
                unassignedStudents,
                pendingReviews
        );
    }

    private void verifyAdmin(User user) {
        if (user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Administrator privileges are required to perform this action.");
        }
    }
}
