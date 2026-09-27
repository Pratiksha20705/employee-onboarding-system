package com.onboardflow.controller;

import com.onboardflow.dto.CandidateSelfUpdateRequest;
import com.onboardflow.entity.Candidate;
import com.onboardflow.entity.DocumentRecord;
import com.onboardflow.entity.User;
import com.onboardflow.exception.ResourceNotFoundException;
import com.onboardflow.repository.UserRepository;
import com.onboardflow.service.ActivityLogService;
import com.onboardflow.service.CandidateService;
import com.onboardflow.service.DocumentService;
import com.onboardflow.service.DocumentService.DocumentFile;
import com.onboardflow.service.OnboardingService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Self-service API for the currently authenticated user (typically a CANDIDATE).
 * Every method resolves the target candidate from the JWT identity itself -
 * never from a client-supplied id - so a candidate can only ever see/edit
 * their own record.
 */
@RestController
@RequestMapping("/api/me")
public class MeController {

    private final UserRepository userRepository;
    private final CandidateService candidateService;
    private final DocumentService documentService;
    private final OnboardingService onboardingService;
    private final ActivityLogService activityLogService;

    public MeController(UserRepository userRepository, CandidateService candidateService,
                         DocumentService documentService, OnboardingService onboardingService,
                         ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.candidateService = candidateService;
        this.documentService = documentService;
        this.onboardingService = onboardingService;
        this.activityLogService = activityLogService;
    }

    private Candidate resolveOwnCandidate(Authentication authentication) {
        return candidateService.getByEmail(authentication.getName());
    }

    @GetMapping
    public Map<String, Object> me(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return Map.of("email", user.getEmail(), "fullName", user.getFullName(), "role", user.getRole());
    }

    @GetMapping("/candidate")
    public Map<String, Object> getMyCandidate(Authentication authentication) {
        Candidate c = resolveOwnCandidate(authentication);
        return Map.of(
                "candidate", c,
                "progress", onboardingService.progressPercent(c),
                "timeline", activityLogService.getTimeline(c.getId())
        );
    }

    @PutMapping("/candidate")
    public Candidate updateMyCandidate(Authentication authentication, @Valid @RequestBody CandidateSelfUpdateRequest request) {
        Candidate c = resolveOwnCandidate(authentication);
        return candidateService.updateSelf(c.getId(), request);
    }

    @PostMapping("/submit")
    public Candidate submit(Authentication authentication) {
        Candidate c = resolveOwnCandidate(authentication);
        // Best-effort: also kick off the recruiter onboarding pipeline if it
        // hasn't started yet, so the HR dashboard/pipeline stays in sync.
        // Safe to ignore if it's already been started some other way.
        try {
            onboardingService.startOnboarding(c.getId());
        } catch (RuntimeException ignored) {
            // already started - not a problem for the candidate's submission
        }
        return candidateService.submitForVerification(c.getId());
    }

    @GetMapping("/documents")
    public List<DocumentRecord> myDocuments(Authentication authentication) {
        Candidate c = resolveOwnCandidate(authentication);
        return documentService.listByCandidate(c.getId());
    }

    @PostMapping("/documents")
    public DocumentRecord uploadMyDocument(Authentication authentication,
                                            @RequestParam String docType,
                                            @RequestParam(required = false) MultipartFile file) {
        Candidate c = resolveOwnCandidate(authentication);
        return documentService.upload(c.getId(), docType, file);
    }

    @GetMapping("/documents/{id}/file")
    public ResponseEntity<Resource> downloadMyDocument(Authentication authentication, @PathVariable Long id) {
        Candidate c = resolveOwnCandidate(authentication);
        DocumentFile file = documentService.loadFile(id, c.getId());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.fileName() + "\"")
                .body(file.resource());
    }
}
