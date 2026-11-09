package com.resolvepay.api.controller;

import com.resolvepay.api.client.PayPalClient;
import com.resolvepay.api.exception.DisputeNotFoundException;
import com.resolvepay.api.model.AuditEvent;
import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.model.EvidenceItem;
import com.resolvepay.api.repository.AuditEventRepository;
import com.resolvepay.api.repository.DisputeRepository;
import com.resolvepay.api.repository.EvidenceItemRepository;
import com.resolvepay.api.security.MerchantContext;
import com.resolvepay.api.service.AiDraftService;
import com.resolvepay.api.service.AiDraftService.EvidenceForensicResult;
import com.resolvepay.api.service.FirestoreSyncService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    private final PayPalClient payPalClient;

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

            // 3. AI Forensic Integrity & PayPal-Approved Format Verification
            log.info("Inspecting evidence file [{}] with AI Forensic Shield for PayPal compliance...", sanitizedFilename);
            EvidenceForensicResult forensicResult = aiDraftService.verifyAndAnalyzeEvidence(
                    fileBytes,
                    file.getContentType(),
                    sanitizedFilename,
                    dispute.getReason()
            );

            // 4. Handle Rejected / Manipulated Evidence (Inform PayPal)
            if (!forensicResult.isApproved()) {
                log.warn("🚨 [EVIDENCE_REJECTED] File [{}] failed forensic verification for dispute {}: {}",
                        sanitizedFilename, dispute.getPaypalDisputeId(), forensicResult.getForensicSummary());

                // Inform PayPal Security / Trust & Safety
                String incidentId = payPalClient.reportEvidenceTampering(
                        dispute.getPaypalDisputeId(),
                        sanitizedFilename,
                        sha256,
                        forensicResult.getForensicSummary(),
                        merchantId
                );

                // Persist rejected item to database for forensic record and audit trail
                EvidenceItem rejectedItem = new EvidenceItem();
                rejectedItem.setDispute(dispute);
                rejectedItem.setMerchantId(merchantId);
                rejectedItem.setType(type);
                rejectedItem.setSource("MERCHANT_UPLOAD");
                rejectedItem.setFilename(sanitizedFilename);
                rejectedItem.setContentHash(sha256);
                rejectedItem.setExtractionStatus(forensicResult.getStatus());
                rejectedItem.setDocumentType(forensicResult.getDocumentType());
                rejectedItem.setIsManipulated(forensicResult.isManipulated());
                rejectedItem.setPaypalIncidentId(incidentId);
                rejectedItem.setExtractedFacts(forensicResult.getForensicSummary() + "\n[Formal alert dispatched to PayPal Trust & Safety. Incident #" + incidentId + "]");
                rejectedItem.setFileUrl(filePath.toAbsolutePath().toString());
                evidenceItemRepository.save(rejectedItem);

                // Flag the dispute
                dispute.setFraudAlertStatus("PAYPAL_ALERTED_TAMPERED_EVIDENCE");
                dispute.setPaypalIncidentId(incidentId);
                disputeRepository.save(dispute);

                // Audit event for fraud alert dispatch
                recordAuditEvent(
                        merchantId,
                        dispute,
                        "REPORT_EVIDENCE_TAMPERING_TO_PAYPAL",
                        "ALERT_DISPATCHED",
                        String.format("{\"incidentId\":\"%s\",\"filename\":\"%s\",\"sha256\":\"%s\",\"reason\":\"%s\"}",
                                incidentId, sanitizedFilename, sha256, forensicResult.getForensicSummary())
                );

                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of(
                        "success", false,
                        "rejected", true,
                        "status", forensicResult.getStatus(),
                        "documentType", forensicResult.getDocumentType(),
                        "error", "AI Forensic Shield: Document rejected. Only authentic PayPal-approved receipts or carrier PODs are accepted. Suspected manipulation or format non-compliance detected. Incident reported to PayPal Trust & Safety.",
                        "incidentId", incidentId,
                        "forensicReason", forensicResult.getForensicSummary(),
                        "paypalInformed", true,
                        "evidenceId", rejectedItem.getId()
                ));
            }

            // 5. Persist Approved Evidence Record in PostgreSQL
            EvidenceItem item = new EvidenceItem();
            item.setDispute(dispute);
            item.setMerchantId(merchantId);
            item.setType(type);
            item.setSource("MERCHANT_UPLOAD");
            item.setFilename(sanitizedFilename);
            item.setContentHash(sha256);
            item.setExtractionStatus("APPROVED_PAYPAL_RECEIPT");
            item.setDocumentType(forensicResult.getDocumentType());
            item.setIsManipulated(false);
            item.setExtractedFacts(forensicResult.getExtractedFacts());
            item.setFileUrl(filePath.toAbsolutePath().toString());

            EvidenceItem savedItem = evidenceItemRepository.save(item);

            // 6. Real-time Firestore sync
            List<EvidenceItem> allEvidence = evidenceItemRepository.findByDisputeIdAndMerchantId(id, merchantId);
            firestoreSyncService.syncEvidenceCount(id.toString(), allEvidence.size());

            // 7. Append Audit Event
            recordAuditEvent(
                    merchantId,
                    dispute,
                    "UPLOAD_EVIDENCE",
                    "SUCCESS",
                    String.format("{\"sha256\":\"%s\",\"size\":%d,\"docType\":\"%s\",\"merchantId\":\"%s\"}",
                            sha256, file.getSize(), forensicResult.getDocumentType(), merchantId)
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "rejected", false,
                    "status", "APPROVED_PAYPAL_RECEIPT",
                    "documentType", forensicResult.getDocumentType(),
                    "message", "AI Verification: Official PayPal-approved receipt verified successfully.",
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

    private void recordAuditEvent(String merchantId, Dispute dispute, String action, String outcome, String details) {
        try {
            AuditEvent audit = new AuditEvent();
            audit.setActor("MERCHANT:" + merchantId);
            audit.setAction(action);
            audit.setTarget("Dispute:" + dispute.getPaypalDisputeId());
            audit.setTimestamp(LocalDateTime.now());
            audit.setOutcome(outcome);
            audit.setRedactedDetails(details);
            auditEventRepository.save(audit);
        } catch (Exception ex) {
            log.warn("Failed to save audit event: {}", ex.getMessage());
        }
    }

    private String getEffectiveMerchantId() {
        String merchantId = MerchantContext.getCurrentMerchantId();
        return (merchantId != null && !merchantId.isBlank()) ? merchantId : "merchant_resolvepay_01";
    }
}
