ALTER TABLE evidence_items 
    ADD COLUMN IF NOT EXISTS extracted_facts TEXT,
    ADD COLUMN IF NOT EXISTS file_url TEXT;
