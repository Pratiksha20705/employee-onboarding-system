package com.onboardflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Candidate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;
    private String address;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String position;

    @Column(name = "expected_joining_date")
    private LocalDate expectedJoiningDate;

    @Column(nullable = false)
    @Builder.Default
    private String status = "SELECTED";

    @Column(nullable = false)
    @Builder.Default
    private String stage = "SELECTED";

    @Column(name = "joining_confirmed_date")
    private LocalDate joiningConfirmedDate;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // --- Candidate self-service verification workflow (additive, independent of
    // the existing status/stage recruiter pipeline above) ---
    // DRAFT -> SUBMITTED -> UNDER_REVIEW -> VERIFIED | REJECTED
    @Column(name = "verification_status", nullable = false)
    @Builder.Default
    private String verificationStatus = "DRAFT";

    @Column(name = "verification_rejection_reason")
    private String verificationRejectionReason;
}
