CREATE TABLE webhook_inbox (
    id UUID PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    provider_event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processing_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    attempt_count INT DEFAULT 0,
    next_attempt_at TIMESTAMP,
    last_error_code TEXT,
    payload TEXT NOT NULL,
    CONSTRAINT uq_webhook_inbox_provider_event UNIQUE (provider, provider_event_id)
);

CREATE INDEX idx_webhook_inbox_status ON webhook_inbox (processing_status);

CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    version INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_outbox_events_status ON outbox_events (status);

ALTER TABLE disputes 
    ADD COLUMN IF NOT EXISTS dispute_life_cycle_stage VARCHAR(100),
    ADD COLUMN IF NOT EXISTS dispute_channel VARCHAR(100);
