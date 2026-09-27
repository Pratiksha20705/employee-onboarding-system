package com.onboardflow.service;

import com.onboardflow.entity.Candidate;
import com.onboardflow.exception.BusinessRuleException;
import com.onboardflow.repository.CandidateRepository;
import com.onboardflow.repository.DocumentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OnboardingService {

    public static final List<String> REQUIRED_DOCS = List.of(
            "AADHAAR", "PAN", "RESUME", "DEGREE_CERTIFICATE", "BANK_DETAILS", "PASSPORT_PHOTO"
    );

    private final CandidateRepository candidateRepository;
    private final DocumentRepository documentRepository;
    private final ActivityLogService activityLogService;

    public OnboardingService(CandidateRepository candidateRepository, DocumentRepository documentRepository,
                              ActivityLogService activityLogService) {
        this.candidateRepository = candidateRepository;
        this.documentRepository = documentRepository;
        this.activityLogService = activityLogService;
    }

    public Candidate startOnboarding(Long candidateId) {
        Candidate c = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new com.onboardflow.exception.ResourceNotFoundException("Candidate not found"));
        if (!"SELECTED".equals(c.getStage())) {
            throw new BusinessRuleException("Onboarding already started for this candidate");
        }
        c.setStatus("ONBOARDING");
        c.setStage("DOCUMENT_SUBMISSION");
        candidateRepository.save(c);
        activityLogService.log(candidateId, "Onboarding Started");
        return c;
    }

    public int progressPercent(Candidate c) {
        List<String> order = List.of("SELECTED", "DOCUMENT_SUBMISSION", "DOCUMENT_VERIFICATION", "JOINING", "INDUCTION", "COMPLETED");
        int idx = order.indexOf(c.getStage());
        if (idx < 0) return 0;
        return (int) Math.round((idx / (double) (order.size() - 1)) * 100);
    }

    public boolean allRequiredDocumentsVerified(Long candidateId) {
        var docs = documentRepository.findByCandidateId(candidateId);
        for (String type : REQUIRED_DOCS) {
            boolean verified = docs.stream().anyMatch(d -> d.getDocType().equals(type) && "VERIFIED".equals(d.getStatus()));
            if (!verified) return false;
        }
        return true;
    }

    public void advanceToDocumentVerification(Long candidateId) {
        Candidate c = candidateRepository.findById(candidateId).orElseThrow();
        if ("DOCUMENT_SUBMISSION".equals(c.getStage())) {
            c.setStage("DOCUMENT_VERIFICATION");
            candidateRepository.save(c);
        }
    }
}
