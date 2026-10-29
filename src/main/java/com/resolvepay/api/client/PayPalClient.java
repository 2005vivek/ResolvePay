package com.resolvepay.api.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Base64;

@Component
public class PayPalClient {

    private final RestClient restClient;
    private final String clientId;
    private final String clientSecret;

    // In a production app, you would check the token's expiration time before reusing it.
    private String currentAccessToken;

    public PayPalClient(

            @Value("${paypal.client-id}") String clientId,
            @Value("${paypal.client-secret}") String clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;

        // Target the Sandbox environment specifically
        this.restClient = RestClient.builder()
                .baseUrl("https://api-m.sandbox.paypal.com")
                .build();
    }

    public JsonNode fetchDisputes() {
        String token = getAccessToken();

        // Fetch the raw JSON as a String instead of trying to map it to JsonNode directly
        String responseStr = restClient.get()
                .uri("/v1/customer/disputes")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .body(String.class);

        // Parse the String into a JsonNode manually
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readTree(responseStr);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse PayPal JSON response", e);
        }
    }

    public String getAccessToken() {
        if (currentAccessToken != null) {
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

        if (response != null) {
            this.currentAccessToken = response.getAccessToken();
        }

        return this.currentAccessToken;
    }
}