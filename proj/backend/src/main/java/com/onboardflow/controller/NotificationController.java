package com.onboardflow.controller;

import com.onboardflow.entity.Notification;
import com.onboardflow.entity.User;
import com.onboardflow.exception.ResourceNotFoundException;
import com.onboardflow.repository.UserRepository;
import com.onboardflow.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * In-app notifications for the currently authenticated user. Used by both
 * HR and the Candidate Portal (see SecurityConfig - /api/notifications/**
 * only requires authentication, not a specific role, unlike /api/candidates/**
 * and friends which are HR-only). The recipient is always resolved from the
 * JWT identity, never a client-supplied id.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    private Long currentUserId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getId();
    }

    @GetMapping
    public List<Notification> list(Authentication authentication) {
        return notificationService.getForUser(currentUserId(authentication));
    }

    @GetMapping("/unread")
    public List<Notification> unread(Authentication authentication) {
        return notificationService.getUnreadForUser(currentUserId(authentication));
    }

    @PatchMapping("/{id}/read")
    public Notification markRead(Authentication authentication, @PathVariable Long id) {
        return notificationService.markRead(id, currentUserId(authentication));
    }

    @PatchMapping("/read-all")
    public void markAllRead(Authentication authentication) {
        notificationService.markAllRead(currentUserId(authentication));
    }
}
