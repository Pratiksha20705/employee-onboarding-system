package com.onboardflow.controller;

import com.onboardflow.entity.Candidate;
import com.onboardflow.service.JoiningService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/candidates/{candidateId}/joining")
public class JoiningController {

    private final JoiningService joiningService;

    public JoiningController(JoiningService joiningService) {
        this.joiningService = joiningService;
    }

    @PostMapping("/confirm")
    public Candidate confirm(@PathVariable Long candidateId) {
        return joiningService.confirmJoining(candidateId);
    }
}
