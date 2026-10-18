package com.muthu.CampusDocus.service;

import com.muthu.CampusDocus.dto.OnboardingRequest;
import com.muthu.CampusDocus.dto.UpdateProfileRequest;
import com.muthu.CampusDocus.dto.UserProfileResponse;
import com.muthu.CampusDocus.exception.ResourceNotFoundException;
import com.muthu.CampusDocus.model.Document;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.model.UserRole;
import com.muthu.CampusDocus.repository.DocumentRepository;
import com.muthu.CampusDocus.repository.UserGoogleCredentialRepository;
import com.muthu.CampusDocus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final UserGoogleCredentialRepository credentialRepository;
    private final DocumentRepository documentRepository;

    public UserService(UserRepository userRepository,
                       UserGoogleCredentialRepository credentialRepository,
                       DocumentRepository documentRepository) {
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
        this.documentRepository = documentRepository;
    }

    public User findOrCreateUser(String googleSubject, String email, String displayName, String pictureUrl) {
        // 1. Try to find user by googleSubject
        Optional<User> bySubject = userRepository.findByGoogleSubject(googleSubject);
        if (bySubject.isPresent()) {
            User existingUser = bySubject.get();
            boolean changed = false;
            if (email != null && !email.equalsIgnoreCase(existingUser.getEmail())) {
                existingUser.setEmail(email.trim().toLowerCase());
                changed = true;
            }
            if (displayName != null && !displayName.equals(existingUser.getDisplayName())) {
                existingUser.setDisplayName(displayName);
                changed = true;
            }
            if (pictureUrl != null && !pictureUrl.equals(existingUser.getPictureUrl())) {
                existingUser.setPictureUrl(pictureUrl);
                changed = true;
            }
            if (changed) {
                existingUser.setUpdatedAt(LocalDateTime.now());
                return userRepository.save(existingUser);
            }
            return existingUser;
        }

        // 2. Check if user was pre-created by admin with this email
        if (email != null && !email.isBlank()) {
            String normalizedEmail = email.trim().toLowerCase();
            Optional<User> byEmail = userRepository.findByEmail(normalizedEmail);
            if (byEmail.isPresent()) {
                User preCreatedUser = byEmail.get();
                preCreatedUser.setGoogleSubject(googleSubject);
                if (displayName != null && !displayName.isBlank()) {
                    preCreatedUser.setDisplayName(displayName);
                }
                if (pictureUrl != null && !pictureUrl.isBlank()) {
                    preCreatedUser.setPictureUrl(pictureUrl);
                }
                preCreatedUser.setOnboardingCompleted(true);
                preCreatedUser.setUpdatedAt(LocalDateTime.now());
                logger.info("Linked existing pre-created user {} (Role: {}) to Google Subject {}",
                        preCreatedUser.getEmail(), preCreatedUser.getRole(), googleSubject);
                return userRepository.save(preCreatedUser);
            }
        }

        // 3. New user registration:
        // When newly registered, onboardingCompleted is false so they are prompted to choose Student or Mentor
        long totalUsers = userRepository.count();
        UserRole initialRole = totalUsers == 0 ? UserRole.ADMIN : UserRole.STUDENT;
        boolean initialOnboarding = totalUsers == 0; // First user is system admin

        logger.info("Registering new CampusDocs user in MongoDB: email={}, role={}, onboardingRequired={}",
                email, initialRole, !initialOnboarding);

        User newUser = new User(googleSubject, email != null ? email.trim().toLowerCase() : null, displayName, pictureUrl);
        newUser.setRole(initialRole);
        newUser.setOnboardingCompleted(initialOnboarding);
        return userRepository.save(newUser);
    }

    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public User getUserByGoogleSubject(String googleSubject) {
        return userRepository.findByGoogleSubject(googleSubject)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with Google subject: " + googleSubject));
    }

    public UserProfileResponse getUserProfile(User user) {
        boolean folderReady = user.isDriveConnected() && user.getCampusDocsFolderId() != null && !user.getCampusDocsFolderId().isBlank();
        UserProfileResponse resp = new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getPictureUrl(),
                user.getRole(),
                user.getMentorId(),
                user.getMentorName(),
                user.getMentorEmail(),
                user.isDriveConnected(),
                folderReady,
                user.getCampusDocsFolderId(),
                user.getCreatedAt()
        );
        resp.setOnboardingCompleted(user.isOnboardingCompleted());
        resp.setAge(user.getAge());
        resp.setPhone(user.getPhone());
        resp.setDepartment(user.getDepartment());
        resp.setRollNumber(user.getRollNumber());
        resp.setBio(user.getBio());
        resp.setHeadline(user.getHeadline());
        resp.setGithubUrl(user.getGithubUrl());
        resp.setLinkedinUrl(user.getLinkedinUrl());
        resp.setWebsiteUrl(user.getWebsiteUrl());
        resp.setTwitterUrl(user.getTwitterUrl());
        resp.setOtherUrl(user.getOtherUrl());
        return resp;
    }

    public UserProfileResponse completeOnboarding(User user, OnboardingRequest request) {
        if (request == null || request.getRole() == null || request.getRole().isBlank()) {
            throw new IllegalArgumentException("Please select whether you are a Student or a Mentor.");
        }

        UserRole chosenRole = UserRole.fromString(request.getRole());
        if (chosenRole != UserRole.STUDENT && chosenRole != UserRole.MENTOR) {
            throw new IllegalArgumentException("Invalid role selected. Must be STUDENT or MENTOR.");
        }

        user.setRole(chosenRole);
        user.setOnboardingCompleted(true);

        if (request.getAge() != null) {
            user.setAge(request.getAge());
        }
        if (request.getDepartment() != null && !request.getDepartment().isBlank()) {
            user.setDepartment(request.getDepartment().trim());
        }
        if (request.getRollNumber() != null && !request.getRollNumber().isBlank()) {
            user.setRollNumber(request.getRollNumber().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getBio() != null && !request.getBio().isBlank()) {
            user.setBio(request.getBio().trim());
        }

        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);
        logger.info("Onboarding completed for user {}: role={}", saved.getEmail(), saved.getRole());
        return getUserProfile(saved);
    }

    public UserProfileResponse updateProfile(User user, UpdateProfileRequest request) {
        if (request == null) {
            return getUserProfile(user);
        }

        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            user.setDisplayName(request.getDisplayName().trim());
        }
        if (request.getAge() != null) {
            user.setAge(request.getAge());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment().trim());
        }
        if (request.getRollNumber() != null) {
            user.setRollNumber(request.getRollNumber().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio().trim());
        }
        if (request.getHeadline() != null) {
            user.setHeadline(request.getHeadline().trim());
        }
        if (request.getGithubUrl() != null) {
            user.setGithubUrl(request.getGithubUrl().trim());
        }
        if (request.getLinkedinUrl() != null) {
            user.setLinkedinUrl(request.getLinkedinUrl().trim());
        }
        if (request.getWebsiteUrl() != null) {
            user.setWebsiteUrl(request.getWebsiteUrl().trim());
        }
        if (request.getTwitterUrl() != null) {
            user.setTwitterUrl(request.getTwitterUrl().trim());
        }
        if (request.getOtherUrl() != null) {
            user.setOtherUrl(request.getOtherUrl().trim());
        }

        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);
        logger.info("Updated profile for user {}", saved.getEmail());
        return getUserProfile(saved);
    }

    public List<UserProfileResponse> getCampusDirectory() {
        return userRepository.findAll().stream()
                .map(this::getUserProfile)
                .toList();
    }

    public void deleteUserAccount(User user) {
        String userId = user.getId();
        logger.warn("Deleting user account: id={}, email={}", userId, user.getEmail());

        // If mentor: detach all mentees
        if (user.getRole() == UserRole.MENTOR) {
            List<User> mentees = userRepository.findByMentorId(userId);
            for (User mentee : mentees) {
                mentee.setMentorId(null);
                mentee.setMentorName(null);
                mentee.setMentorEmail(null);
                userRepository.save(mentee);
            }
        }

        // Delete user documents
        List<Document> docs = documentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        documentRepository.deleteAll(docs);

        // Delete Google credentials and tokens
        credentialRepository.deleteByUserId(userId);

        // Delete user entity
        userRepository.delete(user);
        logger.info("User account successfully deleted: {}", userId);
    }

    public void updateDriveStatus(String userId, boolean driveConnected, String folderId) {
        User user = getUserById(userId);
        user.setDriveConnected(driveConnected);
        if (folderId != null) {
            user.setCampusDocsFolderId(folderId);
        }
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void disconnectDrive(String userId) {
        User user = getUserById(userId);
        user.setDriveConnected(false);
        user.setCampusDocsFolderId(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        credentialRepository.deleteByUserId(userId);
        logger.info("Google Drive disconnected for user ID: {}", userId);
    }
}
