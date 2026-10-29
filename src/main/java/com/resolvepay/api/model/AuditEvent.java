package com.resolvepay.api.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_events")
@Data
@NoArgsConstructor
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String actor;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false)
    private String target;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false, length = 50)
    private String outcome;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "redacted_details")
    private String redactedDetails;
}