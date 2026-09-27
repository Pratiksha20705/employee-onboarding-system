package com.onboardflow.repository;

import com.onboardflow.entity.DocumentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<DocumentRecord, Long> {
    List<DocumentRecord> findByCandidateId(Long candidateId);

    // Used to find the single current record for a candidate + doc type,
    // instead of pulling every document and filtering in Java. Backed by the
    // uq_candidate_doctype unique constraint, so this can never legitimately
    // match more than one row once the dedupe migration has been applied.
    Optional<DocumentRecord> findByCandidateIdAndDocType(Long candidateId, String docType);

    long countByStatus(String status);
}
