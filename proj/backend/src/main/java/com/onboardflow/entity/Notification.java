package com.onboardflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * In-app notification for a single recipient. Both HR and Candidate users
 * log in through the same {@code users} table (see {@link User#getRole()}),
 * so recipientUserId works for either kind of recipient - HR notifications
 * and Candidate notifications share this one table rather than needing
 * separate schemas.
 *
 * candidateId is set whenever the notification is about a specific
 * candidate's profile (which is the case for every notification in this
 * phase), so the UI can deep-link to it ("View Candidate" for HR, "View
 * Profile" for the candidate).
 */
@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_user_id", nullable = false)
    private Long recipientUserId;

    @Column(name = "candidate_id")
    private Long candidateId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    // Field is named "read" (not "isRead") so Lombok's getter/setter pair
    // comes out unambiguous: isRead() / setRead(boolean). This also keeps
    // the JSON property name simply "read" for the frontend.
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
