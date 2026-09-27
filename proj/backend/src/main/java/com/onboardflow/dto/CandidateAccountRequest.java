package com.onboardflow.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * HR request to create/link the CANDIDATE login account for a candidate
 * profile. Password is optional - if left blank, a temporary one is
 * generated and returned once.
 */
@Getter @Setter
public class CandidateAccountRequest {
    @Size(min = 8, max = 72, message = "must be at least 8 characters")
    private String password;
}
