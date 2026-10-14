package com.muthu.CampusDocus.service;

import com.muthu.CampusDocus.dto.UserProfileResponse;
import com.muthu.CampusDocus.exception.ResourceNotFoundException;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.repository.UserGoogleCredentialRepository;
import com.muthu.CampusDocus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final UserGoogleCredentialRepository credentialRepository;

    public UserService(UserRepository userRepository, UserGoogleCredentialRepository credentialRepository) {
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
    }

    public User findOrCreateUser(String googleSubject, String email, String displayName, String pictureUrl) {
        return userRepository.findByGoogleSubject(googleSubject)
                .map(existingUser -> {
                    boolean changed = false;
                    if (email != null && !email.equalsIgnoreCase(existingUser.getEmail())) {
                        existingUser.setEmail(email);
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
                })
                .orElseGet(() -> {
                    logger.info("Registering new CampusDocs user in MongoDB for email: {}", email);
                    User newUser = new User(googleSubject, email, displayName, pictureUrl);
                    return userRepository.save(newUser);
                });
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
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getPictureUrl(),
                user.isDriveConnected(),
                folderReady,
                user.getCampusDocsFolderId(),
                user.getCreatedAt()
        );
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
