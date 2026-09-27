package com.onboardflow.controller;

import com.onboardflow.dto.CandidateAccountRequest;
import com.onboardflow.dto.CandidateRequest;
import com.onboardflow.dto.DocumentRejectRequest;
import com.onboardflow.dto.NotificationTestRequest;
import com.onboardflow.entity.ActivityLog;
import com.onboardflow.entity.Candidate;
import com.onboardflow.entity.Notification;
import com.onboardflow.entity.User;
import com.onboardflow.exception.BusinessRuleException;
import com.onboardflow.repository.UserRepository;
import com.onboardflow.service.ActivityLogService;
import com.onboardflow.service.CandidateService;
import com.onboardflow.service.NotificationService;
import com.onboardflow.service.OnboardingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    private final CandidateService candidateService;
    private final OnboardingService onboardingService;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public CandidateController(CandidateService candidateService, OnboardingService onboardingService,
                                ActivityLogService activityLogService, NotificationService notificationService,
                                UserRepository userRepository, ObjectMapper objectMapper) {
        this.candidateService = candidateService;
        this.onboardingService = onboardingService;
        this.activityLogService = activityLogService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(required = false) String search,
                                           @RequestParam(required = false) String status,
                                           @RequestParam(required = false) String department) {
        List<Candidate> candidates = candidateService.search(search, status, department);
        // One query for every CANDIDATE login's email, instead of one
        // "does this candidate have a login" lookup per row.
        java.util.Set<String> loginEmails = candidateService.candidateLoginEmails();
        return candidates.stream().map(c -> {
            Map<String, Object> row = objectMapper.convertValue(c, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
            row.put("hasLoginAccount", loginEmails.contains(c.getEmail()));
            return row;
        }).toList();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getOne(@PathVariable Long id) {
        Candidate c = candidateService.getById(id);
        // HR opening a submission that's waiting on them moves it into active review.
        c = candidateService.markUnderReviewIfSubmitted(c);
        return Map.of(
                "candidate", c,
                "progress", onboardingService.progressPercent(c),
                "timeline", activityLogService.getTimeline(id),
                "hasLoginAccount", candidateService.hasLoginAccount(c)
        );
    }

    /**
     * HR creates/links the CANDIDATE portal login for this candidate's email.
     * The request body's password is optional - send {} to auto-generate one.
     */
    @PostMapping("/{id}/account")
    public Map<String, Object> createAccount(@PathVariable Long id, @Valid @RequestBody CandidateAccountRequest request) {
        String password = candidateService.createLoginAccount(id, request.getPassword());
        Candidate c = candidateService.getById(id);
        return Map.of(
                "email", c.getEmail(),
                "temporaryPassword", password
        );
    }

    @PatchMapping("/{id}/verify")
    public Candidate verifySubmission(@PathVariable Long id) {
        return candidateService.verifySubmission(id);
    }

    @PatchMapping("/{id}/reject")
    public Candidate rejectSubmission(@PathVariable Long id, @Valid @RequestBody DocumentRejectRequest request) {
        return candidateService.rejectSubmission(id, request.getReason());
    }

    /**
     * Phase 2: manual/internal trigger so HR can send a notification to a
     * candidate's portal, exercising the HR -> Candidate notification pipe.
     * NOT wired to the document verification workflow - that's Phase 3+.
     * Requires the candidate to already have a portal login (see
     * CandidateService#createLoginAccount); notifications always go to an
     * actual user account, never just a candidate profile.
     */
    @PostMapping("/{id}/notify")
    public Notification notifyCandidate(@PathVariable Long id,
                                         @RequestBody(required = false) NotificationTestRequest request) {
        Candidate c = candidateService.getById(id);
        User recipient = userRepository.findByEmail(c.getEmail())
                .filter(u -> "CANDIDATE".equals(u.getRole()))
                .orElseThrow(() -> new BusinessRuleException(
                        "This candidate doesn't have a portal login yet - create one first."));

        String title = (request != null && request.getTitle() != null && !request.getTitle().isBlank())
                ? request.getTitle() : "Profile Update Required";
        String message = (request != null && request.getMessage() != null && !request.getMessage().isBlank())
                ? request.getMessage() : "Your profile requires an update. Please check the requested information.";

        return notificationService.create(recipient.getId(), c.getId(), "PROFILE_UPDATE_REQUIRED", title, message);
    }

    @PostMapping
    public Candidate create(@Valid @RequestBody CandidateRequest request) {
        return candidateService.create(request);
    }

    @PutMapping("/{id}")
    public Candidate update(@PathVariable Long id, @Valid @RequestBody CandidateRequest request) {
        return candidateService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        candidateService.delete(id);
    }
}
