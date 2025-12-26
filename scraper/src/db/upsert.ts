import { getSupabase } from './client.js';
import type { CompanyInsert, CompanyUpdate, FinancialSummary, CompanyAddress, CompanyStatus } from './types.js';
import { logger } from '../utils/logger.js';

export interface KboCompanyData {
  vatNumber: string;
  name: string;
  slug: string;
  legalForm: string | null;
  status: CompanyStatus;
  address: CompanyAddress | null;
  naceCodes: string[];
}

export interface NbbFinancialData {
  vatNumber: string;
  year: number;
  turnover?: number;
  profitLoss?: number;
  equity?: number;
  employees?: number;
}

/**
 * Upsert company from KBO data
 */
export async function upsertFromKbo(kboData: KboCompanyData): Promise<void> {
  const supabase = getSupabase();

  const companyInsert: CompanyInsert = {
    vat_number: kboData.vatNumber,
    name: kboData.name,
    slug: kboData.slug,
    legal_form: kboData.legalForm ?? undefined,
    status: kboData.status,
    address: kboData.address ?? undefined,
    nace_codes: kboData.naceCodes.length > 0 ? kboData.naceCodes : undefined,
  };

  const { error } = await supabase
    .from('companies')
    .upsert(companyInsert as any, {
      onConflict: 'vat_number',
      ignoreDuplicates: false,
    });

  if (error) {
    logger.error({ vatNumber: kboData.vatNumber, error: error.message }, 'Failed to upsert KBO data');
    throw error;
  }

  logger.debug({ vatNumber: kboData.vatNumber }, 'Upserted KBO company data');
}

/**
 * Batch upsert companies from KBO data
 */
export async function batchUpsertFromKbo(companies: KboCompanyData[]): Promise<{ success: number; failed: number }> {
  const supabase = getSupabase();

  const inserts: CompanyInsert[] = companies.map((kboData) => ({
    vat_number: kboData.vatNumber,
    name: kboData.name,
    slug: kboData.slug,
    legal_form: kboData.legalForm ?? undefined,
    status: kboData.status,
    address: kboData.address ?? undefined,
    nace_codes: kboData.naceCodes.length > 0 ? kboData.naceCodes : undefined,
  }));

  const { error, count } = await supabase
    .from('companies')
    .upsert(inserts as any, {
      onConflict: 'vat_number',
      ignoreDuplicates: false,
      count: 'exact',
    });

  if (error) {
    logger.error({ error: error.message }, 'Batch upsert failed');
    return { success: 0, failed: companies.length };
  }

  return { success: count ?? companies.length, failed: 0 };
}

/**
 * Enrich company with NBB financial data
 */
export async function enrichWithNbb(nbbData: NbbFinancialData): Promise<void> {
  const supabase = getSupabase();

  const financialSummary: FinancialSummary = {
    year: nbbData.year,
    turnover: nbbData.turnover,
    profit_loss: nbbData.profitLoss,
    equity: nbbData.equity,
    employees: nbbData.employees,
  };

  // Calculate net margin if we have the data
  if (nbbData.turnover && nbbData.profitLoss) {
    financialSummary.net_margin = (nbbData.profitLoss / nbbData.turnover) * 100;
  }

  const update: CompanyUpdate = {
    financial_summary: financialSummary,
    last_enriched_at: new Date().toISOString(),
  };

  const { error } = await (supabase
    .from('companies') as any)
    .update(update)
    .eq('vat_number', nbbData.vatNumber);

  if (error) {
    logger.error({ vatNumber: nbbData.vatNumber, error: error.message }, 'Failed to enrich with NBB data');
    throw error;
  }

  logger.debug({ vatNumber: nbbData.vatNumber, year: nbbData.year }, 'Enriched company with NBB financial data');
}

/**
 * Get companies that need financial enrichment
 */
export async function getCompaniesNeedingEnrichment(options: {
  limit?: number;
  olderThanDays?: number;
}): Promise<Array<{ vat_number: string }>> {
  const supabase = getSupabase();
  const { limit = 100, olderThanDays = 30 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const { data, error } = await supabase
    .from('companies')
    .select('vat_number')
    .or(`last_enriched_at.is.null,last_enriched_at.lt.${cutoffDate.toISOString()}`)
    .limit(limit);

  if (error) {
    logger.error({ error: error.message }, 'Failed to fetch companies needing enrichment');
    throw error;
  }

  return data ?? [];
}
