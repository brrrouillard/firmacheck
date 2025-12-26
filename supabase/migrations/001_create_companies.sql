-- FirmaCheck Database Schema
-- Companies table for Belgian company directory

-- Company status enum
CREATE TYPE company_status AS ENUM ('active', 'stopped');

-- Juridical situation enum (from KBO codes)
CREATE TYPE juridical_situation AS ENUM (
  'normal',                    -- 000: Normal situation
  'legal_creation',            -- 001: Legal creation
  'extension',                 -- 002: Extension
  'number_replacement',        -- 003: Enterprise number replacement
  'stopped_number_replacement',-- 006: Stopped due to number replacement
  'dissolution',               -- 010: Dissolution by law
  'foreign_ceased',            -- 011: Foreign entity ceased activities in Belgium
  'opening_bankruptcy',        -- 012: Opening of bankruptcy
  'closing_bankruptcy',        -- 013: Closing of bankruptcy
  'voluntary_dissolution',     -- 020: Voluntary dissolution
  'judicial_dissolution',      -- 030: Judicial dissolution
  'judicial_dissolution_closed',-- 031: Judicial dissolution closed
  'annulment',                 -- 040: Annulment
  'merger_acquisition',        -- 041: Merger/acquisition
  'division',                  -- 043: Division
  'transfer_registered_office',-- 048: Transfer of registered office abroad
  'bankruptcy',                -- 050: Bankruptcy
  'bankruptcy_closed',         -- 051: Bankruptcy closed
  'liquidation',               -- 091: Liquidation
  'other'                      -- Fallback for unknown codes
);

-- Main companies table
CREATE TABLE companies (
  -- Core identification (VAT number is the natural primary key - stable Belgian enterprise number)
  vat_number VARCHAR(10) PRIMARY KEY,  -- Normalized: 0123456789

  -- Display name and slug
  name TEXT NOT NULL,                  -- Best available name for display
  slug VARCHAR(255) NOT NULL,

  -- Multilingual names (JSONB for flexibility)
  names JSONB DEFAULT '{}',
  -- Structure:
  -- {
  --   "fr": "Société Exemple SA",
  --   "nl": "Voorbeeld NV",
  --   "de": "Beispiel AG",
  --   "en": "Example Ltd",
  --   "abbreviation": "EXEMPLE",
  --   "commercial": "Example Solutions"
  -- }

  -- Legal info
  legal_form VARCHAR(50),              -- Human-readable: NV, BV, SA, SRL, VZW, etc.
  legal_form_code VARCHAR(10),         -- Original KBO code for reference
  status company_status NOT NULL DEFAULT 'active',
  juridical_situation juridical_situation NOT NULL DEFAULT 'normal',
  start_date DATE,                     -- Foundation/start date

  -- Address (registered office, JSONB for bilingual support)
  address JSONB,
  -- Structure:
  -- {
  --   "street_fr": "Rue de la Loi",
  --   "street_nl": "Wetstraat",
  --   "number": "123",
  --   "box": "B1",
  --   "postal_code": "1000",
  --   "city_fr": "Bruxelles",
  --   "city_nl": "Brussel",
  --   "country": "BE"
  -- }

  -- Contact information (JSONB)
  contact JSONB,
  -- Structure:
  -- {
  --   "phone": "+32 2 123 45 67",
  --   "email": "info@example.be",
  --   "website": "https://example.be",
  --   "fax": "+32 2 123 45 68"
  -- }

  -- NACE codes (activity classification)
  nace_codes TEXT[],                   -- All NACE codes
  nace_main VARCHAR(10),               -- Main activity code

  -- Statistics
  establishment_count INT DEFAULT 0,   -- Number of establishments/branches

  -- Financial summary (from NBB enrichment, JSONB)
  financial_summary JSONB,
  -- Structure:
  -- {
  --   "year": 2023,
  --   "turnover": 1500000,
  --   "profit_loss": 125000,
  --   "equity": 500000,
  --   "employees": 25,
  --   "gross_margin": 45.5,
  --   "net_margin": 8.3
  -- }

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_enriched_at TIMESTAMPTZ        -- Last time data was fetched from external sources
);

-- Indexes for performance (vat_number already indexed as primary key)
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_juridical_situation ON companies(juridical_situation);
CREATE INDEX idx_companies_legal_form ON companies(legal_form);
CREATE INDEX idx_companies_postal_code ON companies((address->>'postal_code'));
CREATE INDEX idx_companies_nace_main ON companies(nace_main);
CREATE INDEX idx_companies_name_trgm ON companies USING GIN (name gin_trgm_ops);

-- Enable trigram extension for fuzzy search (run as superuser or enable in Supabase dashboard)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required)
CREATE POLICY "Public read access" ON companies
  FOR SELECT
  USING (true);

-- Comments
COMMENT ON TABLE companies IS 'Belgian company directory from CBE/KBO data';
COMMENT ON COLUMN companies.vat_number IS 'Primary key - Normalized Belgian VAT (10 digits, no prefix/dots)';
COMMENT ON COLUMN companies.name IS 'Best available display name (prefers FR > NL > DE > EN)';
COMMENT ON COLUMN companies.names IS 'Multilingual names: official (fr/nl/de/en), abbreviation, commercial';
COMMENT ON COLUMN companies.slug IS 'URL-friendly company name for SEO';
COMMENT ON COLUMN companies.legal_form_code IS 'Original KBO juridical form code';
COMMENT ON COLUMN companies.juridical_situation IS 'Legal status: normal, bankruptcy, liquidation, etc.';
COMMENT ON COLUMN companies.nace_codes IS 'NACE-BEL activity classification codes';
COMMENT ON COLUMN companies.nace_main IS 'Primary NACE activity code';
COMMENT ON COLUMN companies.establishment_count IS 'Number of establishments/branches';
