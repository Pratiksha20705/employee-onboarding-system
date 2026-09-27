package com.onboardflow.service;

import com.onboardflow.entity.DocumentRecord;
import com.onboardflow.exception.BusinessRuleException;
import com.onboardflow.exception.ResourceNotFoundException;
import com.onboardflow.repository.CandidateRepository;
import com.onboardflow.repository.DocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    // Keep the allowed set narrow and explicit: these are the only document
    // kinds HR actually needs to review (KYC/ID scans and certificates).
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/png"
    );
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB

    private final DocumentRepository documentRepository;
    private final CandidateRepository candidateRepository;
    private final ActivityLogService activityLogService;
    private final OnboardingService onboardingService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public DocumentService(DocumentRepository documentRepository, CandidateRepository candidateRepository,
                            ActivityLogService activityLogService, OnboardingService onboardingService) {
        this.documentRepository = documentRepository;
        this.candidateRepository = candidateRepository;
        this.activityLogService = activityLogService;
        this.onboardingService = onboardingService;
    }

    private Path uploadDirPath() {
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new BusinessRuleException("Could not prepare storage for uploaded documents.");
        }
        return dir;
    }

    public List<DocumentRecord> listByCandidate(Long candidateId) {
        return documentRepository.findByCandidateId(candidateId);
    }

    public DocumentRecord upload(Long candidateId, String docType, MultipartFile file) {
        candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found"));

        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Please select a file to upload.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BusinessRuleException("File is too large. Maximum allowed size is 5MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessRuleException("Unsupported file type. Please upload a PDF, JPG or PNG file.");
        }

        // Look up the single current record for this candidate + doc type,
        // relying on the uq_candidate_doctype constraint rather than scanning
        // every one of the candidate's documents and filtering in Java - this
        // is the one-record-per-type invariant the DB itself now enforces.
        DocumentRecord existing = documentRepository.findByCandidateIdAndDocType(candidateId, docType).orElse(null);

        String storedFileName = storeFile(file);
        String previousStoredFileName = existing != null ? existing.getStoredFileName() : null;

        DocumentRecord doc;
        if (existing != null) {
            doc = documentRepository.save(applyUpload(existing, file, contentType, storedFileName));
        } else {
            try {
                doc = documentRepository.save(newDocumentRecord(candidateId, docType, file, contentType, storedFileName));
            } catch (DataIntegrityViolationException raceLoser) {
                // Two near-simultaneous first uploads for the same candidate +
                // doc type both saw "no existing record" and both tried to
                // insert; the uq_candidate_doctype constraint let exactly one
                // insert win. Fall back to updating the row that won instead
                // of surfacing a 500 to whichever request lost the race. The
                // file this request already stored is still valid - just
                // attach it to the winning row rather than the one that
                // failed to insert.
                DocumentRecord winner = documentRepository.findByCandidateIdAndDocType(candidateId, docType)
                        .orElseThrow(() -> raceLoser);
                previousStoredFileName = winner.getStoredFileName();
                doc = documentRepository.save(applyUpload(winner, file, contentType, storedFileName));
            }
        }

        // Replacing a document (re-upload) should not leave the old physical
        // file behind, but this is best-effort: a cleanup failure here must
        // never fail the upload that already succeeded and is already saved.
        if (previousStoredFileName != null && !previousStoredFileName.equals(storedFileName)) {
            deleteFileQuietly(previousStoredFileName);
        }

        activityLogService.log(candidateId, "Document Uploaded: " + docType);
        return doc;
    }

    private DocumentRecord applyUpload(DocumentRecord record, MultipartFile file, String contentType, String storedFileName) {
        record.setFileName(file.getOriginalFilename());
        record.setStoredFileName(storedFileName);
        record.setFilePath(uploadDir + "/" + storedFileName);
        record.setContentType(contentType);
        record.setFileSize(file.getSize());
        record.setStatus("PENDING");
        record.setRejectionReason(null);
        record.setUploadedAt(LocalDateTime.now());
        record.setVerifiedAt(null);
        return record;
    }

    private DocumentRecord newDocumentRecord(Long candidateId, String docType, MultipartFile file, String contentType, String storedFileName) {
        return DocumentRecord.builder()
                .candidateId(candidateId)
                .docType(docType)
                .fileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .filePath(uploadDir + "/" + storedFileName)
                .contentType(contentType)
                .fileSize(file.getSize())
                .status("PENDING")
                .build();
    }

    private String storeFile(MultipartFile file) {
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String extension = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) {
            extension = original.substring(dot); // includes the leading '.'
        }
        String storedFileName = UUID.randomUUID() + extension;
        try {
            Path target = uploadDirPath().resolve(storedFileName).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to store uploaded document", e);
            throw new BusinessRuleException("Could not save the uploaded file. Please try again.");
        }
        return storedFileName;
    }

    private void deleteFileQuietly(String storedFileName) {
        try {
            Files.deleteIfExists(uploadDirPath().resolve(storedFileName).normalize());
        } catch (IOException e) {
            log.warn("Could not remove replaced document file {}", storedFileName, e);
        }
    }

    /**
     * Resolves the file for a document, for HR (ownerCandidateId == null) or a
     * candidate viewing their own document (ownerCandidateId == that candidate's
     * id). The document id is the only client-supplied input; the physical
     * path is always rebuilt server-side from the stored file name, so a
     * caller can never point this at an arbitrary filesystem path.
     */
    public DocumentFile loadFile(Long documentId, Long ownerCandidateId) {
        DocumentRecord doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (ownerCandidateId != null && !ownerCandidateId.equals(doc.getCandidateId())) {
            throw new ResourceNotFoundException("Document not found");
        }
        if (doc.getStoredFileName() == null) {
            throw new ResourceNotFoundException("No file has been uploaded for this document yet.");
        }

        Path dir = uploadDirPath();
        Path filePath = dir.resolve(doc.getStoredFileName()).normalize();
        if (!filePath.startsWith(dir) || !Files.exists(filePath) || !Files.isReadable(filePath)) {
            log.error("Document {} references a missing/unreadable file: {}", documentId, filePath);
            throw new ResourceNotFoundException("The uploaded file is missing on the server. Please ask the candidate to re-upload it.");
        }

        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("The uploaded file could not be located on the server.");
        }

        String downloadName = doc.getFileName() != null ? doc.getFileName() : doc.getStoredFileName();
        String type = doc.getContentType() != null ? doc.getContentType() : "application/octet-stream";
        return new DocumentFile(resource, downloadName, type);
    }

    public record DocumentFile(Resource resource, String fileName, String contentType) {
    }

    public DocumentRecord verify(Long documentId) {
        DocumentRecord doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        doc.setStatus("VERIFIED");
        doc.setVerifiedAt(LocalDateTime.now());
        doc.setRejectionReason(null);
        documentRepository.save(doc);
        activityLogService.log(doc.getCandidateId(), "Document Verified: " + doc.getDocType());

        onboardingService.advanceToDocumentVerification(doc.getCandidateId());
        return doc;
    }

    public DocumentRecord reject(Long documentId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new BusinessRuleException("Rejection reason is required");
        }
        DocumentRecord doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        doc.setStatus("REJECTED");
        doc.setRejectionReason(reason);
        documentRepository.save(doc);
        activityLogService.log(doc.getCandidateId(), "Document Rejected: " + doc.getDocType() + " (" + reason + ")");
        return doc;
    }
}
