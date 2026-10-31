package com.resolvepay.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolvepay.api.client.PayPalClient;
import com.resolvepay.api.model.AuditEvent;
import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.model.OutboxEvent;
import com.resolvepay.api.model.WebhookInbox;
import com.resolvepay.api.repository.AuditEventRepository;
import com.resolvepay.api.repository.DisputeRepository;
import com.resolvepay.api.repository.OutboxEventRepository;
import com.resolvepay.api.repository.WebhookInboxRepository;
import com.resolvepay.api.security.MerchantContext;
import com.resolvepay.api.util.DateUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PayPalWebhookService {

    private static final Logger log = LoggerFactory.getLogger(PayPalWebhookService.class);

    private final PayPalClient payPalClient;
    private final WebhookInboxRepository webhookInboxRepository;
    private final DisputeRepository disputeRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean verifySignature(
            String transmissionId,
            String transmissionTime,
            String certUrl,
            String authAlgo,
            String transmissionSig,
            String rawBody) {
        return payPalClient.verifyWebhookSignature(
                transmissionId,
                transmissionTime,
                certUrl,
                authAlgo,
                transmissionSig,
                null,
                rawBody
        );
    }

    @Transactional
    public Map<String, Object> processIncomingWebhook(String rawBody) {
        return doProcessWebhook(rawBody, "PAYPAL", null);
    }

    @Transactional
    public Map<String, Object> processSimulatedWebhook(String rawBody, String merchantId) {
        return doProcessWebhook(rawBody, "PAYPAL_SIMULATED", merchantId);
    }

    private Map<String, Object> doProcessWebhook(String rawBody, String providerName, String forcedMerchantId) {
        Map<String, Object> result = new HashMap<>();

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String providerEventId = root.path("id").asText();
            String eventType = root.path("event_type").asText();
            JsonNode resource = root.path("resource");
            String resourceId = resource.path("dispute_id").asText(resource.path("id").asText(""));

            log.info("Processing {} webhook event: type={}, eventId={}, resourceId={}", 
                    providerName, eventType, providerEventId, resourceId);

            // 1. Idempotency Check: Don't process duplicates
            Optional<WebhookInbox> existingInbox = webhookInboxRepository
                    .findByProviderAndProviderEventId(providerName, providerEventId);

            if (existingInbox.isPresent()) {
                log.info("Webhook event {} already in inbox with status {}. Skipping duplicate.",
                        providerEventId, existingInbox.get().getProcessingStatus());
                result.put("status", "DUPLICATE_ACCEPTED");
                result.put("eventId", providerEventId);
                return result;
            }

            // 2. Persist in Webhook Inbox
            WebhookInbox inbox = new WebhookInbox();
            inbox.setProvider(providerName);
            inbox.setProviderEventId(providerEventId);
            inbox.setEventType(eventType);
            inbox.setResourceId(resourceId);
            inbox.setPayload(rawBody);
            inbox.setProcessingStatus("PENDING");
            inbox.setAttemptCount(1);
            webhookInboxRepository.save(inbox);

            // 3. Process Dispute Events Transactionally
            if (eventType.startsWith("CUSTOMER.DISPUTE.")) {
                Dispute updatedDispute = handleDisputeEvent(eventType, resource, forcedMerchantId);

                // 4. Create Transactional Outbox Event for Real-time Projection Sync
                createOutboxEvent(updatedDispute, eventType);

                // 5. Append Audit Event
                createAuditEvent(providerEventId, eventType, updatedDispute);

                inbox.setProcessingStatus("PROCESSED");
                webhookInboxRepository.save(inbox);

                result.put("status", "SUCCESS");
                result.put("disputeId", updatedDispute.getId());
                result.put("paypalDisputeId", updatedDispute.getPaypalDisputeId());
                return result;
            } else {
                inbox.setProcessingStatus("IGNORED");
                webhookInboxRepository.save(inbox);
                result.put("status", "EVENT_IGNORED");
                return result;
            }

        } catch (Exception e) {
            log.error("Failed to process webhook: {}", e.getMessage(), e);
            result.put("status", "ERROR");
            result.put("error", e.getMessage());
            return result;
        }
    }

    private Dispute handleDisputeEvent(String eventType, JsonNode resource, String forcedMerchantId) {
        String paypalDisputeId = resource.path("dispute_id").asText();
        if (paypalDisputeId.isBlank()) {
            paypalDisputeId = resource.path("id").asText();
        }

        final String finalDisputeId = paypalDisputeId;
        Dispute dispute = disputeRepository.findByPaypalDisputeId(finalDisputeId)
                .orElseGet(() -> {
                    Dispute newDispute = new Dispute();
                    newDispute.setPaypalDisputeId(finalDisputeId);
                    return newDispute;
                });

        // Set or preserve merchant_id
        if (dispute.getMerchantId() == null || dispute.getMerchantId().isBlank()) {
            String merchantId = forcedMerchantId;
            if (merchantId == null || merchantId.isBlank()) {
                merchantId = resource.path("merchant_id").asText(null);
            }
            if (merchantId == null || merchantId.isBlank()) {
                merchantId = MerchantContext.getCurrentMerchantId();
            }
            if (merchantId == null || merchantId.isBlank()) {
                merchantId = "merchant_resolvepay_01";
            }
            dispute.setMerchantId(merchantId);
        }

        dispute.setStatus(resource.path("status").asText("OPEN"));
        dispute.setReason(resource.path("reason").asText("UNSPECIFIED"));
        dispute.setDisputeLifeCycleStage(resource.path("dispute_life_cycle_stage").asText(null));
        dispute.setDisputeChannel(resource.path("dispute_channel").asText(null));

        JsonNode amountNode = resource.path("dispute_amount");
        dispute.setAmount(new BigDecimal(amountNode.path("value").asText("0.00")));
        dispute.setCurrency(amountNode.path("currency_code").asText("USD"));

        // Authoritative Response Deadline Mapping
        String dueDateStr = null;
        if (resource.hasNonNull("seller_response_due_date")) {
            dueDateStr = resource.path("seller_response_due_date").asText();
        } else if (resource.hasNonNull("response_due_date")) {
            dueDateStr = resource.path("response_due_date").asText();
        }
        if (dueDateStr != null && !dueDateStr.isBlank()) {
            LocalDateTime parsedDeadline = DateUtils.parsePayPalTimestamp(dueDateStr);
            if (parsedDeadline != null) {
                dispute.setDeadline(parsedDeadline);
            }
        }

        return disputeRepository.save(dispute);
    }

    private void createOutboxEvent(Dispute dispute, String eventType) {
        try {
            Map<String, Object> projection = new HashMap<>();
            projection.put("disputeId", dispute.getId());
            projection.put("paypalDisputeId", dispute.getPaypalDisputeId());
            projection.put("status", dispute.getStatus());
            projection.put("reason", dispute.getReason());
            projection.put("amount", dispute.getAmount());
            projection.put("currency", dispute.getCurrency());
            projection.put("deadline", dispute.getDeadline() != null ? dispute.getDeadline().toString() : null);
            projection.put("merchantId", dispute.getMerchantId());
            projection.put("lifeCycleStage", dispute.getDisputeLifeCycleStage());
            projection.put("channel", dispute.getDisputeChannel());
            projection.put("updatedAt", LocalDateTime.now().toString());

            OutboxEvent outbox = new OutboxEvent();
            outbox.setAggregateType("DISPUTE");
            outbox.setAggregateId(dispute.getId().toString());
            outbox.setEventType(eventType);
            outbox.setPayload(objectMapper.writeValueAsString(projection));
            outbox.setStatus("PENDING");
            outbox.setVersion(1);

            outboxEventRepository.save(outbox);
            log.info("Created outbox event for dispute {}", dispute.getPaypalDisputeId());
        } catch (Exception e) {
            log.warn("Failed to create outbox event: {}", e.getMessage());
        }
    }

    private void createAuditEvent(String eventId, String eventType, Dispute dispute) {
        try {
            AuditEvent audit = new AuditEvent();
            audit.setActor("PAYPAL_WEBHOOK");
            audit.setAction(eventType);
            audit.setTarget("Dispute:" + dispute.getPaypalDisputeId());
            audit.setTimestamp(LocalDateTime.now());
            audit.setOutcome("SUCCESS");
            audit.setRedactedDetails(String.format("{\"webhookEventId\":\"%s\",\"disputeId\":\"%s\",\"merchantId\":\"%s\"}",
                    eventId, dispute.getId(), dispute.getMerchantId()));

            auditEventRepository.save(audit);
        } catch (Exception ex) {
            log.warn("Failed to log audit event: {}", ex.getMessage());
        }
    }
}
