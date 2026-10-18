package com.muthu.CampusDocus.service;

import com.muthu.CampusDocus.dto.AnnouncementResponse;
import com.muthu.CampusDocus.dto.CreateAnnouncementRequest;
import com.muthu.CampusDocus.exception.ResourceNotFoundException;
import com.muthu.CampusDocus.model.Announcement;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.model.UserRole;
import com.muthu.CampusDocus.repository.AnnouncementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnnouncementService {

    private static final Logger logger = LoggerFactory.getLogger(AnnouncementService.class);

    private final AnnouncementRepository announcementRepository;

    public AnnouncementService(AnnouncementRepository announcementRepository) {
        this.announcementRepository = announcementRepository;
    }

    public AnnouncementResponse createAnnouncement(User author, CreateAnnouncementRequest request) {
        if (request == null || request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Announcement title is required.");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("Announcement message/content is required.");
        }

        String roleStr = author.getRole() != null ? author.getRole().name() : "STUDENT";
        String authorName = author.getDisplayName() != null && !author.getDisplayName().isBlank()
                ? author.getDisplayName() : author.getEmail();
        String dept = author.getDepartment() != null && !author.getDepartment().isBlank()
                ? author.getDepartment() : "General Campus";

        boolean isPinned = Boolean.TRUE.equals(request.getPinned());

        Announcement announcement = new Announcement(
                author.getId(),
                authorName,
                author.getEmail(),
                roleStr,
                dept,
                author.getPictureUrl(),
                request.getTitle().trim(),
                request.getContent().trim(),
                request.getCategory() != null ? request.getCategory().trim() : "GENERAL",
                request.getPriority() != null ? request.getPriority().trim() : "NORMAL",
                isPinned
        );

        Announcement saved = announcementRepository.save(announcement);
        logger.info("Public announcement created by {} (Role: {}): '{}'", author.getEmail(), roleStr, saved.getTitle());
        return mapToResponse(saved);
    }

    public List<AnnouncementResponse> getAllAnnouncements() {
        if (announcementRepository.count() == 0) {
            seedInitialAnnouncements();
        }

        return announcementRepository.findAllByOrderByPinnedDescCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteAnnouncement(User user, String announcementId) {
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found with id: " + announcementId));

        boolean isAuthor = announcement.getAuthorId() != null && announcement.getAuthorId().equals(user.getId());
        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new AccessDeniedException("You are only permitted to delete announcements that you created.");
        }

        announcementRepository.delete(announcement);
        logger.info("Announcement '{}' deleted by {}", announcement.getTitle(), user.getEmail());
    }

    private AnnouncementResponse mapToResponse(Announcement a) {
        return new AnnouncementResponse(
                a.getId(),
                a.getAuthorId(),
                a.getAuthorName(),
                a.getAuthorEmail(),
                a.getAuthorRole(),
                a.getAuthorDepartment(),
                a.getAuthorPictureUrl(),
                a.getTitle(),
                a.getContent(),
                a.getCategory(),
                a.getPriority(),
                a.isPinned(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }

    private void seedInitialAnnouncements() {
        logger.info("Seeding initial public campus announcements for all students and mentors...");

        Announcement a1 = new Announcement(
                "mentor-seed-1",
                "Dr. K. Sharma",
                "k.sharma@campusdocs.edu",
                "MENTOR",
                "Computer Science & Engineering",
                null,
                "Inter-Department Cloud & Distributed Systems Workshop",
                "Department of Computer Science is hosting a hands-on technical workshop on Distributed Cloud Microservices, Docker containerization, and Spring Boot architecture. All undergraduate students and interested faculty mentors across any engineering discipline are welcome to join this Saturday in Seminar Hall A.",
                "WORKSHOP",
                "IMPORTANT",
                true
        );
        a1.setCreatedAt(LocalDateTime.now().minusHours(4));

        Announcement a2 = new Announcement(
                "student-seed-1",
                "Campus Hackathon Organizing Committee",
                "hackathon@campusdocs.edu",
                "STUDENT",
                "Campus Student Technical Council",
                null,
                "CampusDocs 2026 Annual Hackathon - Registrations Now Live",
                "Calling all developers, designers, and innovators! The annual 36-hour CampusDocs Innovation Hackathon is open for team registrations. Form teams of 2 to 4 students. Mentors from university research labs will be available for live project evaluations and architecture guidance.",
                "CAMPUS_EVENT",
                "NORMAL",
                true
        );
        a2.setCreatedAt(LocalDateTime.now().minusDays(1));

        Announcement a3 = new Announcement(
                "mentor-seed-2",
                "Dr. Meenakshi Sundaram",
                "meenakshi.s@campusdocs.edu",
                "MENTOR",
                "Robotics & Mechanical Sciences",
                null,
                "Undergraduate Research Project Proposals Deadline Reminder",
                "This is a general announcement for all third and final year students planning to submit semester capstone project abstracts. Please ensure you consult your assigned faculty mentor and submit the initial abstract draft before the end of the month.",
                "ACADEMIC_NOTICE",
                "NORMAL",
                false
        );
        a3.setCreatedAt(LocalDateTime.now().minusDays(2));

        announcementRepository.saveAll(List.of(a1, a2, a3));
    }
}
