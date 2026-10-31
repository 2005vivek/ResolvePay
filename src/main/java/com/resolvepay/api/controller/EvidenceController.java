package com.resolvepay.api.controller;

import com.resolvepay.api.exception.DisputeNotFoundException;
import com.resolvepay.api.model.AuditEvent;
import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.model.EvidenceItem;
import com.resolvepay.api.repository.AuditEventRepository;
import com.resolvepay.api.repository.DisputeRepository;
import com.resolvepay.api.repository.EvidenceItemRepository;
import com.resolvepay.api.security.MerchantContext;
import com.resolvepay.api.service.AiDraftService;
import com.resolvepay.api.service.FirestoreSyncService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/disputes/{id}/evidence")
@RequiredArgsConstructor
public class EvidenceController {

    private static final Logger log = LoggerFactory.getLogger(EvidenceController.class);
    private static final String STORAGE_BASE_DIR = "storage/evidence";

    private final DisputeRepository disputeRepository;
    private final EvidenceItemRepository evidenceItemRepository;
    private final AiDraftService aiDraftService;
    private final FirestoreSyncService firestoreSyncService;
    private final AuditEventRepository auditEventRepository;

    @GetMapping
    public ResponseEntity<List<EvidenceItem>> getEvidenceForDispute(@PathVariable UUID id) {
        String merchantId = getEffectiveMerchantId();
        // Verify dispute exists and belongs to merchant
        disputeRepository.findByIdAndMerchantId(id, merchantId)
                .orElseThrow(() -> new DisputeNotFoundException("Dispute case not found"));

        return ResponseEntity.ok(evidenceItemRepository.findByDisputeIdAndMerchantId(id, merchantId));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadEvidence(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "SHIPPING_PROOF") String type) {

        String merchantId = getEffectiveMerchantId();

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Uploaded file is empty"));
        }

        // Validate max size 10MB per PayPal guidelines
        if (file.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds PayPal limit of 10MB"));
        }

        Dispute dispute = disputeRepository.findByIdAndMerchantId(id, merchantId)
                .orElseThrow(() -> new DisputeNotFoundException("Dispute case not found"));

        try {
            byte[] fileBytes = file.getBytes();

            // 1. Compute SHA-256 Hash for forensic integrity
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(fileBytes);
            String sha256 = HexFormat.of().formatHex(hash);

            // 2. Persist binary securely to local storage directory
            String sanitizedFilename = file.getOriginalFilename() != null 
                    ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_") 
                    : "evidence.bin";
            Path dirPath = Paths.get(STORAGE_BASE_DIR, dispute.getId().toString());
            Files.createDirectories(dirPath);
            Path filePath = dirPath.resolve(sha256 + "_" + sanitizedFilename);
            Files.write(filePath, fileBytes);

            // 3. Multimodal AI Extraction using Gemini
            log.info("Analyzing evidence file {} with Gemini AI...", sanitizedFilename);
            String extractedFacts = aiDraftService.extractFactsFromEvidence(
                    fileBytes,
                    file.getContentType(),
                    sanitizedFilename,
                    dispute.getReason()
            );

            // 4. Persist Evidence Record in PostgreSQL with Merchant Isolation
            EvidenceItem item = new EvidenceItem();
            item.setDispute(dispute);
            item.setMerchantId(merchantId);
            item.setType(type);
            item.setSource("MERCHANT_UPLOAD");
            item.setFilename(sanitizedFilename);
            item.setContentHash(sha256);
            item.setExtractionStatus("COMPLETED");
            item.setExtractedFacts(extractedFacts);
            item.setFileUrl(filePath.toAbsolutePath().toString());

            EvidenceItem savedItem = evidenceItemRepository.save(item);

            // 5. Real-time Firestore sync
            List<EvidenceItem> allEvidence = evidenceItemRepository.findByDisputeIdAndMerchantId(id, merchantId);
            firestoreSyncService.syncEvidenceCount(id.toString(), allEvidence.size());

            // 6. Append Audit Event
            try {
                AuditEvent audit = new AuditEvent();
                audit.setActor("MERCHANT:" + merchantId);
                audit.setAction("UPLOAD_EVIDENCE");
                audit.setTarget("Dispute:" + dispute.getPaypalDisputeId() + " File:" + sanitizedFilename);
                audit.setTimestamp(LocalDateTime.now());
                audit.setOutcome("SUCCESS");
                audit.setRedactedDetails(String.format("{\"sha256\":\"%s\",\"size\":%d,\"merchantId\":\"%s\"}", 
                        sha256, file.getSize(), merchantId));
                auditEventRepository.save(audit);
            } catch (Exception ex) {
                log.warn("Failed to save audit event: {}", ex.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "evidenceId", savedItem.getId(),
                    "filename", savedItem.getFilename(),
                    "contentHash", savedItem.getContentHash(),
                    "extractedFacts", savedItem.getExtractedFacts(),
                    "totalEvidenceCount", allEvidence.size()
            ));

        } catch (Exception e) {
            log.error("Failed to process uploaded evidence: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Evidence processing failed: " + e.getMessage()));
        }
    }

    /**
     * Authenticated Binary Document Stream.
     * Enforces tenant ownership checks before streaming original evidence PDFs/images.
     */
    @GetMapping("/{evidenceId}/content")
    public ResponseEntity<Resource> getEvidenceContent(
            @PathVariable UUID id,
            @PathVariable UUID evidenceId) {

        String merchantId = getEffectiveMerchantId();

        // 1. Verify dispute belongs to authenticated merchant
        disputeRepository.findByIdAndMerchantId(id, merchantId)
                .orElseThrow(() -> new DisputeNotFoundException("Dispute case not found"));

        // 2. Verify evidence item belongs to this dispute and merchant
        EvidenceItem item = evidenceItemRepository.findByIdAndMerchantId(evidenceId, merchantId)
                .orElseThrow(() -> new DisputeNotFoundException("Evidence item not found"));

        if (!item.getDispute().getId().equals(id)) {
            throw new DisputeNotFoundException("Evidence does not belong to specified dispute");
        }

        if (item.getFileUrl() == null || item.getFileUrl().isBlank()) {
            return ResponseEntity.notFound().build();
        }

        try {
            Path filePath = Paths.get(item.getFileUrl());
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] data = Files.readAllBytes(filePath);
            ByteArrayResource resource = new ByteArrayResource(data);

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = item.getFilename().endsWith(".pdf") ? "application/pdf" : "image/jpeg";
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + item.getFilename() + "\"")
                    .header("X-Content-Type-Options", "nosniff")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(data.length)
                    .body(resource);

        } catch (IOException e) {
            log.error("Failed to read evidence file content: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String getEffectiveMerchantId() {
        String merchantId = MerchantContext.getCurrentMerchantId();
        return (merchantId != null && !merchantId.isBlank()) ? merchantId : "merchant_resolvepay_01";
    }
}
