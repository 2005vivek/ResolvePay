package com.resolvepay.api.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "disputes")
@Data
@NoArgsConstructor
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "paypal_dispute_id", unique = true)
    private String paypalDisputeId;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, length = 100)
    private String reason;

    private LocalDateTime deadline;

    @CreationTimestamp
    @Column(name = "last_synced_time", updatable = false)
    private LocalDateTime lastSyncedTime;
}