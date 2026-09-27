package com.onboardflow.controller;

import com.onboardflow.dto.LoginRequest;
import com.onboardflow.dto.LoginResponse;
import com.onboardflow.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // Candidate self-registration has been removed: candidates are now
    // provisioned exclusively by HR via
    // POST /api/candidates/{id}/account (see CandidateController /
    // CandidateService#createLoginAccount). There is intentionally no public
    // "/api/auth/register" endpoint anymore.
}
