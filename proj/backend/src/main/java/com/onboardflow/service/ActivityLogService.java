package com.onboardflow.service;

import com.onboardflow.entity.ActivityLog;
import com.onboardflow.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ActivityLogService {
    private final ActivityLogRepository repo;

    public ActivityLogService(ActivityLogRepository repo) {
        this.repo = repo;
    }

    public void log(Long candidateId, String description) {
        repo.save(ActivityLog.builder().candidateId(candidateId).description(description).build());
    }

    public List<ActivityLog> getTimeline(Long candidateId) {
        return repo.findByCandidateIdOrderByCreatedAtDesc(candidateId);
    }
}
