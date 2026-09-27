package com.onboardflow.controller;

import com.onboardflow.dto.DocumentRejectRequest;
import com.onboardflow.entity.DocumentRecord;
import com.onboardflow.service.DocumentService;
import com.onboardflow.service.DocumentService.DocumentFile;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping("/candidates/{candidateId}/documents")
    public List<DocumentRecord> list(@PathVariable Long candidateId) {
        return documentService.listByCandidate(candidateId);
    }

    @PostMapping("/candidates/{candidateId}/documents")
    public DocumentRecord upload(@PathVariable Long candidateId,
                                  @RequestParam String docType,
                                  @RequestParam(required = false) MultipartFile file) {
        return documentService.upload(candidateId, docType, file);
    }

    @GetMapping("/documents/{id}/file")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        DocumentFile file = documentService.loadFile(id, null);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.fileName() + "\"")
                .body(file.resource());
    }

    @PatchMapping("/documents/{id}/verify")
    public DocumentRecord verify(@PathVariable Long id) {
        return documentService.verify(id);
    }

    @PatchMapping("/documents/{id}/reject")
    public DocumentRecord reject(@PathVariable Long id, @Valid @RequestBody DocumentRejectRequest request) {
        return documentService.reject(id, request.getReason());
    }
}
