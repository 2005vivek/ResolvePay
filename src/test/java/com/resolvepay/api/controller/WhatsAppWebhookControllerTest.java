package com.resolvepay.api.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class WhatsAppWebhookControllerTest {

    private static final String AUTH_HEADER = "Bearer rzp_live_sec_789f2a4b8c1d";

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Meta Webhook Handshake: Valid subscribe mode and token must return raw challenge with HTTP 200")
    void testWebhookVerificationSuccess() throws Exception {
        String testChallenge = "1158201444";
        mockMvc.perform(get("/api/webhooks/whatsapp")
                        .param("hub.mode", "subscribe")
                        .param("hub.verify_token", "resolvepay_wa_verify_2026")
                        .param("hub.challenge", testChallenge))
                .andExpect(status().isOk())
                .andExpect(content().string(testChallenge));
    }

    @Test
    @DisplayName("Meta Webhook Handshake: Invalid token must return HTTP 403 Forbidden")
    void testWebhookVerificationFailure() throws Exception {
        mockMvc.perform(get("/api/webhooks/whatsapp")
                        .param("hub.mode", "subscribe")
                        .param("hub.verify_token", "wrong_token_here")
                        .param("hub.challenge", "1158201444"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Config endpoint returns webhook details")
    void testGetConfig() throws Exception {
        mockMvc.perform(get("/api/webhooks/whatsapp/config")
                        .header(HttpHeaders.AUTHORIZATION, AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verifyToken").value("resolvepay_wa_verify_2026"))
                .andExpect(jsonPath("$.webhookUrl").value("https://resolvepay-api.onrender.com/api/webhooks/whatsapp"));
    }

    @Test
    @DisplayName("Test-send endpoint triggers dispatch successfully")
    void testSendEndpoint() throws Exception {
        mockMvc.perform(post("/api/webhooks/whatsapp/test-send")
                        .header(HttpHeaders.AUTHORIZATION, AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"919876543210\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
