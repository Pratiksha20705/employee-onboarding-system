package com.onboardflow.service;

import com.onboardflow.entity.Notification;
import com.onboardflow.entity.User;
import com.onboardflow.exception.ResourceNotFoundException;
import com.onboardflow.repository.NotificationRepository;
import com.onboardflow.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * In-app notification center shared by both HR and Candidate users. Every
 * read/write here is scoped to a recipientUserId that callers (the
 * controller layer) must resolve from the authenticated caller's own JWT
 * identity - never from a client-supplied id - so one user can never read or
 * modify another user's notifications.
 */
@Service
public class NotificationService {

    private final NotificationRepository repo;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository repo, UserRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
    }

    public Notification create(Long recipientUserId, Long candidateId, String type, String title, String message) {
        Notification n = Notification.builder()
                .recipientUserId(recipientUserId)
                .candidateId(candidateId)
                .type(type)
                .title(title)
                .message(message)
                .build();
        return repo.save(n);
    }

    /**
     * Notifies the HR account(s). OnboardFlow only has a single HR account
     * today (there's no multi-HR/assignment system), but this looks the
     * recipient up by role rather than hardcoding "the one HR user" so it
     * doesn't quietly start dropping notifications if that ever changes.
     */
    public void notifyHr(Long candidateId, String type, String title, String message) {
        List<User> hrUsers = userRepository.findByRole("HR");
        for (User hr : hrUsers) {
            create(hr.getId(), candidateId, type, title, message);
        }
    }

    public List<Notification> getForUser(Long userId) {
        return repo.findByRecipientUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadForUser(Long userId) {
        return repo.findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    /**
     * Marks a single notification read - only if it belongs to userId.
     * A notification that exists but belongs to someone else is treated the
     * same as one that doesn't exist at all, so this can never be used to
     * probe another user's notification ids.
     */
    public Notification markRead(Long notificationId, Long userId) {
        Notification n = repo.findById(notificationId)
                .filter(existing -> existing.getRecipientUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        if (!n.isRead()) {
            n.setRead(true);
            n = repo.save(n);
        }
        return n;
    }

    public void markAllRead(Long userId) {
        List<Notification> unread = repo.findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        repo.saveAll(unread);
    }
}
