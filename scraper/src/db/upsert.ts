import { getSupabase } from './client.js';
import type {
  CompanyInsert,
  CompanyUpdate,
  FinancialSummary,
  CompanyFunction,
  EntityLink,
  Qualification,
  NaceHistory,
  FiscalPeriod,
} from './types.js';
import { logger } from '../utils/logger.js';

export interface NbbFinancialData {
  vatNumber: string;
  year: number;
  turnover?: number;
  profitLoss?: number;
  equity?: number;
  employees?: number;
}

/**
 * Batch upsert companies from KBO data
 */
export async function batchUpsertFromKbo(companies: CompanyInsert[]): Promise<{ success: number; failed: number }> {
  const supabase = getSupabase();

  const { error, count } = await supabase
    .from('companies')
    .upsert(companies as any, {
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
 * Batch update NACE codes for multiple companies
 * Used for efficient streaming of large activity.csv files
 */
export async function batchUpdateNaceCodes(
  naceCodeMap: Map<string, { codes: string[]; main?: string }>
): Promise<{ updated: number; mainCodes: number }> {
  const supabase = getSupabase();
  let updated = 0;
  let mainCodes = 0;

  const entries = Array.from(naceCodeMap.entries());

  // Batch the updates to avoid too many concurrent requests
  const batchSize = 100;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    const promises = batch.map(async ([vatNumber, data]) => {
      const updateData: { nace_codes: string[]; nace_main?: string } = {
        nace_codes: data.codes,
      };

      if (data.main) {
        updateData.nace_main = data.main;
      }

      const { error } = await (supabase
        .from('companies') as any)
        .update(updateData)
        .eq('vat_number', vatNumber);

      if (!error) {
        return { updated: 1, main: data.main ? 1 : 0 };
      }
      return { updated: 0, main: 0 };
    });

    const results = await Promise.all(promises);
    updated += results.reduce((a, b) => a + b.updated, 0);
    mainCodes += results.reduce((a, b) => a + b.main, 0);
  }

  return { updated, mainCodes };
}

/**
 * Batch update contacts for multiple companies
 */
export async function batchUpdateContacts(
  contactMap: Map<string, { phone?: string; email?: string; website?: string; fax?: string }>
): Promise<number> {
  const supabase = getSupabase();
  let updated = 0;

  const entries = Array.from(contactMap.entries());
  const batchSize = 100;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    const promises = batch.map(async ([vatNumber, contact]) => {
      const { error } = await (supabase
        .from('companies') as any)
        .update({ contact })
        .eq('vat_number', vatNumber);

      return error ? 0 : 1;
    });

    const results = await Promise.all(promises);
    updated += results.reduce((a: number, b: number) => a + b, 0);
  }

  return updated;
}

/**
 * Batch update establishment counts for multiple companies
 */
export async function batchUpdateEstablishmentCounts(
  countMap: Map<string, number>
): Promise<number> {
  const supabase = getSupabase();
  let updated = 0;

  const entries = Array.from(countMap.entries());
  const batchSize = 100;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    const promises = batch.map(async ([vatNumber, count]) => {
      const { error } = await (supabase
        .from('companies') as any)
        .update({ establishment_count: count })
        .eq('vat_number', vatNumber);

      return error ? 0 : 1;
    });

    const results = await Promise.all(promises);
    updated += results.reduce((a: number, b: number) => a + b, 0);
  }

  return updated;
}

/**
 * Get companies that need financial enrichment (NBB)
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

export interface KboEnrichmentData {
  vatNumber: string;
  functions: CompanyFunction[];
  capital: number | null;
  fiscalYearEnd: string | null;
  annualMeetingMonth: string | null;
  juridicalSituationDate: string | null;
  entityLinks: EntityLink[];
  qualifications: Qualification[];
  naceHistory: NaceHistory;
  exceptionalFiscalPeriods: FiscalPeriod[];
}

/**
 * Enrich company with KBO data (functions, capital, qualifications, etc.)
 */
export async function enrichWithKbo(kboData: KboEnrichmentData): Promise<void> {
  const supabase = getSupabase();

  const update: CompanyUpdate = {
    functions: kboData.functions,
    last_kbo_enriched_at: new Date().toISOString(),
  };

  // Add optional fields only if they have values
  if (kboData.capital !== null) {
    update.capital = kboData.capital;
  }
  if (kboData.fiscalYearEnd) {
    update.fiscal_year_end = kboData.fiscalYearEnd;
  }
  if (kboData.annualMeetingMonth) {
    update.annual_meeting_month = kboData.annualMeetingMonth;
  }
  if (kboData.juridicalSituationDate) {
    update.juridical_situation_date = kboData.juridicalSituationDate;
  }
  if (kboData.entityLinks.length > 0) {
    update.entity_links = kboData.entityLinks;
  }
  if (kboData.qualifications.length > 0) {
    update.qualifications = kboData.qualifications;
  }
  if (Object.keys(kboData.naceHistory).length > 0) {
    update.nace_history = kboData.naceHistory;
  }
  if (kboData.exceptionalFiscalPeriods.length > 0) {
    update.exceptional_fiscal_periods = kboData.exceptionalFiscalPeriods;
  }

  const { error } = await (supabase
    .from('companies') as any)
    .update(update)
    .eq('vat_number', kboData.vatNumber);

  if (error) {
    logger.error({ vatNumber: kboData.vatNumber, error: error.message }, 'Failed to enrich with KBO data');
    throw error;
  }

  logger.debug({
    vatNumber: kboData.vatNumber,
    functions: kboData.functions.length,
    capital: kboData.capital,
    qualifications: kboData.qualifications.length,
  }, 'Enriched company with KBO data');
}

/**
 * Get companies that need KBO enrichment (functions/directors)
 */
export async function getCompaniesNeedingKboEnrichment(options: {
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
    .or(`last_kbo_enriched_at.is.null,last_kbo_enriched_at.lt.${cutoffDate.toISOString()}`)
    .limit(limit);

  if (error) {
    logger.error({ error: error.message }, 'Failed to fetch companies needing KBO enrichment');
    throw error;
  }

  return data ?? [];
}
