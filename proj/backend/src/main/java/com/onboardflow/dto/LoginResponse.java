package com.onboardflow.dto;

import lombok.*;

@Getter @Setter @AllArgsConstructor @Builder
public class LoginResponse {
    private String token;
    private String email;
    private String fullName;
    private String role;
}
