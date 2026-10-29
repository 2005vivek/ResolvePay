package com.resolvepay.api.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "evidence_items")
@Data
@NoArgsConstructor
public class EvidenceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "merchant_id", nullable = false, length = 100)
    private String merchantId = "merchant_resolvepay_01";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false)
    private String source;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;

    private String filename;

    @Column(name = "extraction_status", length = 50)
    private String extractionStatus;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "extracted_facts", columnDefinition = "TEXT")
    private String extractedFacts;

    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;
}
