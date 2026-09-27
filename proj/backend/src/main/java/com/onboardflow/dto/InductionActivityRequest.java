package com.onboardflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
public class InductionActivityRequest {
    @NotBlank
    private String activityName;
}
