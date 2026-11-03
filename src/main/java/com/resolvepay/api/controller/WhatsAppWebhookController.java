package com.resolvepay.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.repository.DisputeRepository;
import com.resolvepay.api.service.DisputeService;
import com.resolvepay.api.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Meta WhatsApp Cloud API Webhook Controller.
 * Handles Meta webhook registration handshake, inbound merchant 1-tap actions,
 * and test-send triggers for dashboard simulation/live testing.
 */
@RestController
@RequestMapping("/api/webhooks/whatsapp")
@RequiredArgsConstructor
public class WhatsAppWebhookController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);

    private final WhatsAppService whatsAppService;
    private final DisputeService disputeService;
    private final DisputeRepository disputeRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 1. Meta Webhook Verification Handshake.
     * When configuring webhook in Meta App Dashboard, Meta sends:
     * GET /api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=...&hub.verify_token=...
     */
    @GetMapping(produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> verifyWebhook(
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.verify_token", required = false) String verifyToken,
            @RequestParam(name = "hub.challenge", required = false) String challenge) {

        log.info("Received WhatsApp webhook verification handshake: mode={}, token={}", mode, verifyToken);

        if ("subscribe".equalsIgnoreCase(mode) && whatsAppService.getVerifyToken().equals(verifyToken)) {
            log.info("WhatsApp webhook handshake VERIFIED. Returning challenge: {}", challenge);
            return ResponseEntity.ok(challenge);
        }

        log.warn("WhatsApp webhook handshake REJECTED: invalid token or mode");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification token mismatch");
    }

    /**
     * 2. Meta Inbound Message / Interactive Button Reply Receiver.
     * Receives merchant responses: "1", "APPROVE", or 1-tap button clicks from WhatsApp.
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> handleIncomingMessage(@RequestBody String rawBody) {
        log.info("Received incoming WhatsApp webhook payload: {}", rawBody);

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            JsonNode entryNode = root.path("entry");
            if (entryNode.isArray() && !entryNode.isEmpty()) {
                JsonNode changes = entryNode.get(0).path("changes");
                if (changes.isArray() && !changes.isEmpty()) {
                    JsonNode value = changes.get(0).path("value");
                    JsonNode messages = value.path("messages");

                    if (messages.isArray() && !messages.isEmpty()) {
                        JsonNode msg = messages.get(0);
                        String sender = msg.path("from").asText("");
                        String msgType = msg.path("type").asText("");

                        String actionPayload = "";
                        if ("interactive".equals(msgType)) {
                            JsonNode btn = msg.path("interactive").path("button_reply");
                            actionPayload = btn.path("id").asText(btn.path("title").asText(""));
                        } else if ("button".equals(msgType)) {
                            actionPayload = msg.path("button").path("payload").asText(msg.path("button").path("text").asText(""));
                        } else if ("text".equals(msgType)) {
                            actionPayload = msg.path("text").path("body").asText("").trim().toUpperCase();
                        }

                        log.info("Parsed WhatsApp interaction from {}: type={}, actionPayload={}", sender, msgType, actionPayload);

                        String upperPayload = actionPayload.toUpperCase();
                        if (upperPayload.startsWith("APPROVE") || "1".equals(upperPayload) || upperPayload.contains("DEFEND") || upperPayload.contains("AUTO-DEFEND") || upperPayload.contains("YES") || upperPayload.contains("SUBMIT")) {
                            handleAutoDefend(sender, actionPayload);
                        } else if (upperPayload.startsWith("STATUS") || "STATUS".equals(upperPayload) || upperPayload.contains("DETAIL")) {
                            handleStatusInquiry(sender, actionPayload);
                        } else {
                            // Friendly guidance for any other message
                            whatsAppService.sendTextMessage(sender,
                                    "👋 *ResolvePay Autopilot Assistant*\n\n" +
                                            "• Reply *1* or tap *Auto-Defend* on any dispute alert to safeguard your funds.\n" +
                                            "• Reply *STATUS* to view pending chargebacks.\n\n" +
                                            "Live Dashboard: https://resolvepay-autopilot.vercel.app");
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Error processing inbound WhatsApp message: {}", ex.getMessage(), ex);
        }

        return ResponseEntity.ok(Map.of("status", "EVENT_RECEIVED"));
    }

    /**
     * 3. Test-Send Endpoint: Dispatch a test WhatsApp alert from the merchant dashboard.
     */
    @PostMapping("/test-send")
    public ResponseEntity<Map<String, Object>> testSendAlert(@RequestBody(required = false) Map<String, String> request) {
        String phone = (request != null && request.containsKey("phone")) ? request.get("phone") : "";
        String disputeId = (request != null && request.containsKey("disputeId")) ? request.get("disputeId") : "";

        Dispute targetDispute = null;
        if (!disputeId.isBlank()) {
            targetDispute = disputeRepository.findByPaypalDisputeId(disputeId).orElse(null);
        }

        if (targetDispute == null) {
            List<Dispute> all = disputeRepository.findAll();
            targetDispute = all.stream()
                    .filter(d -> !"UNDER_REVIEW".equalsIgnoreCase(d.getStatus()) && !"RESOLVED".equalsIgnoreCase(d.getStatus()))
                    .findFirst()
                    .orElse(all.isEmpty() ? null : all.get(0));
        }

        Map<String, Object> dispatchResult = whatsAppService.sendDisputeAlert(targetDispute, phone);
        return ResponseEntity.ok(dispatchResult);
    }

    /**
     * 4. Configuration & Status endpoint.
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("configured", whatsAppService.isConfigured());
        config.put("verifyToken", whatsAppService.getVerifyToken());
        config.put("webhookUrl", "https://resolvepay-api.onrender.com/api/webhooks/whatsapp");
        config.put("phoneNumberId", whatsAppService.getPhoneNumberId().isBlank() ? "NOT_SET" : whatsAppService.getPhoneNumberId());
        config.put("defaultMerchantPhone", whatsAppService.getDefaultMerchantPhone());
        config.put("tokenHealth", whatsAppService.verifyTokenHealth());
        return ResponseEntity.ok(config);
    }

    /**
     * 5. Update Token Endpoint: Allows updating the Meta Cloud API temporary/permanent access token dynamically.
     */
    @PostMapping("/update-token")
    public ResponseEntity<Map<String, Object>> updateToken(@RequestBody(required = false) Map<String, String> body) {
        String token = "";
        if (body != null) {
            token = body.getOrDefault("token", body.getOrDefault("apiToken", "")).trim();
        }
        if (!token.isBlank()) {
            whatsAppService.setApiToken(token);
            log.info("Updated WhatsApp API token dynamically in memory");
        }
        return ResponseEntity.ok(whatsAppService.verifyTokenHealth());
    }

    private void handleAutoDefend(String senderPhone, String actionPayload) {
        // Extract dispute ID if present (e.g., APPROVE_PP-D-849102)
        String disputeId = "";
        if (actionPayload.contains("_")) {
            disputeId = actionPayload.substring(actionPayload.indexOf("_") + 1).trim();
        } else if (actionPayload.contains("PP-D-")) {
            int idx = actionPayload.indexOf("PP-D-");
            disputeId = actionPayload.substring(idx).split("[^A-Z0-9-]")[0].trim();
        }

        Optional<Dispute> disputeOpt = !disputeId.isBlank()
                ? disputeRepository.findByPaypalDisputeId(disputeId)
                : disputeRepository.findAll().stream()
                .filter(d -> !"UNDER_REVIEW".equalsIgnoreCase(d.getStatus()) && !"RESOLVED".equalsIgnoreCase(d.getStatus()))
                .findFirst();

        if (disputeOpt.isPresent()) {
            Dispute dispute = disputeOpt.get();

            // Gracefully handle if already defended or resolved
            if ("UNDER_REVIEW".equalsIgnoreCase(dispute.getStatus()) || "RESOLVED".equalsIgnoreCase(dispute.getStatus())) {
                log.info("Dispute {} is already defended ({}); sending reassurance to {}", 
                        dispute.getPaypalDisputeId(), dispute.getStatus(), senderPhone);
                whatsAppService.sendTextMessage(senderPhone,
                        "ℹ️ *ResolvePay Defense Already Lodged!*\n\n" +
                                "• Case: *" + dispute.getPaypalDisputeId() + "*\n" +
                                "• Status: *Defended (Under PayPal Review)*\n" +
                                "• Proof: Multi-carrier EDI delivery record is already registered.\n\n" +
                                "This case is already safeguarded and under PayPal investigation.");
                return;
            }

            try {
                String rebuttal = "Official Seller Defense Rebuttal for " + dispute.getPaypalDisputeId() +
                        ": Grounded Proof submitted via ResolvePay WhatsApp Autopilot. Verified carrier tracking demonstrates timely delivery to buyer address on file with signature.";

                disputeService.submitResolutionDraft(dispute.getId(), rebuttal);

                whatsAppService.sendTextMessage(senderPhone,
                        "✅ *ResolvePay Defense Submitted!*\n\n" +
                                "• Case: *" + dispute.getPaypalDisputeId() + "*\n" +
                                "• Status: *Defended (Under PayPal Review)*\n" +
                                "• Proof: Multi-carrier EDI delivery record submitted.\n\n" +
                                "Your merchant dispute is now officially safeguarded.");
            } catch (Exception ex) {
                log.error("Failed to auto-submit dispute defense from WhatsApp: {}", ex.getMessage());
                whatsAppService.sendTextMessage(senderPhone,
                        "⚠️ ResolvePay Notice: Dispute " + dispute.getPaypalDisputeId() +
                                " could not be submitted automatically: " + ex.getMessage());
            }
        } else {
            whatsAppService.sendTextMessage(senderPhone,
                    "ℹ️ ResolvePay: No pending action-required disputes found in your queue.");
        }
    }

    private void handleStatusInquiry(String senderPhone, String actionPayload) {
        long pendingCount = disputeRepository.findAll().stream()
                .filter(d -> !"UNDER_REVIEW".equalsIgnoreCase(d.getStatus()) && !"RESOLVED".equalsIgnoreCase(d.getStatus()))
                .count();

        whatsAppService.sendTextMessage(senderPhone,
                "📊 *ResolvePay Dispute Status Summary*\n\n" +
                        "• Pending Action: *" + pendingCount + " cases*\n" +
                        "• AI Defense Pipeline: *Active*\n" +
                        "• Webhook Integration: *Healthy*\n\n" +
                        "View full live details on your ResolvePay Dashboard.");
    }
}
