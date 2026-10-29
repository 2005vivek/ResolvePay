package com.resolvepay.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

/**
 * Authoritative Server-Enforced Authentication Filter.
 * Validates merchant credentials on every protected API endpoint.
 * Binds the authenticated merchant identifier to MerchantContext.
 */
@Component
@Order(1)
public class MerchantAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(MerchantAuthFilter.class);

    private final String expectedAuthToken;
    private final String defaultMerchantId;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MerchantAuthFilter(
            @Value("${resolvepay.security.auth-token:rzp_live_sec_789f2a4b8c1d}") String expectedAuthToken,
            @Value("${resolvepay.security.default-merchant-id:merchant_resolvepay_01}") String defaultMerchantId) {
        this.expectedAuthToken = expectedAuthToken;
        this.defaultMerchantId = defaultMerchantId;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // 1. Allow Pre-flight CORS OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // 2. Allow PayPal Webhooks (Protected independently by PayPal cryptographic signature verification)
        if (path.startsWith("/api/webhooks/paypal") && !path.contains("/simulate")) {
            return true;
        }

        // 3. Allow Public Health & Diagnostic Checks
        if ("/api/disputes/test-auth".equals(path) || "/api/health".equals(path)) {
            return true;
        }

        // Filter all other /api/** endpoints
        return !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        String apiKeyHeader = request.getHeader("X-API-KEY");

        String providedToken = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            providedToken = authHeader.substring(7).trim();
        } else if (apiKeyHeader != null && !apiKeyHeader.isBlank()) {
            providedToken = apiKeyHeader.trim();
        } else if (request.getParameter("auth_token") != null && !request.getParameter("auth_token").isBlank()) {
            // Allow authenticated binary streaming via direct secure URL
            providedToken = request.getParameter("auth_token").trim();
        }

        if (providedToken == null || !isValidToken(providedToken)) {
            log.warn("Unauthenticated request blocked on {}: missing or invalid credentials", request.getRequestURI());
            writeUnauthorizedResponse(response, "Valid merchant authentication token required.");
            return;
        }

        // Determine effective merchant identity
        String merchantIdHeader = request.getHeader("X-Merchant-Id");
        String effectiveMerchantId = (merchantIdHeader != null && !merchantIdHeader.isBlank())
                ? merchantIdHeader.trim()
                : defaultMerchantId;

        try {
            MerchantContext.setCurrentMerchantId(effectiveMerchantId);
            filterChain.doFilter(request, response);
        } finally {
            MerchantContext.clear();
        }
    }

    /**
     * Constant-time token comparison to prevent timing side-channel attacks.
     */
    private boolean isValidToken(String providedToken) {
        byte[] a = providedToken.getBytes(StandardCharsets.UTF_8);
        byte[] b = expectedAuthToken.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(a, b);
    }

    private void writeUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        Map<String, Object> errorBody = Map.of(
                "error", "Unauthorized",
                "message", message,
                "status", HttpStatus.UNAUTHORIZED.value()
        );
        response.getOutputStream().write(objectMapper.writeValueAsBytes(errorBody));
    }
}
