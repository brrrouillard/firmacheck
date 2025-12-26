/**
 * Database Types for Supabase
 *
 * These types match the schema in supabase/migrations/001_create_companies.sql
 * For auto-generation, run: npx supabase gen types typescript --local
 */

export type CompanyStatus = 'active' | 'stopped';

export interface CompanyAddress {
  street: string;
  number: string;
  box?: string;
  postal_code: string;
  city: string;
  country: string;
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
  name: string;
  slug: string;
  legal_form: string | null;
  status: CompanyStatus;
  address: CompanyAddress | null;
  nace_codes: string[] | null;
  financial_summary: FinancialSummary | null;
  created_at: string;
  updated_at: string;
  last_enriched_at: string | null;
}

export interface CompanyInsert {
  vat_number: string;
  name: string;
  slug: string;
  legal_form?: string;
  status?: CompanyStatus;
  address?: CompanyAddress;
  nace_codes?: string[];
  financial_summary?: FinancialSummary;
}

export interface CompanyUpdate {
  name?: string;
  slug?: string;
  legal_form?: string;
  status?: CompanyStatus;
  address?: CompanyAddress;
  nace_codes?: string[];
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
    };
  };
}
