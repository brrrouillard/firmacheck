-- Related Companies Function
-- Fetches company + similar + neighbors in a single query for optimal performance

CREATE OR REPLACE FUNCTION get_company_with_related(
  p_vat_number VARCHAR(10),
  p_lang VARCHAR(2) DEFAULT 'fr',
  p_limit INT DEFAULT 6
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_company RECORD;
  v_nace_main VARCHAR(10);
  v_postal_code VARCHAR(10);
  v_similar JSON;
  v_neighbors JSON;
BEGIN
  -- Fetch main company
  SELECT * INTO v_company
  FROM companies
  WHERE vat_number = p_vat_number;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_nace_main := v_company.nace_main;
  v_postal_code := v_company.address->>'postal_code';

  -- Fetch similar companies (same NACE code)
  -- Ordered by: financials > establishment count > oldest first
  -- Filtered: name must start with a letter (no weird names)
  IF v_nace_main IS NOT NULL THEN
    SELECT json_agg(sub) INTO v_similar
    FROM (
      SELECT
        vat_number,
        name,
        slug,
        CASE WHEN p_lang = 'nl' THEN address->>'city_nl' ELSE address->>'city_fr' END as city,
        nace_main,
        financial_summary IS NOT NULL as has_financials
      FROM companies
      WHERE nace_main = v_nace_main
        AND status = 'active'
        AND vat_number != p_vat_number
        AND name ~ '^[A-Za-zÀ-ÿ]'
      ORDER BY
        CASE WHEN financial_summary IS NOT NULL THEN 0 ELSE 1 END,
        establishment_count DESC NULLS LAST,
        start_date ASC NULLS LAST
      LIMIT p_limit
    ) sub;

    -- Fallback to sector (2-digit NACE) if too few results
    IF v_similar IS NULL OR json_array_length(v_similar) < 3 THEN
      SELECT json_agg(sub) INTO v_similar
      FROM (
        SELECT
          vat_number,
          name,
          slug,
          CASE WHEN p_lang = 'nl' THEN address->>'city_nl' ELSE address->>'city_fr' END as city,
          nace_main,
          financial_summary IS NOT NULL as has_financials
        FROM companies
        WHERE nace_main LIKE (LEFT(v_nace_main, 2) || '%')
          AND status = 'active'
          AND vat_number != p_vat_number
          AND name ~ '^[A-Za-zÀ-ÿ]'
        ORDER BY
          CASE WHEN financial_summary IS NOT NULL THEN 0 ELSE 1 END,
          establishment_count DESC NULLS LAST,
          start_date ASC NULLS LAST
        LIMIT p_limit
      ) sub;
    END IF;
  END IF;

  -- Fetch neighbor companies (same postal code)
  -- Same ordering: established companies first
  IF v_postal_code IS NOT NULL THEN
    SELECT json_agg(sub) INTO v_neighbors
    FROM (
      SELECT
        vat_number,
        name,
        slug,
        CASE WHEN p_lang = 'nl' THEN address->>'city_nl' ELSE address->>'city_fr' END as city,
        nace_main,
        financial_summary IS NOT NULL as has_financials
      FROM companies
      WHERE address->>'postal_code' = v_postal_code
        AND status = 'active'
        AND vat_number != p_vat_number
        AND name ~ '^[A-Za-zÀ-ÿ]'
      ORDER BY
        CASE WHEN financial_summary IS NOT NULL THEN 0 ELSE 1 END,
        establishment_count DESC NULLS LAST,
        start_date ASC NULLS LAST
      LIMIT p_limit
    ) sub;
  END IF;

  -- Return combined result
  RETURN json_build_object(
    'company', row_to_json(v_company),
    'similar', COALESCE(v_similar, '[]'::json),
    'neighbors', COALESCE(v_neighbors, '[]'::json)
  );
END;
$$;

COMMENT ON FUNCTION get_company_with_related IS 'Fetches company with similar and neighbor companies in a single query';
