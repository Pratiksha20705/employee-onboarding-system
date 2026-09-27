package com.onboardflow.service;

import com.onboardflow.repository.CandidateRepository;
import com.onboardflow.repository.DocumentRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class DashboardService {

    private final CandidateRepository candidateRepository;
    private final DocumentRepository documentRepository;

    public DashboardService(CandidateRepository candidateRepository, DocumentRepository documentRepository) {
        this.candidateRepository = candidateRepository;
        this.documentRepository = documentRepository;
    }

    public Map<String, Object> getSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalCandidates", candidateRepository.count());
        summary.put("selected", candidateRepository.countByStatus("SELECTED"));
        summary.put("onboarding", candidateRepository.countByStatus("ONBOARDING"));
        summary.put("joined", candidateRepository.countByStatus("JOINED"));
        summary.put("completed", candidateRepository.countByStatus("COMPLETED"));
        summary.put("pendingDocuments", documentRepository.countByStatus("PENDING"));
        return summary;
    }

    public Map<String, Object> getPipeline() {
        Map<String, Object> pipeline = new LinkedHashMap<>();
        for (String stage : new String[]{"SELECTED", "DOCUMENT_SUBMISSION", "DOCUMENT_VERIFICATION", "JOINING", "INDUCTION", "COMPLETED"}) {
            pipeline.put(stage, candidateRepository.countByStage(stage));
        }
        return pipeline;
    }
}
