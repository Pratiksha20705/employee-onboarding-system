package com.onboardflow.dto;

import lombok.*;

/**
 * Phase 2 test/internal trigger for an HR -> Candidate notification (see
 * CandidateController#notifyCandidate). Both fields are optional; sensible
 * defaults are used when omitted. This exists only so the HR -> Candidate
 * notification pipe can be exercised end-to-end in this phase - the real
 * triggers (document rejected/verified, profile photo missing, etc.) are
 * Phase 3+ work and are not implemented here.
 */
@Getter @Setter
public class NotificationTestRequest {
    private String title;
    private String message;
}
