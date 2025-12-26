-- FirmaCheck Database Schema
-- Companies table for Belgian company directory

-- Company status enum
CREATE TYPE company_status AS ENUM ('active', 'stopped');

-- Main companies table
CREATE TABLE companies (
  -- Core identification (VAT number is the natural primary key - stable Belgian enterprise number)
  vat_number VARCHAR(10) PRIMARY KEY,  -- Normalized: 0123456789
  name TEXT NOT NULL,
  slug VARCHAR(100) NOT NULL,

  -- Legal info
  legal_form VARCHAR(20),  -- NV, BV, SA, SPRL, etc.
  status company_status NOT NULL DEFAULT 'active',

  -- Address (JSONB for flexibility)
  address JSONB,
  -- Expected structure:
  -- {
  --   "street": "Rue de la Loi",
  --   "number": "123",
  --   "box": "B1",
  --   "postal_code": "1000",
  --   "city": "Bruxelles",
  --   "country": "BE"
  -- }

  -- NACE codes (activity classification)
  nace_codes TEXT[],

  -- Financial summary (latest year, JSONB)
  financial_summary JSONB,
  -- Expected structure:
  -- {
  --   "year": 2023,
  --   "turnover": 1500000,
  --   "profit_loss": 125000,
  --   "equity": 500000,
  --   "employees": 25
  -- }

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_enriched_at TIMESTAMPTZ  -- Last time data was fetched from external sources
);

-- Indexes for performance (vat_number already indexed as primary key)
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_status ON companies(status);
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
COMMENT ON COLUMN companies.slug IS 'URL-friendly company name for SEO';
COMMENT ON COLUMN companies.nace_codes IS 'NACE-BEL activity classification codes';
