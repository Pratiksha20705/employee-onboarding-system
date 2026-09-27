package com.onboardflow.repository;

import com.onboardflow.entity.InductionActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InductionActivityRepository extends JpaRepository<InductionActivity, Long> {
    List<InductionActivity> findByCandidateId(Long candidateId);
    long countByCandidateIdAndCompletedFalse(Long candidateId);
}
