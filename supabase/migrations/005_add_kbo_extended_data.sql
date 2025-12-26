-- Extended KBO data fields
-- Capital, fiscal info, entity links, qualifications, etc.

-- Capital (share capital)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS capital DECIMAL(18,2);

-- Fiscal year info
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fiscal_year_end VARCHAR(10); -- e.g., "31/12" or "31 December"
ALTER TABLE companies ADD COLUMN IF NOT EXISTS annual_meeting_month VARCHAR(20); -- e.g., "April"

-- Juridical status date (when the current status started)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS juridical_situation_date DATE;

-- Entity links (predecessors, related companies, group structure)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS entity_links JSONB;
-- Structure: [{
--   "type": "predecessor" | "successor" | "related" | "unknown",
--   "vat_number": "0649641563",
--   "name": "Company Name",
--   "start_date": "1977-08-02",
--   "end_date": null
-- }]

-- Qualifications (RSZ employer, VAT subject, etc. with dates)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS qualifications JSONB;
-- Structure: [{
--   "type": "rsz_employer" | "vat_subject" | "registration_obligated",
--   "start_date": "1988-04-30",
--   "end_date": null
-- }]

-- NACE history (codes across different versions)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nace_history JSONB;
-- Structure: {
--   "2025": [{ "code": "70.100", "description": "..." }],
--   "2008": [{ "code": "70.100", "description": "..." }],
--   "2003": [{ "code": "74.151", "description": "..." }]
-- }

-- Exceptional fiscal periods
ALTER TABLE companies ADD COLUMN IF NOT EXISTS exceptional_fiscal_periods JSONB;
-- Structure: [{ "start_date": "2016-03-03", "end_date": "2016-12-31" }]

-- Comments
COMMENT ON COLUMN companies.capital IS 'Share capital in EUR from KBO';
COMMENT ON COLUMN companies.fiscal_year_end IS 'End date of fiscal year (e.g., 31 December)';
COMMENT ON COLUMN companies.annual_meeting_month IS 'Month of annual general meeting';
COMMENT ON COLUMN companies.juridical_situation_date IS 'Date when current juridical situation started';
COMMENT ON COLUMN companies.entity_links IS 'Links to related entities (predecessors, successors, group companies)';
COMMENT ON COLUMN companies.qualifications IS 'Business qualifications (RSZ, VAT, etc.) with dates';
COMMENT ON COLUMN companies.nace_history IS 'NACE codes across different classification versions';
COMMENT ON COLUMN companies.exceptional_fiscal_periods IS 'Non-standard fiscal periods';
