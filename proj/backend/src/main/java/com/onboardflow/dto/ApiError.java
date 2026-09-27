package com.onboardflow.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @Builder
public class ApiError {
    private int status;
    private String message;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
