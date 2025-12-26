/**
 * Related Companies Queries
 *
 * Fetches similar companies (by NACE code) and neighbor companies (by postal code)
 * for display on company pages.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/types';

export interface RelatedCompany {
  vat_number: string;
  name: string;
  slug: string;
  city: string | null;
  nace_main: string | null;
  has_financials: boolean;
}

interface RawCompanyRow {
  vat_number: string;
  name: string;
  slug: string;
  address: { city_fr?: string; city_nl?: string; postal_code?: string } | null;
  nace_main: string | null;
  financial_summary: unknown;
}

/**
 * Transform raw DB rows to RelatedCompany format
 */
function transformRows(
  rows: RawCompanyRow[],
  lang: string
): RelatedCompany[] {
  return rows.map((c) => ({
    vat_number: c.vat_number,
    name: c.name,
    slug: c.slug,
    city: lang === 'nl' ? c.address?.city_nl ?? null : c.address?.city_fr ?? null,
    nace_main: c.nace_main,
    has_financials: c.financial_summary !== null,
  }));
}

/**
 * Fetch companies with the same NACE code (or sector fallback)
 *
 * Uses exact match first, then falls back to 2-digit sector if < 3 results.
 * Orders by quality (has financials) then name.
 */
export async function fetchSimilarCompanies(
  supabase: SupabaseClient<Database>,
  naceMain: string | null,
  excludeVat: string,
  lang: string,
  limit: number = 6
): Promise<RelatedCompany[]> {
  if (!naceMain) return [];

  // Try exact NACE match first
  const { data: exactMatches } = await supabase
    .from('companies')
    .select('vat_number, name, slug, address, nace_main, financial_summary')
    .eq('nace_main', naceMain)
    .eq('status', 'active')
    .neq('vat_number', excludeVat)
    .order('financial_summary', { ascending: false, nullsFirst: false })
    .order('name')
    .limit(limit);

  const results = (exactMatches as RawCompanyRow[] | null) ?? [];

  // Fallback to sector (first 2 digits) if too few results
  if (results.length < 3) {
    const sector = naceMain.substring(0, 2);
    const { data: sectorMatches } = await supabase
      .from('companies')
      .select('vat_number, name, slug, address, nace_main, financial_summary')
      .like('nace_main', `${sector}%`)
      .eq('status', 'active')
      .neq('vat_number', excludeVat)
      .order('financial_summary', { ascending: false, nullsFirst: false })
      .order('name')
      .limit(limit);

    return transformRows((sectorMatches as RawCompanyRow[] | null) ?? [], lang);
  }

  return transformRows(results, lang);
}

/**
 * Fetch companies in the same postal code
 *
 * Orders by quality (has financials) then name.
 */
export async function fetchNeighborCompanies(
  supabase: SupabaseClient<Database>,
  postalCode: string | null,
  excludeVat: string,
  lang: string,
  limit: number = 6
): Promise<RelatedCompany[]> {
  if (!postalCode) return [];

  const { data } = await supabase
    .from('companies')
    .select('vat_number, name, slug, address, nace_main, financial_summary')
    .eq('address->postal_code', postalCode)
    .eq('status', 'active')
    .neq('vat_number', excludeVat)
    .order('financial_summary', { ascending: false, nullsFirst: false })
    .order('name')
    .limit(limit);

  return transformRows((data as RawCompanyRow[] | null) ?? [], lang);
}
