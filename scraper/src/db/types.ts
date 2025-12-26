/**
 * Database Types for Supabase (Scraper)
 *
 * These types match the schema in supabase/migrations/001_create_companies.sql
 */

export type CompanyStatus = 'active' | 'stopped';

export type JuridicalSituation =
  | 'normal'
  | 'legal_creation'
  | 'extension'
  | 'number_replacement'
  | 'stopped_number_replacement'
  | 'dissolution'
  | 'foreign_ceased'
  | 'opening_bankruptcy'
  | 'closing_bankruptcy'
  | 'voluntary_dissolution'
  | 'judicial_dissolution'
  | 'judicial_dissolution_closed'
  | 'annulment'
  | 'merger_acquisition'
  | 'division'
  | 'transfer_registered_office'
  | 'bankruptcy'
  | 'bankruptcy_closed'
  | 'liquidation'
  | 'other';

// Mapping from KBO juridical situation codes to our enum values
export const JURIDICAL_SITUATION_MAP: Record<string, JuridicalSituation> = {
  '000': 'normal',
  '001': 'legal_creation',
  '002': 'extension',
  '003': 'number_replacement',
  '006': 'stopped_number_replacement',
  '010': 'dissolution',
  '011': 'foreign_ceased',
  '012': 'opening_bankruptcy',
  '013': 'closing_bankruptcy',
  '020': 'voluntary_dissolution',
  '030': 'judicial_dissolution',
  '031': 'judicial_dissolution_closed',
  '040': 'annulment',
  '041': 'merger_acquisition',
  '043': 'division',
  '048': 'transfer_registered_office',
  '050': 'bankruptcy',
  '051': 'bankruptcy_closed',
  '091': 'liquidation',
};

export interface CompanyNames {
  fr?: string;
  nl?: string;
  de?: string;
  en?: string;
  abbreviation?: string;
  commercial?: string;
}

export interface CompanyAddress {
  street_fr?: string;
  street_nl?: string;
  number?: string;
  box?: string;
  postal_code?: string;
  city_fr?: string;
  city_nl?: string;
  country?: string;
}

export interface CompanyContact {
  phone?: string;
  email?: string;
  website?: string;
  fax?: string;
}

export interface FinancialSummary {
  year: number;
  turnover?: number;
  profit_loss?: number;
  equity?: number;
  employees?: number;
  gross_margin?: number;
  net_margin?: number;
}

export interface CompanyInsert {
  vat_number: string;
  name: string;
  slug: string;
  names?: CompanyNames;
  legal_form?: string;
  legal_form_code?: string;
  status?: CompanyStatus;
  juridical_situation?: JuridicalSituation;
  start_date?: string;
  address?: CompanyAddress;
  contact?: CompanyContact;
  nace_codes?: string[];
  nace_main?: string;
  establishment_count?: number;
}

export interface CompanyUpdate {
  name?: string;
  slug?: string;
  names?: CompanyNames;
  legal_form?: string;
  legal_form_code?: string;
  status?: CompanyStatus;
  juridical_situation?: JuridicalSituation;
  start_date?: string;
  address?: CompanyAddress;
  contact?: CompanyContact;
  nace_codes?: string[];
  nace_main?: string;
  establishment_count?: number;
  financial_summary?: FinancialSummary;
  last_enriched_at?: string;
}
