package com.onboardflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents", uniqueConstraints = {
        // A candidate can only ever have ONE current record per document type.
        // This mirrors the DB-level constraint added in
        // database/migrations/002_dedupe_and_constrain_documents.sql - run that
        // migration (on databases created before this change) BEFORE starting
        // the app with ddl-auto=update, or the automatic schema update will
        // fail if any duplicate (candidate_id, doc_type) rows still exist.
        @UniqueConstraint(name = "uq_candidate_doctype", columnNames = {"candidate_id", "doc_type"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "candidate_id", nullable = false)
    private Long candidateId;

    @Column(name = "doc_type", nullable = false)
    private String docType;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "stored_file_name")
    private String storedFileName;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "uploaded_at")
    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
}
