CREATE TABLE disputes (
                          id UUID PRIMARY KEY,
                          paypal_dispute_id VARCHAR(255) UNIQUE,
                          status VARCHAR(255) NOT NULL,
                          amount DECIMAL(10, 2) NOT NULL,
                          currency VARCHAR(3) NOT NULL,
                          reason VARCHAR(100) NOT NULL,
                          deadline TIMESTAMP,
                          last_synced_time TIMESTAMP
);

CREATE TABLE evidence_items (
                                id UUID PRIMARY KEY,
                                dispute_id UUID NOT NULL REFERENCES disputes(id),
                                type VARCHAR(50) NOT NULL,
                                source VARCHAR(255) NOT NULL,
                                timestamp TIMESTAMP,
                                filename VARCHAR(255),
                                extraction_status VARCHAR(50),
                                content_hash VARCHAR(64)
);

CREATE TABLE drafts (
                        id UUID PRIMARY KEY,
                        dispute_id UUID NOT NULL REFERENCES disputes(id),
                        version INT NOT NULL,
                        text TEXT NOT NULL,
                        evidence_references JSONB,
                        ai_model_metadata JSONB,
                        reviewer_status VARCHAR(50) NOT NULL,
                        created_at TIMESTAMP,
                        edited_at TIMESTAMP
);

CREATE TABLE webhook_events (
                                id UUID PRIMARY KEY,
                                provider_event_id VARCHAR(255) NOT NULL UNIQUE,
                                received_time TIMESTAMP,
                                signature_verification_result BOOLEAN,
                                processing_status VARCHAR(50) NOT NULL,
                                retry_count INT DEFAULT 0
);

CREATE TABLE audit_events (
                              id UUID PRIMARY KEY,
                              actor VARCHAR(100) NOT NULL,
                              action VARCHAR(100) NOT NULL,
                              target VARCHAR(255) NOT NULL,
                              timestamp TIMESTAMP,
                              outcome VARCHAR(50) NOT NULL,
                              redacted_details JSONB
);