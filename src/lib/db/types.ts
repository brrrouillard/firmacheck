/**
 * Database Types for Supabase
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

export interface Company {
  vat_number: string;  // Primary key

  // Display
  name: string;
  slug: string;
  names: CompanyNames | null;

  // Legal info
  legal_form: string | null;
  legal_form_code: string | null;
  status: CompanyStatus;
  juridical_situation: JuridicalSituation;
  start_date: string | null;

  // Location & contact
  address: CompanyAddress | null;
  contact: CompanyContact | null;

  // Activity
  nace_codes: string[] | null;
  nace_main: string | null;

  // Statistics
  establishment_count: number;

  // Financial (from NBB)
  financial_summary: FinancialSummary | null;

  // Metadata
  created_at: string;
  updated_at: string;
  last_enriched_at: string | null;
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
  financial_summary?: FinancialSummary;
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
