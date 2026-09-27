package com.onboardflow.service;

import com.onboardflow.entity.Candidate;
import com.onboardflow.entity.InductionActivity;
import com.onboardflow.exception.ResourceNotFoundException;
import com.onboardflow.repository.CandidateRepository;
import com.onboardflow.repository.InductionActivityRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InductionService {

    private final InductionActivityRepository repo;
    private final CandidateRepository candidateRepository;
    private final ActivityLogService activityLogService;

    public InductionService(InductionActivityRepository repo, CandidateRepository candidateRepository,
                             ActivityLogService activityLogService) {
        this.repo = repo;
        this.candidateRepository = candidateRepository;
        this.activityLogService = activityLogService;
    }

    public List<InductionActivity> listByCandidate(Long candidateId) {
        return repo.findByCandidateId(candidateId);
    }

    public InductionActivity create(Long candidateId, String activityName) {
        candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + candidateId));
        InductionActivity activity = repo.save(InductionActivity.builder()
                .candidateId(candidateId)
                .activityName(activityName)
                .completed(false)
                .build());
        activityLogService.log(candidateId, "Induction Activity Added: " + activityName);
        return activity;
    }

    public InductionActivity complete(Long activityId) {
        InductionActivity activity = repo.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Induction activity not found"));
        activity.setCompleted(true);
        activity.setCompletedAt(LocalDateTime.now());
        repo.save(activity);
        activityLogService.log(activity.getCandidateId(), "Induction Activity Completed: " + activity.getActivityName());

        long remaining = repo.countByCandidateIdAndCompletedFalse(activity.getCandidateId());
        if (remaining == 0) {
            Candidate c = candidateRepository.findById(activity.getCandidateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Candidate not found"));
            c.setStage("COMPLETED");
            c.setStatus("COMPLETED");
            candidateRepository.save(c);
            activityLogService.log(c.getId(), "Onboarding Completed");
        }
        return activity;
    }
}
