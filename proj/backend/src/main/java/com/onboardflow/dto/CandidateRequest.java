package com.onboardflow.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter
public class CandidateRequest {
    @NotBlank private String firstName;
    @NotBlank private String lastName;
    @NotBlank @Email private String email;
    private String phone;
    private String address;
    private LocalDate dateOfBirth;
    @NotBlank private String department;
    @NotBlank private String position;
    private LocalDate expectedJoiningDate;
}
