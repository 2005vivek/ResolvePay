package com.resolvepay.api.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "webhook_events")
@Data
@NoArgsConstructor
public class WebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "provider_event_id", nullable = false, unique = true)
    private String providerEventId;

    @CreationTimestamp
    @Column(name = "received_time", updatable = false)
    private LocalDateTime receivedTime;

    @Column(name = "signature_verification_result")
    private Boolean signatureVerificationResult;

    @Column(name = "processing_status", nullable = false, length = 50)
    private String processingStatus;

    @Column(name = "retry_count")
    private Integer retryCount = 0;
}