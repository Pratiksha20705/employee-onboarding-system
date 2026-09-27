package com.onboardflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
public class DocumentRejectRequest {
    @NotBlank
    private String reason;
}
