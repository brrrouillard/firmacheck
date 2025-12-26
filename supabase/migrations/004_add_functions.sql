-- Add functions column to store company directors/managers
-- Data scraped from KBO public portal

ALTER TABLE companies ADD COLUMN IF NOT EXISTS functions JSONB;
-- Structure: [{ "name": "...", "role": "...", "role_code": "...", "start_date": "..." }]

-- Add last_kbo_enriched_at to track when KBO data was last scraped
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_kbo_enriched_at TIMESTAMPTZ;

-- Index for querying companies that need KBO enrichment
CREATE INDEX IF NOT EXISTS idx_companies_last_kbo_enriched_at ON companies(last_kbo_enriched_at);

COMMENT ON COLUMN companies.functions IS 'Company directors and managers from KBO portal';
COMMENT ON COLUMN companies.last_kbo_enriched_at IS 'Timestamp of last KBO portal scrape';
