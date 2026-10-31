package com.resolvepay.api.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Component
public class PayPalClient {

    private static final Logger log = LoggerFactory.getLogger(PayPalClient.class);

    private final RestClient restClient;
    private final String clientId;
    private final String clientSecret;
    private final String configuredWebhookId;
    private final ObjectMapper objectMapper;

    // Cache access token with authoritative expiration tracking
    private String currentAccessToken;
    private Instant tokenExpiryTime;

    public PayPalClient(
            @Value("${paypal.client-id}") String clientId,
            @Value("${paypal.client-secret}") String clientSecret,
            @Value("${paypal.webhook-id:}") String configuredWebhookId) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.configuredWebhookId = configuredWebhookId;
        this.objectMapper = new ObjectMapper();

        // Target the Sandbox environment specifically
        this.restClient = RestClient.builder()
                .baseUrl("https://api-m.sandbox.paypal.com")
                .build();
    }

    public JsonNode fetchDisputes() {
        String token = getAccessToken();

        String responseStr = restClient.get()
                .uri("/v1/customer/disputes")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .body(String.class);

        try {
            return objectMapper.readTree(responseStr);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse PayPal JSON response", e);
        }
    }

    public JsonNode fetchDisputeDetails(String paypalDisputeId) {
        String token = getAccessToken();

        String responseStr = restClient.get()
                .uri("/v1/customer/disputes/{disputeId}", paypalDisputeId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .body(String.class);

        try {
            return objectMapper.readTree(responseStr);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch dispute details from PayPal", e);
        }
    }

    public boolean verifyWebhookSignature(
            String transmissionId,
            String transmissionTime,
            String certUrl,
            String authAlgo,
            String transmissionSig,
            String webhookId,
            String rawWebhookEventJson) {

        String targetWebhookId = (webhookId != null && !webhookId.isBlank()) 
                ? webhookId 
                : this.configuredWebhookId;

        // If no webhook ID configured yet in local/dev environment, log warning and allow for testing
        if (targetWebhookId == null || targetWebhookId.isBlank()) {
            log.warn("PAYPAL_WEBHOOK_ID is not configured. Allowing webhook event for development/testing.");
            return true;
        }

        try {
            String token = getAccessToken();
            JsonNode eventNode = objectMapper.readTree(rawWebhookEventJson);

            Map<String, Object> verifyPayload = new HashMap<>();
            verifyPayload.put("auth_algo", authAlgo);
            verifyPayload.put("cert_url", certUrl);
            verifyPayload.put("transmission_id", transmissionId);
            verifyPayload.put("transmission_sig", transmissionSig);
            verifyPayload.put("transmission_time", transmissionTime);
            verifyPayload.put("webhook_id", targetWebhookId);
            verifyPayload.put("webhook_event", eventNode);

            String verifyResponse = restClient.post()
                    .uri("/v1/notifications/verify-webhook-signature")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(verifyPayload)
                    .retrieve()
                    .body(String.class);

            JsonNode responseNode = objectMapper.readTree(verifyResponse);
            String verificationStatus = responseNode.path("verification_status").asText("");
            boolean isValid = "SUCCESS".equalsIgnoreCase(verificationStatus);
            log.info("PayPal Webhook signature verification status: {}", verificationStatus);
            return isValid;
        } catch (Exception e) {
            log.error("Error verifying PayPal webhook signature: {}", e.getMessage(), e);
            return false;
        }
    }

    public JsonNode submitProvideEvidence(String paypalDisputeId, String note) {
        String token = getAccessToken();

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("note", note);

        String responseStr = restClient.post()
                .uri("/v1/customer/disputes/{disputeId}/provide-evidence", paypalDisputeId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        try {
            return (responseStr != null && !responseStr.isBlank()) 
                    ? objectMapper.readTree(responseStr) 
                    : objectMapper.createObjectNode();
        } catch (Exception e) {
            log.warn("Non-JSON or empty response from provide-evidence endpoint: {}", responseStr);
            return objectMapper.createObjectNode();
        }
    }

    public synchronized String getAccessToken() {
        if (currentAccessToken != null && tokenExpiryTime != null && Instant.now().isBefore(tokenExpiryTime)) {
            return currentAccessToken;
        }

        String auth = clientId + ":" + clientSecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());

        PayPalAuthResponse response = restClient.post()
                .uri("/v1/oauth2/token")
                .header(HttpHeaders.AUTHORIZATION, "Basic " + encodedAuth)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("grant_type=client_credentials")
                .retrieve()
                .body(PayPalAuthResponse.class);

        if (response != null && response.getAccessToken() != null) {
            this.currentAccessToken = response.getAccessToken();
            int expiresIn = response.getExpiresIn() != null ? response.getExpiresIn() : 32400;
            // 60-second early refresh safety buffer
            this.tokenExpiryTime = Instant.now().plusSeconds(Math.max(expiresIn - 60, 60));
        }

        return this.currentAccessToken;
    }
}
