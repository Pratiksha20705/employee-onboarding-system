package com.onboardflow.controller;

import com.onboardflow.dto.InductionActivityRequest;
import com.onboardflow.entity.InductionActivity;
import com.onboardflow.service.InductionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class InductionController {

    private final InductionService inductionService;

    public InductionController(InductionService inductionService) {
        this.inductionService = inductionService;
    }

    @GetMapping("/candidates/{candidateId}/induction")
    public List<InductionActivity> list(@PathVariable Long candidateId) {
        return inductionService.listByCandidate(candidateId);
    }

    @PostMapping("/candidates/{candidateId}/induction")
    public InductionActivity create(@PathVariable Long candidateId, @Valid @RequestBody InductionActivityRequest request) {
        return inductionService.create(candidateId, request.getActivityName());
    }

    @PatchMapping("/induction/{id}/complete")
    public InductionActivity complete(@PathVariable Long id) {
        return inductionService.complete(id);
    }
}
