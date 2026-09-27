package com.onboardflow.repository;

import com.onboardflow.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface CandidateRepository extends JpaRepository<Candidate, Long>, JpaSpecificationExecutor<Candidate> {
    long countByStatus(String status);
    long countByStage(String stage);
    Optional<Candidate> findByEmail(String email);
}
