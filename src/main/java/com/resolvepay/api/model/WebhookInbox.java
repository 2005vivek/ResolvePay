package com.resolvepay.api.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "webhook_inbox", uniqueConstraints = {
    @UniqueConstraint(name = "uq_webhook_inbox_provider_event", columnNames = {"provider", "provider_event_id"})
})
@Data
@NoArgsConstructor
public class WebhookInbox {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String provider = "PAYPAL";

    @Column(name = "provider_event_id", nullable = false)
    private String providerEventId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "resource_id")
    private String resourceId;

    @CreationTimestamp
    @Column(name = "received_at", nullable = false, updatable = false)
    private LocalDateTime receivedAt;

    @Column(name = "processing_status", nullable = false, length = 50)
    private String processingStatus = "PENDING";

    @Column(name = "attempt_count")
    private Integer attemptCount = 0;

    @Column(name = "next_attempt_at")
    private LocalDateTime nextAttemptAt;

    @Column(name = "last_error_code", columnDefinition = "TEXT")
    private String lastErrorCode;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;
}
