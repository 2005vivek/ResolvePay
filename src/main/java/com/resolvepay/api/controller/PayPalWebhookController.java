package com.resolvepay.api.controller;

import com.resolvepay.api.security.MerchantContext;
import com.resolvepay.api.service.PayPalWebhookService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/paypal")
@RequiredArgsConstructor
public class PayPalWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PayPalWebhookController.class);

    private final PayPalWebhookService payPalWebhookService;

    @Value("${resolvepay.simulation.enabled:true}")
    private boolean simulationEnabled;

    /**
     * Authoritative PayPal Webhook Receiver.
     * Enforces cryptographic signature verification on all incoming provider events.
     * Rejects missing or invalid signatures without bypass.
     */
    @PostMapping
    public ResponseEntity<?> handlePayPalWebhook(
            @RequestHeader(value = "PAYPAL-TRANSMISSION-ID", required = false) String transmissionId,
            @RequestHeader(value = "PAYPAL-TRANSMISSION-TIME", required = false) String transmissionTime,
            @RequestHeader(value = "PAYPAL-CERT-URL", required = false) String certUrl,
            @RequestHeader(value = "PAYPAL-AUTH-ALGO", required = false) String authAlgo,
            @RequestHeader(value = "PAYPAL-TRANSMISSION-SIG", required = false) String transmissionSig,
            @RequestBody String rawBody) {

        log.info("Received incoming external PayPal webhook notification");

        // 1. Mandatory Header Enforcement (Zero bypass in provider route)
        if (transmissionId == null || transmissionId.isBlank()
                || transmissionTime == null || transmissionTime.isBlank()
                || certUrl == null || certUrl.isBlank()
                || authAlgo == null || authAlgo.isBlank()
                || transmissionSig == null || transmissionSig.isBlank()) {
            log.warn("Rejected untrusted webhook: missing required PayPal signature headers");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "Bad Request",
                            "message", "Missing required PayPal signature verification headers"
                    ));
        }

        // 2. Cryptographic Signature Verification
        boolean isValid = payPalWebhookService.verifySignature(
                transmissionId,
                transmissionTime,
                certUrl,
                authAlgo,
                transmissionSig,
                rawBody
        );

        if (!isValid) {
            log.warn("Invalid PayPal webhook signature detected for transmission ID: {}", transmissionId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "Bad Request",
                            "message", "Invalid PayPal webhook signature"
                    ));
        }

        // 3. Process with Idempotency & Transactional Outbox
        Map<String, Object> response = payPalWebhookService.processIncomingWebhook(rawBody);
        return ResponseEntity.ok(response);
    }

    /**
     * Developer Demo Simulation Endpoint.
     * Clearly separated from real provider route.
     * Requires authenticated merchant session and active simulation configuration.
     */
    @PostMapping("/simulate")
    public ResponseEntity<?> handleSimulatedWebhook(@RequestBody String rawBody) {
        if (!simulationEnabled) {
            log.warn("Attempt to invoke webhook simulator while simulation is disabled");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "error", "Forbidden",
                            "message", "Webhook simulation mode is disabled in this environment"
                    ));
        }

        String merchantId = MerchantContext.getCurrentMerchantId();
        log.info("Processing simulated dispute webhook for merchant: {}", merchantId);

        Map<String, Object> response = payPalWebhookService.processSimulatedWebhook(rawBody, merchantId);
        return ResponseEntity.ok(response);
    }
}
