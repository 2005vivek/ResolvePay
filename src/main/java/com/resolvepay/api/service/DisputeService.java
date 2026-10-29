package com.resolvepay.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolvepay.api.client.PayPalClient;
import com.resolvepay.api.exception.DisputeNotFoundException;
import com.resolvepay.api.exception.PayPalSubmissionException;
import com.resolvepay.api.model.AuditEvent;
import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.model.Draft;
import com.resolvepay.api.model.OutboxEvent;
import com.resolvepay.api.repository.AuditEventRepository;
import com.resolvepay.api.repository.DisputeRepository;
import com.resolvepay.api.repository.DraftRepository;
import com.resolvepay.api.repository.OutboxEventRepository;
import com.resolvepay.api.security.MerchantContext;
import com.resolvepay.api.util.DateUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DisputeService {

    private static final Logger log = LoggerFactory.getLogger(DisputeService.class);

    private final DisputeRepository disputeRepository;
    private final PayPalClient payPalClient;
    private final DraftRepository draftRepository;
    private final AuditEventRepository auditEventRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Dispute> getAllDisputes() {
        String merchantId = getEffectiveMerchantId();
        return disputeRepository.findByMerchantId(merchantId);
    }

    public Dispute getDisputeById(UUID id) {
        String merchantId = getEffectiveMerchantId();
        return disputeRepository.findByIdAndMerchantId(id, merchantId)
                .orElseThrow(() -> new DisputeNotFoundException("Dispute case not found"));
    }

    @Transactional
    public Dispute submitResolutionDraft(UUID disputeId, String draftText) {
        String merchantId = getEffectiveMerchantId();
        Dispute dispute = getDisputeById(disputeId);

        // 1. Validation Checks
        if (draftText == null || draftText.trim().isEmpty()) {
            throw new IllegalArgumentException("Draft rebuttal text cannot be empty.");
        }

        if ("UNDER_REVIEW".equalsIgnoreCase(dispute.getStatus()) || "RESOLVED".equalsIgnoreCase(dispute.getStatus())) {
            throw new IllegalStateException("Dispute " + dispute.getPaypalDisputeId() + " is already " + dispute.getStatus() + "; duplicate submission rejected.");
        }

        // 2. Submit resolution note directly to PayPal Dispute Center
        try {
            log.info("Submitting resolution note to PayPal for dispute {} by merchant {}", 
                    dispute.getPaypalDisputeId(), merchantId);
            payPalClient.submitProvideEvidence(dispute.getPaypalDisputeId(), draftText.trim());
        } catch (HttpStatusCodeException ex) {
            String sanitizedError = sanitizeError(ex.getResponseBodyAsString(), ex.getStatusCode().toString());
            log.error("PayPal provider rejected submission for dispute {}: {}", dispute.getPaypalDisputeId(), sanitizedError);

            recordAuditEvent(merchantId, dispute, "SUBMIT_PAYPAL_RESOLUTION", "PROVIDER_REJECTED",
                    String.format("{\"error\":\"%s\",\"httpStatus\":%d}", sanitizedError, ex.getStatusCode().value()));

            // DO NOT update status to UNDER_REVIEW
            throw new PayPalSubmissionException("PayPal rejected evidence: " + sanitizedError, HttpStatus.BAD_GATEWAY);

        } catch (ResourceAccessException ex) {
            log.error("Network timeout while submitting dispute {} to PayPal: {}", dispute.getPaypalDisputeId(), ex.getMessage());

            // Mark submission as pending reconciliation to prevent duplicate submissions
            dispute.setStatus("SUBMISSION_UNKNOWN");
            disputeRepository.save(dispute);

            recordAuditEvent(merchantId, dispute, "SUBMIT_PAYPAL_RESOLUTION", "TIMEOUT_UNKNOWN",
                    "{\"error\":\"Network connection timeout after request dispatch\"}");

            throw new PayPalSubmissionException("Submission timeout — connection lost. Outcome unknown, reconciliation required.", HttpStatus.GATEWAY_TIMEOUT);

        } catch (Exception ex) {
            String sanitized = sanitizeError(ex.getMessage(), "UNKNOWN");
            log.error("Unexpected failure during PayPal submission for dispute {}: {}", dispute.getPaypalDisputeId(), sanitized);

            recordAuditEvent(merchantId, dispute, "SUBMIT_PAYPAL_RESOLUTION", "FAILURE",
                    String.format("{\"error\":\"%s\"}", sanitized));

            throw new PayPalSubmissionException("Failed to submit evidence to PayPal: " + sanitized, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // 3. Update dispute status strictly upon verified provider acceptance
        dispute.setStatus("UNDER_REVIEW");
        disputeRepository.save(dispute);

        // 4. Update or create submitted draft record
        List<Draft> drafts = draftRepository.findByDisputeId(disputeId);
        if (drafts != null && !drafts.isEmpty()) {
            Draft latestDraft = drafts.get(drafts.size() - 1);
            latestDraft.setReviewerStatus("SUBMITTED");
            latestDraft.setText(draftText.trim());
            latestDraft.setEditedAt(LocalDateTime.now());
            draftRepository.save(latestDraft);
        } else {
            Draft draft = new Draft();
            draft.setDispute(dispute);
            draft.setVersion(1);
            draft.setText(draftText.trim());
            draft.setReviewerStatus("SUBMITTED");
            draftRepository.save(draft);
        }

        // 5. Create Transactional Outbox Event
        try {
            Map<String, Object> projection = new HashMap<>();
            projection.put("disputeId", dispute.getId());
            projection.put("paypalDisputeId", dispute.getPaypalDisputeId());
            projection.put("merchantId", merchantId);
            projection.put("status", "UNDER_REVIEW");
            projection.put("submittedAt", LocalDateTime.now().toString());

            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType("DISPUTE");
            outbox.setAggregateId(dispute.getId().toString());
            outbox.setEventType("DISPUTE_SUBMITTED");
            outbox.setPayload(objectMapper.writeValueAsString(projection));
            outbox.setStatus("PENDING");
            outbox.setVersion(1);
            outboxEventRepository.save(outbox);
        } catch (Exception e) {
            log.warn("Failed to create outbox event for dispute submit: {}", e.getMessage());
        }

        // 6. Record Successful Audit Event
        recordAuditEvent(merchantId, dispute, "SUBMIT_PAYPAL_RESOLUTION", "SUCCESS",
                String.format("{\"disputeId\":\"%s\",\"paypalDisputeId\":\"%s\",\"newStatus\":\"UNDER_REVIEW\"}",
                        disputeId, dispute.getPaypalDisputeId()));

        return dispute;
    }

    public void syncDisputesFromPayPal() {
        String merchantId = getEffectiveMerchantId();
        JsonNode response = payPalClient.fetchDisputes();
        JsonNode items = response.path("items");

        if (items.isMissingNode()) return;

        for (JsonNode item : items) {
            String paypalId = item.path("dispute_id").asText();

            // Scope by PaypalDisputeId and Merchant
            Dispute dispute = disputeRepository.findByPaypalDisputeIdAndMerchantId(paypalId, merchantId)
                    .orElseGet(() -> {
                        Dispute newDispute = new Dispute();
                        newDispute.setPaypalDisputeId(paypalId);
                        newDispute.setMerchantId(merchantId);
                        return newDispute;
                    });

            dispute.setStatus(item.path("status").asText("OPEN"));
            dispute.setReason(item.path("reason").asText("UNSPECIFIED"));
            dispute.setDisputeLifeCycleStage(item.path("dispute_life_cycle_stage").asText(null));
            dispute.setDisputeChannel(item.path("dispute_channel").asText(null));

            JsonNode amountNode = item.path("dispute_amount");
            dispute.setAmount(new BigDecimal(amountNode.path("value").asText("0.00")));
            dispute.setCurrency(amountNode.path("currency_code").asText("USD"));

            // Response Deadline Mapping
            String dueDateStr = null;
            if (item.hasNonNull("seller_response_due_date")) {
                dueDateStr = item.path("seller_response_due_date").asText();
            } else if (item.hasNonNull("response_due_date")) {
                dueDateStr = item.path("response_due_date").asText();
            }
            if (dueDateStr != null && !dueDateStr.isBlank()) {
                LocalDateTime parsedDeadline = DateUtils.parsePayPalTimestamp(dueDateStr);
                if (parsedDeadline != null) {
                    dispute.setDeadline(parsedDeadline);
                }
            }

            disputeRepository.save(dispute);
        }
    }

    private String getEffectiveMerchantId() {
        String merchantId = MerchantContext.getCurrentMerchantId();
        return (merchantId != null && !merchantId.isBlank()) ? merchantId : "merchant_resolvepay_01";
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
            log.warn("Failed to record audit event: {}", ex.getMessage());
        }
    }

    private String sanitizeError(String rawError, String fallback) {
        if (rawError == null || rawError.isBlank()) return fallback;
        // Redact any Authorization headers, bearer tokens, or client secrets
        return rawError.replaceAll("(?i)(bearer\\s+[a-zA-Z0-9_.-]+)", "Bearer [REDACTED]")
                .replaceAll("(?i)(client_secret=[^&]+)", "client_secret=[REDACTED]")
                .substring(0, Math.min(rawError.length(), 250));
    }
}
