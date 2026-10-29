package com.resolvepay.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.service.DisputeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DisputeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DisputeService disputeService;

    @Test
    @DisplayName("GET /api/disputes should return disputes list")
    void shouldReturnDisputesList() throws Exception {
        mockMvc.perform(get("/api/disputes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("POST /api/disputes/{id}/submit should handle malformed JSON cleanly with HTTP 400")
    void shouldHandleMalformedJsonCleanly() throws Exception {
        UUID randomId = UUID.randomUUID();
        String malformedJson = "{\"draftText\":\"Unexpected end of input in value string";

        mockMvc.perform(post("/api/disputes/{id}/submit", randomId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Malformed JSON request body: Unexpected end of input or invalid JSON syntax."))
                .andExpect(jsonPath("$.details").isNotEmpty());
    }
}
