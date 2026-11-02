package com.resolvepay.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Public Health & Keep-Alive Endpoint for cron-job.org or uptime monitors.
     * Prevents Render free instances from going to sleep.
     */
    @GetMapping({"/api/health", "/health", "/api/ping"})
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "resolvepay-api");
        response.put("timestamp", Instant.now().toString());

        // Fast non-blocking DB check with 2s timeout
        try (Connection conn = dataSource.getConnection()) {
            response.put("database", conn.isValid(2) ? "CONNECTED" : "DEGRADED");
        } catch (Exception e) {
            response.put("database", "DISCONNECTED: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Root URL status check so direct browser pings return 200 OK.
     */
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> rootCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "ResolvePay Real-Time AI Dispute Defense Engine is running");
        response.put("health_endpoint", "/api/health");
        response.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(response);
    }
}
