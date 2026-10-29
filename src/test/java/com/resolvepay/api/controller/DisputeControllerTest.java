package com.resolvepay.api.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DisputeControllerTest {

    private static final String AUTH_HEADER = "Bearer rzp_live_sec_789f2a4b8c1d";

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/disputes without credentials should return HTTP 401 Unauthorized")
    void shouldRejectUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/api/disputes"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Valid merchant authentication token required."));
    }

    @Test
    @DisplayName("GET /api/disputes with valid credentials should return disputes list")
    void shouldReturnDisputesListWhenAuthenticated() throws Exception {
        mockMvc.perform(get("/api/disputes")
                        .header(HttpHeaders.AUTHORIZATION, AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/disputes/test-auth should return safe metadata and NEVER leak tokens")
    void testAuthShouldNotLeakTokens() throws Exception {
        mockMvc.perform(get("/api/disputes/test-auth"))
                .andExpect(status().is(in(java.util.List.of(200, 503))))
                .andExpect(jsonPath("$.status").exists())
                // Regression assertion: assert response does NOT contain any token field or token string
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.accessToken").doesNotExist())
                .andExpect(jsonPath("$.clientSecret").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/disputes/{id}/submit should handle malformed JSON cleanly with HTTP 400")
    void shouldHandleMalformedJsonCleanly() throws Exception {
        UUID randomId = UUID.randomUUID();
        String malformedJson = "{\"draftText\":\"Unexpected end of input in value string";

        mockMvc.perform(post("/api/disputes/{id}/submit", randomId)
                        .header(HttpHeaders.AUTHORIZATION, AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Malformed JSON request body: Unexpected end of input or invalid JSON syntax."))
                .andExpect(jsonPath("$.details").isNotEmpty());
    }
}
