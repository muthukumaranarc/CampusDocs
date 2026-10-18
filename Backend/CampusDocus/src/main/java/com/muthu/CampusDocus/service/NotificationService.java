package com.muthu.CampusDocus.service;

import com.muthu.CampusDocus.dto.NotificationResponse;
import com.muthu.CampusDocus.exception.ResourceNotFoundException;
import com.muthu.CampusDocus.model.Notification;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<NotificationResponse> getUserNotifications(User user) {
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        if (notifs.isEmpty()) {
            seedInitialUserNotifications(user);
            notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }
        return notifs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    public NotificationResponse markAsRead(User user, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied to notification.");
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    public void markAllAsRead(User user) {
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        for (Notification n : notifs) {
            if (!n.isRead()) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(notifs);
    }

    public void deleteNotification(User user, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied to notification.");
        }

        notificationRepository.delete(notification);
    }

    public Notification createNotification(String userId, String title, String description,
                                          String type, String category, String priority,
                                          String source, String sourceIcon,
                                          String actionLabel, String actionView) {
        Notification n = new Notification(
                userId,
                title,
                description,
                type,
                category,
                priority,
                source,
                sourceIcon,
                actionLabel,
                actionView
        );
        Notification saved = notificationRepository.save(n);
        logger.info("Notification created for user {}: '{}'", userId, title);
        return saved;
    }

    private void seedInitialUserNotifications(User user) {
        String name = user.getDisplayName() != null ? user.getDisplayName() : user.getEmail();

        // 1. Welcome & Account Security
        createNotification(
                user.getId(),
                "Account Successfully Setup via Google OAuth",
                "Welcome to CampusDocs, " + name + "! Your secure academic records vault is now active.",
                "system",
                "SECURITY & ACCOUNT",
                "low",
                "Security Core",
                "lock",
                "Profile Settings →",
                "settings"
        );

        // 2. Google Drive Status Notification
        if (user.isDriveConnected()) {
            createNotification(
                    user.getId(),
                    "Google Drive Vault Connected",
                    "Your personal Google Drive /CampusDocs folder is active. All uploads are synchronized automatically.",
                    "drive",
                    "GOOGLE DRIVE VAULT",
                    "normal",
                    "Google Drive Sync Engine",
                    "cloud",
                    "Manage Storage →",
                    "settings"
            );
        } else {
            createNotification(
                    user.getId(),
                    "Connect Your Google Drive Vault",
                    "Connect your personal Google Drive account to enable institutional document storage and cloud backup.",
                    "drive",
                    "CLOUD STORAGE SETUP",
                    "high",
                    "Storage Manager",
                    "cloud",
                    "Connect Drive →",
                    "settings"
            );
        }

        // 3. Mentorship status
        if (user.getMentorName() != null && !user.getMentorName().isBlank()) {
            createNotification(
                    user.getId(),
                    "Connected to Faculty Mentor " + user.getMentorName(),
                    "You are officially assigned to " + user.getMentorName() + " for academic guidance and certificate verification.",
                    "mentor",
                    "FACULTY MENTOR",
                    "normal",
                    "Faculty Mentor Cell",
                    "user-check",
                    "My Mentor Workspace →",
                    "mentor"
            );
        } else if (user.getRole() != null && user.getRole().name().equals("STUDENT")) {
            createNotification(
                    user.getId(),
                    "Select Your Faculty Mentor",
                    "Choose an assigned faculty mentor to review and certify your semester marksheets and institutional certificates.",
                    "mentor",
                    "FACULTY MENTOR",
                    "high",
                    "Faculty Mentor Cell",
                    "user-check",
                    "Select Mentor →",
                    "mentor"
            );
        }
    }

    private NotificationResponse mapToResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getUserId(),
                n.getTitle(),
                n.getDescription(),
                n.getType(),
                n.getCategory(),
                n.getPriority(),
                n.isRead(),
                n.getSource(),
                n.getSourceIcon(),
                n.getActionLabel(),
                n.getActionView(),
                n.getCreatedAt()
        );
    }
}
