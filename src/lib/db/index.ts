/**
 * Database Module
 *
 * Exports Supabase client and typed database operations.
 */

// Client
export { getSupabase } from './client';

// Types
export type {
  Database,
  Company,
  CompanyInsert,
  CompanyUpdate,
  CompanyAddress,
  CompanyStatus,
  FinancialSummary,
} from './types';
