-- Phase 2: Merchant / Tenant Isolation Migration
-- Adds merchant_id column and safely backfills legacy records

ALTER TABLE disputes 
    ADD COLUMN IF NOT EXISTS merchant_id VARCHAR(100);

UPDATE disputes 
    SET merchant_id = 'merchant_resolvepay_01' 
    WHERE merchant_id IS NULL;

ALTER TABLE disputes 
    ALTER COLUMN merchant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_disputes_merchant_id ON disputes (merchant_id);

ALTER TABLE evidence_items 
    ADD COLUMN IF NOT EXISTS merchant_id VARCHAR(100);

UPDATE evidence_items 
    SET merchant_id = 'merchant_resolvepay_01' 
    WHERE merchant_id IS NULL;

ALTER TABLE evidence_items 
    ALTER COLUMN merchant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_merchant_id ON evidence_items (merchant_id);
