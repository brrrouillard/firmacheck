/**
 * Library Utilities Index
 *
 * Re-exports all utility functions for convenient imports.
 */

// UI utilities
export { cn } from './utils';

// Belgian VAT utilities
export {
  normalizeVat,
  formatVat,
  validateVat,
  isValidVat,
  extractVat,
  type VatValidationResult,
} from './vat';

// Slugify utilities
export { slugify, slugifyCompanyName, type SlugifyOptions } from './slugify';

// Database
export {
  getSupabase,
  createSupabaseClient,
  type Database,
  type Company,
  type CompanyInsert,
  type CompanyUpdate,
  type CompanyAddress,
  type CompanyStatus,
  type FinancialSummary,
} from './db';

// Queries
export {
  fetchSimilarCompanies,
  fetchNeighborCompanies,
  type RelatedCompany,
} from './queries';
