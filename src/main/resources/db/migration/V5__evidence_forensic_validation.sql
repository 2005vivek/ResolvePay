-- Phase 5: Forensic Evidence Validation & Fraud Shield
-- Adds columns for PayPal-approved format tracking, manipulation detection, and PayPal security incident reporting

ALTER TABLE disputes 
    ADD COLUMN IF NOT EXISTS fraud_alert_status VARCHAR(100),
    ADD COLUMN IF NOT EXISTS paypal_incident_id VARCHAR(100);

ALTER TABLE evidence_items 
    ADD COLUMN IF NOT EXISTS document_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_manipulated BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS paypal_incident_id VARCHAR(100);
