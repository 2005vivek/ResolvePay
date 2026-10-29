package com.resolvepay.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.resolvepay.api.client.PayPalClient;
import com.resolvepay.api.model.AuditEvent;
import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.model.Draft;
import com.resolvepay.api.repository.AuditEventRepository;
import com.resolvepay.api.repository.DisputeRepository;
import com.resolvepay.api.repository.DraftRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DisputeService {

    private static final Logger log = LoggerFactory.getLogger(DisputeService.class);

    private final DisputeRepository disputeRepository;
    private final PayPalClient payPalClient;
    private final DraftRepository draftRepository;
    private final AuditEventRepository auditEventRepository;

    public List<Dispute> getAllDisputes() {
        return disputeRepository.findAll();
    }

    public Dispute getDisputeById(UUID id) {
        return disputeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dispute case not found"));
    }

    @Transactional
    public Dispute submitResolutionDraft(UUID disputeId, String draftText) {
        Dispute dispute = getDisputeById(disputeId);

        // Update dispute status to reflect submission
        dispute.setStatus("UNDER_REVIEW");
        disputeRepository.save(dispute);

        // Update latest draft if present, or create a submitted draft record
        List<Draft> drafts = draftRepository.findByDisputeId(disputeId);
        if (drafts != null && !drafts.isEmpty()) {
            Draft latestDraft = drafts.get(drafts.size() - 1);
            latestDraft.setReviewerStatus("SUBMITTED");
            if (draftText != null && !draftText.isBlank()) {
                latestDraft.setText(draftText);
            }
            latestDraft.setEditedAt(LocalDateTime.now());
            draftRepository.save(latestDraft);
        } else if (draftText != null && !draftText.isBlank()) {
            Draft draft = new Draft();
            draft.setDispute(dispute);
            draft.setVersion(1);
            draft.setText(draftText);
            draft.setReviewerStatus("SUBMITTED");
            draftRepository.save(draft);
        }

        // Record audit event
        try {
            AuditEvent audit = new AuditEvent();
            audit.setActor("DISPUTE_ANALYST");
            audit.setAction("SUBMIT_PAYPAL_RESOLUTION");
            audit.setTarget("Dispute:" + dispute.getPaypalDisputeId());
            audit.setTimestamp(LocalDateTime.now());
            audit.setOutcome("SUCCESS");
            audit.setRedactedDetails(String.format("{\"disputeId\":\"%s\",\"paypalDisputeId\":\"%s\",\"newStatus\":\"UNDER_REVIEW\"}",
                    disputeId, dispute.getPaypalDisputeId()));
            auditEventRepository.save(audit);
            log.info("Recorded audit event for submitted dispute {}", dispute.getPaypalDisputeId());
        } catch (Exception ex) {
            log.warn("Failed to record audit event for dispute {}: {}", disputeId, ex.getMessage());
        }

        return dispute;
    }

    public void syncDisputesFromPayPal() {
        JsonNode response = payPalClient.fetchDisputes();
        JsonNode items = response.path("items");

        if (items.isMissingNode()) return;

        for (JsonNode item : items) {
            String paypalId = item.path("dispute_id").asText();

            // Only save if it doesn't already exist in our database
            if (disputeRepository.findAll().stream().noneMatch(d -> d.getPaypalDisputeId().equals(paypalId))) {
                Dispute dispute = new Dispute();
                dispute.setPaypalDisputeId(paypalId);
                dispute.setStatus(item.path("status").asText());
                dispute.setReason(item.path("reason").asText());

                JsonNode amountNode = item.path("dispute_amount");
                dispute.setAmount(new BigDecimal(amountNode.path("value").asText("0.00")));
                dispute.setCurrency(amountNode.path("currency_code").asText("USD"));

                disputeRepository.save(dispute);
            }
        }
    }
}
