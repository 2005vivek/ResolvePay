package com.resolvepay.api.controller;

import com.resolvepay.api.client.PayPalClient;
import com.resolvepay.api.dto.SubmitDraftRequest;
import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.service.AiDraftService;
import com.resolvepay.api.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/disputes")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class DisputeController {

    private static final Logger log = LoggerFactory.getLogger(DisputeController.class);

    private final DisputeService disputeService;
    private final PayPalClient payPalClient;
    private final AiDraftService aiDraftService;

    @GetMapping
    public ResponseEntity<List<Dispute>> getDisputes() {
        return ResponseEntity.ok(disputeService.getAllDisputes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Dispute> getDisputeDetails(@PathVariable UUID id) {
        return ResponseEntity.ok(disputeService.getDisputeById(id));
    }

    @GetMapping("/test-auth")
    public ResponseEntity<String> testPayPalAuth() {
        try {
            String token = payPalClient.getAccessToken();
            // Masking the end of the token for basic logging security
            return ResponseEntity.ok("Success! PayPal Token: " + token.substring(0, 15) + "...");
        } catch (Exception e) {
            log.error("Failed to authenticate PayPal: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Failed to authenticate: " + e.getMessage());
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncWithPayPal() {
        try {
            disputeService.syncDisputesFromPayPal();
            return ResponseEntity.ok("Successfully synced disputes from PayPal Sandbox.");
        } catch (Exception e) {
            log.error("Failed to sync disputes: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Sync failed: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/draft")
    public ResponseEntity<String> generateAiDraft(@PathVariable UUID id) {
        try {
            Dispute dispute = disputeService.getDisputeById(id);
            String draft = aiDraftService.generateResolutionDraft(dispute);
            return ResponseEntity.ok(draft);
        } catch (RuntimeException e) {
            if ("Dispute case not found".equalsIgnoreCase(e.getMessage())) {
                log.warn("Dispute case not found for id: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Dispute not found with ID: " + id);
            }
            log.error("Error generating AI draft for dispute {}: {}", id, e.getMessage(), e);
            String rootCause = (e.getCause() != null) ? e.getCause().getMessage() : e.getMessage();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to generate draft. Root cause: " + (rootCause != null ? rootCause : e.toString()));
        } catch (Exception e) {
            log.error("Unexpected error generating draft for dispute {}: {}", id, e.getMessage(), e);
            String rootCause = (e.getCause() != null) ? e.getCause().getMessage() : e.getMessage();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to generate draft. Root cause: " + (rootCause != null ? rootCause : e.toString()));
        }
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitDraftToPayPal(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) SubmitDraftRequest request) {
        try {
            String draftText = (request != null) ? request.getDraftText() : null;
            Dispute updatedDispute = disputeService.submitResolutionDraft(id, draftText);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Resolution response successfully submitted to PayPal Dispute Center.",
                    "disputeId", updatedDispute.getId(),
                    "paypalDisputeId", updatedDispute.getPaypalDisputeId(),
                    "status", updatedDispute.getStatus()
            ));
        } catch (RuntimeException e) {
            log.error("Failed to submit draft for dispute {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
