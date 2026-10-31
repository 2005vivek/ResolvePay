package com.resolvepay.api.controller;

import com.resolvepay.api.client.PayPalClient;
import com.resolvepay.api.dto.SubmitDraftRequest;
import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.model.EvidenceItem;
import com.resolvepay.api.repository.EvidenceItemRepository;
import com.resolvepay.api.security.MerchantContext;
import com.resolvepay.api.service.AiDraftService;
import com.resolvepay.api.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private static final Logger log = LoggerFactory.getLogger(DisputeController.class);

    private final DisputeService disputeService;
    private final PayPalClient payPalClient;
    private final AiDraftService aiDraftService;
    private final EvidenceItemRepository evidenceItemRepository;

    @GetMapping
    public ResponseEntity<List<Dispute>> getDisputes() {
        return ResponseEntity.ok(disputeService.getAllDisputes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Dispute> getDisputeDetails(@PathVariable UUID id) {
        return ResponseEntity.ok(disputeService.getDisputeById(id));
    }

    /**
     * Safe Health Diagnostic Endpoint.
     * Validates PayPal connectivity without leaking tokens, credentials, or secrets.
     */
    @GetMapping("/test-auth")
    public ResponseEntity<Map<String, Object>> testPayPalAuth() {
        try {
            boolean connected = payPalClient.getAccessToken() != null;
            return ResponseEntity.ok(Map.of(
                    "status", "CONNECTED",
                    "provider", "PAYPAL_SANDBOX",
                    "authenticated", connected,
                    "timestamp", Instant.now().toString()
            ));
        } catch (Exception e) {
            log.error("PayPal sandbox connectivity test failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "status", "DISCONNECTED",
                    "error", "Provider connectivity failure",
                    "timestamp", Instant.now().toString()
            ));
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncWithPayPal() {
        disputeService.syncDisputesFromPayPal();
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Disputes successfully synchronized from PayPal Sandbox.",
                "merchantId", MerchantContext.getCurrentMerchantId() != null ? MerchantContext.getCurrentMerchantId() : "merchant_resolvepay_01",
                "timestamp", Instant.now().toString()
        ));
    }

    @PostMapping("/{id}/draft")
    public ResponseEntity<String> generateAiDraft(@PathVariable UUID id) {
        String merchantId = MerchantContext.getCurrentMerchantId() != null ? MerchantContext.getCurrentMerchantId() : "merchant_resolvepay_01";
        Dispute dispute = disputeService.getDisputeById(id);
        List<EvidenceItem> evidenceItems = evidenceItemRepository.findByDisputeIdAndMerchantId(id, merchantId);
        String draft = aiDraftService.generateEvidenceGroundedDraft(dispute, evidenceItems);
        return ResponseEntity.ok(draft);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitDraftToPayPal(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) SubmitDraftRequest request) {

        String draftText = (request != null) ? request.getDraftText() : null;
        Dispute updatedDispute = disputeService.submitResolutionDraft(id, draftText);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Resolution response successfully submitted to PayPal Dispute Center.",
                "disputeId", updatedDispute.getId(),
                "paypalDisputeId", updatedDispute.getPaypalDisputeId(),
                "status", updatedDispute.getStatus(),
                "submittedAt", Instant.now().toString()
        ));
    }
}
