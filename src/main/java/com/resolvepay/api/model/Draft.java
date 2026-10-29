package com.resolvepay.api.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "drafts")
@Data
@NoArgsConstructor
public class Draft {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @Column(nullable = false)
    private Integer version;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "evidence_references")
    private String evidenceReferences;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_model_metadata")
    private String aiModelMetadata;

    @Column(name = "reviewer_status", nullable = false, length = 50)
    private String reviewerStatus;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "edited_at")
    private LocalDateTime editedAt;
}
