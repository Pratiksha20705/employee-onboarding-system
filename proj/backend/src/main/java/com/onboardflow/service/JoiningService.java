package com.onboardflow.service;

import com.onboardflow.entity.Candidate;
import com.onboardflow.entity.InductionActivity;
import com.onboardflow.exception.BusinessRuleException;
import com.onboardflow.exception.ResourceNotFoundException;
import com.onboardflow.repository.CandidateRepository;
import com.onboardflow.repository.InductionActivityRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class JoiningService {

    private static final List<String> DEFAULT_INDUCTION_ACTIVITIES = List.of(
            "HR Orientation", "Company Introduction", "IT Setup",
            "Security Training", "Team Introduction", "Policy Training"
    );

    private final CandidateRepository candidateRepository;
    private final OnboardingService onboardingService;
    private final InductionActivityRepository inductionActivityRepository;
    private final ActivityLogService activityLogService;

    public JoiningService(CandidateRepository candidateRepository, OnboardingService onboardingService,
                           InductionActivityRepository inductionActivityRepository, ActivityLogService activityLogService) {
        this.candidateRepository = candidateRepository;
        this.onboardingService = onboardingService;
        this.inductionActivityRepository = inductionActivityRepository;
        this.activityLogService = activityLogService;
    }

    public Candidate confirmJoining(Long candidateId) {
        Candidate c = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found"));

        if (!onboardingService.allRequiredDocumentsVerified(candidateId)) {
            throw new BusinessRuleException("Joining is blocked until all required documents are verified");
        }

        c.setStage("INDUCTION");
        c.setStatus("JOINED");
        c.setJoiningConfirmedDate(LocalDate.now());
        candidateRepository.save(c);
        activityLogService.log(candidateId, "Joining Confirmed");

        if (inductionActivityRepository.findByCandidateId(candidateId).isEmpty()) {
            for (String name : DEFAULT_INDUCTION_ACTIVITIES) {
                inductionActivityRepository.save(InductionActivity.builder()
                        .candidateId(candidateId).activityName(name).completed(false).build());
            }
        }
        return c;
    }
}
