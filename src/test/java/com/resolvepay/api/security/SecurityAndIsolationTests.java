package com.resolvepay.api.security;

import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.repository.DisputeRepository;
import com.resolvepay.api.util.DateUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityAndIsolationTests {

    private static final String AUTH_HEADER = "Bearer rzp_live_sec_789f2a4b8c1d";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DisputeRepository disputeRepository;

    @Test
    @DisplayName("Webhook endpoint must reject missing PayPal signature headers with HTTP 400")
    void webhookMustRejectMissingHeaders() throws Exception {
        mockMvc.perform(post("/api/webhooks/paypal")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"WH-TEST-FORGED\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Missing required PayPal signature verification headers"));
    }

    @Test
    @DisplayName("Cross-tenant Isolation: Merchant B cannot access or submit Merchant A's dispute")
    void crossTenantIsolationTest() throws Exception {
        String uniqueId = "PP-D-T-" + UUID.randomUUID().toString().substring(0, 8);

        // Create dispute owned by Merchant Alpha
        Dispute disputeA = new Dispute();
        disputeA.setPaypalDisputeId(uniqueId);
        disputeA.setMerchantId("merchant_alpha");
        disputeA.setStatus("REQUIRED_ACTION");
        disputeA.setAmount(new BigDecimal("150.00"));
        disputeA.setCurrency("USD");
        disputeA.setReason("MERCHANDISE_OR_SERVICE_NOT_RECEIVED");
        Dispute savedDisputeA = disputeRepository.save(disputeA);

        try {
            // Merchant Beta attempts to access Merchant Alpha's dispute
            mockMvc.perform(get("/api/disputes/" + savedDisputeA.getId())
                            .header(HttpHeaders.AUTHORIZATION, AUTH_HEADER)
                            .header("X-Merchant-Id", "merchant_beta"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error").value("Not Found"));

            // Merchant Beta attempts to submit response to Merchant Alpha's dispute
            mockMvc.perform(post("/api/disputes/" + savedDisputeA.getId() + "/submit")
                            .header(HttpHeaders.AUTHORIZATION, AUTH_HEADER)
                            .header("X-Merchant-Id", "merchant_beta")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"draftText\":\"Unauthorized rebuttal attempt\"}"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error").value("Not Found"));
        } finally {
            disputeRepository.delete(savedDisputeA);
        }
    }

    @Test
    @DisplayName("Deadline DateUtils parses various RFC-3339 / ISO formats without throwing")
    void testDateUtilsParsing() {
        // UTC format
        LocalDateTime dt1 = DateUtils.parsePayPalTimestamp("2026-11-05T08:00:00.000Z");
        assertNotNull(dt1, "Should parse UTC timestamp with millis");
        assertEquals(2026, dt1.getYear());
        assertEquals(11, dt1.getMonthValue());
        assertEquals(5, dt1.getDayOfMonth());

        // Offset format
        LocalDateTime dt2 = DateUtils.parsePayPalTimestamp("2026-11-05T10:00:00+02:00");
        assertNotNull(dt2, "Should parse offset timestamp");

        // Missing / empty returns null safely
        assertNull(DateUtils.parsePayPalTimestamp(null), "Null string should return null");
        assertNull(DateUtils.parsePayPalTimestamp(""), "Empty string should return null");
        assertNull(DateUtils.parsePayPalTimestamp("   "), "Blank string should return null");

        // Malformed string returns null safely without throwing
        assertNull(DateUtils.parsePayPalTimestamp("not-a-valid-timestamp"), "Malformed string should return null");
    }
}
