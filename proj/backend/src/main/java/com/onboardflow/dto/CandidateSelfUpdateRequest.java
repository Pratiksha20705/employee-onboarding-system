package com.onboardflow.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter
public class CandidateSelfUpdateRequest {
    @NotBlank private String firstName;
    @NotBlank private String lastName;
    private String phone;
    private String address;
    private LocalDate dateOfBirth;
}
