package com.onboardflow.controller;

import com.onboardflow.entity.Candidate;
import com.onboardflow.service.OnboardingService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @PostMapping("/{candidateId}/start")
    public Candidate start(@PathVariable Long candidateId) {
        return onboardingService.startOnboarding(candidateId);
    }
}
