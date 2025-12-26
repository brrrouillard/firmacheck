-- Optimized search function for instant autocomplete
-- Uses prefix matching for fast queries on 1M+ records

-- Ensure pg_trgm extension is enabled (for future fuzzy search enhancements)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index for fast case-insensitive prefix search on name
CREATE INDEX IF NOT EXISTS idx_companies_name_lower
  ON companies (LOWER(name) text_pattern_ops);

-- Create search function using prefix matching
CREATE OR REPLACE FUNCTION search_companies(
  search_query TEXT,
  search_lang TEXT DEFAULT 'fr',
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  vat_number VARCHAR(10),
  name TEXT,
  slug VARCHAR(255),
  city TEXT,
  status company_status
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  cleaned_query TEXT;
  is_vat_search BOOLEAN;
BEGIN
  -- Clean query
  cleaned_query := TRIM(search_query);

  -- Detect VAT search: optional BE prefix followed by digits
  is_vat_search := UPPER(REGEXP_REPLACE(cleaned_query, '[\s.]', '', 'g')) ~ '^(BE)?[01]?\d+$';

  IF is_vat_search THEN
    -- VAT prefix search (uses primary key B-tree index)
    cleaned_query := REGEXP_REPLACE(UPPER(cleaned_query), '^BE', '');
    cleaned_query := REGEXP_REPLACE(cleaned_query, '[\s.]', '', 'g');

    RETURN QUERY
    SELECT
      c.vat_number,
      c.name,
      c.slug,
      CASE WHEN search_lang = 'nl' THEN c.address->>'city_nl' ELSE c.address->>'city_fr' END,
      c.status
    FROM companies c
    WHERE c.status = 'active'
      AND c.vat_number LIKE cleaned_query || '%'
    ORDER BY c.vat_number
    LIMIT result_limit;
  ELSE
    -- Name prefix search (uses idx_companies_name_lower index)
    RETURN QUERY
    SELECT
      c.vat_number,
      c.name,
      c.slug,
      CASE WHEN search_lang = 'nl' THEN c.address->>'city_nl' ELSE c.address->>'city_fr' END,
      c.status
    FROM companies c
    WHERE c.status = 'active'
      AND LOWER(c.name) LIKE LOWER(cleaned_query) || '%'
    ORDER BY c.name
    LIMIT result_limit;
  END IF;
END;
$$;

-- Grant access to the function for public API access
GRANT EXECUTE ON FUNCTION search_companies TO anon, authenticated;

-- Documentation
COMMENT ON FUNCTION search_companies IS
  'Fast company search with VAT number detection. Uses B-tree indexes for prefix matching.';
