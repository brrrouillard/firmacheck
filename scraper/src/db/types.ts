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

export interface CompanyFunction {
  first_name: string;
  last_name: string;
  role: string;
  role_code: string;
  start_date: string | null;
}

export interface EntityLink {
  type: 'predecessor' | 'successor' | 'related' | 'unknown';
  vat_number: string | null;
  name: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface Qualification {
  type: 'rsz_employer' | 'vat_subject' | 'registration_obligated' | 'other';
  label: string;
  start_date: string | null;
  end_date: string | null;
}

export interface NaceEntry {
  code: string;
  description: string | null;
}

export interface NaceHistory {
  [version: string]: NaceEntry[];
}

export interface FiscalPeriod {
  start_date: string;
  end_date: string;
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
  juridical_situation_date?: string;
  start_date?: string;
  address?: CompanyAddress;
  contact?: CompanyContact;
  nace_codes?: string[];
  nace_main?: string;
  establishment_count?: number;
  financial_summary?: FinancialSummary;
  functions?: CompanyFunction[];
  capital?: number;
  fiscal_year_end?: string;
  annual_meeting_month?: string;
  entity_links?: EntityLink[];
  qualifications?: Qualification[];
  nace_history?: NaceHistory;
  exceptional_fiscal_periods?: FiscalPeriod[];
  last_enriched_at?: string;
  last_kbo_enriched_at?: string;
}

export interface Company {
  vat_number: string;
  name: string;
  slug: string;
  names: CompanyNames | null;
  legal_form: string | null;
  legal_form_code: string | null;
  status: CompanyStatus;
  juridical_situation: JuridicalSituation;
  juridical_situation_date: string | null;
  start_date: string | null;
  address: CompanyAddress | null;
  contact: CompanyContact | null;
  nace_codes: string[] | null;
  nace_main: string | null;
  establishment_count: number;
  financial_summary: FinancialSummary | null;
  functions: CompanyFunction[] | null;
  capital: number | null;
  fiscal_year_end: string | null;
  annual_meeting_month: string | null;
  entity_links: EntityLink[] | null;
  qualifications: Qualification[] | null;
  nace_history: NaceHistory | null;
  exceptional_fiscal_periods: FiscalPeriod[] | null;
  created_at: string;
  updated_at: string;
  last_enriched_at: string | null;
  last_kbo_enriched_at: string | null;
}

/**
 * Supabase Database type definition
 */
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      company_status: CompanyStatus;
      juridical_situation: JuridicalSituation;
    };
  };
}
