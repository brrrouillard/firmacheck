import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import { logger } from '../utils/logger.js';
import { normalizeVat, isValidVat } from '../utils/vat.js';
import { slugifyCompanyName } from '../utils/slugify.js';
import { batchUpsertFromKbo, type KboCompanyData } from '../db/upsert.js';
import type { CompanyAddress, CompanyStatus } from '../db/types.js';

/**
 * KBO Open Data CSV Structure
 *
 * enterprise.csv columns:
 * - EnterpriseNumber: VAT number (format: 0.XXX.XXX.XXX)
 * - Status: AC (active), ST (stopped)
 * - JuridicalSituation: Normal, Bankruptcy, etc.
 * - TypeOfEnterprise: 1 (natural person), 2 (legal entity)
 * - JuridicalForm: Legal form code
 * - StartDate: YYYY-MM-DD
 *
 * denomination.csv columns:
 * - EntityNumber: VAT number
 * - Language: 1 (FR), 2 (NL), 3 (DE), 4 (EN)
 * - TypeOfDenomination: 001 (official name), 002 (commercial name)
 * - Denomination: Company name
 *
 * address.csv columns:
 * - EntityNumber: VAT number
 * - TypeOfAddress: REGO (registered office), BRAN (branch)
 * - CountryNL, CountryFR: Country names
 * - Zipcode, MunicipalityNL, MunicipalityFR
 * - StreetNL, StreetFR
 * - HouseNumber, Box
 *
 * activity.csv columns:
 * - EntityNumber: VAT number
 * - ActivityGroup: Main, Secondary
 * - NaceVersion: 2003, 2008
 * - NaceCode: NACE code (e.g., 62.010)
 * - Classification: MAIN, SECO
 */

// Legal form code mapping (KBO codes to abbreviations)
const LEGAL_FORM_MAP: Record<string, string> = {
  '014': 'NV',      // Naamloze vennootschap
  '015': 'BV',      // Besloten vennootschap (formerly BVBA)
  '016': 'BVBA',    // Besloten vennootschap met beperkte aansprakelijkheid
  '017': 'CV',      // Coöperatieve vennootschap
  '018': 'CVBA',    // Coöperatieve vennootschap met beperkte aansprakelijkheid
  '019': 'VOF',     // Vennootschap onder firma
  '020': 'CommV',   // Commanditaire vennootschap
  '027': 'VZW',     // Vereniging zonder winstoogmerk
  '028': 'IVZW',    // Internationale vereniging zonder winstoogmerk
  '029': 'Stichting', // Stichting
  '610': 'SA',      // Société anonyme
  '612': 'SRL',     // Société à responsabilité limitée
  '614': 'SC',      // Société coopérative
  '616': 'SNC',     // Société en nom collectif
  '617': 'SCS',     // Société en commandite simple
  '630': 'ASBL',    // Association sans but lucratif
};

interface EnterpriseRow {
  EnterpriseNumber: string;
  Status: string;
  JuridicalSituation: string;
  TypeOfEnterprise: string;
  JuridicalForm: string;
  StartDate: string;
}

interface DenominationRow {
  EntityNumber: string;
  Language: string;
  TypeOfDenomination: string;
  Denomination: string;
}

interface AddressRow {
  EntityNumber: string;
  TypeOfAddress: string;
  CountryNL: string;
  CountryFR: string;
  Zipcode: string;
  MunicipalityNL: string;
  MunicipalityFR: string;
  StreetNL: string;
  StreetFR: string;
  HouseNumber: string;
  Box: string;
}

interface ActivityRow {
  EntityNumber: string;
  ActivityGroup: string;
  NaceVersion: string;
  NaceCode: string;
  Classification: string;
}

type KboDataMap = Map<string, Partial<KboCompanyData>>;

/**
 * Parse a KBO enterprise CSV file
 */
async function parseEnterpriseCSV(filePath: string, dataMap: KboDataMap): Promise<void> {
  logger.info({ file: filePath }, 'Parsing enterprise CSV');
  let count = 0;

  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const row of parser as AsyncIterable<EnterpriseRow>) {
    const vatNumber = normalizeVat(row.EnterpriseNumber);
    if (!vatNumber || !isValidVat(vatNumber)) continue;

    // Only include legal entities (type 2)
    if (row.TypeOfEnterprise !== '2') continue;

    const status: CompanyStatus = row.Status === 'AC' ? 'active' : 'stopped';
    const legalForm = LEGAL_FORM_MAP[row.JuridicalForm] ?? null;

    dataMap.set(vatNumber, {
      vatNumber,
      status,
      legalForm,
      naceCodes: [],
    });

    count++;
    if (count % 100000 === 0) {
      logger.info({ count }, 'Processed enterprises');
    }
  }

  logger.info({ total: count }, 'Finished parsing enterprise CSV');
}

/**
 * Parse a KBO denomination CSV file
 */
async function parseDenominationCSV(filePath: string, dataMap: KboDataMap): Promise<void> {
  logger.info({ file: filePath }, 'Parsing denomination CSV');
  let count = 0;

  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const row of parser as AsyncIterable<DenominationRow>) {
    const vatNumber = normalizeVat(row.EntityNumber);
    if (!vatNumber) continue;

    const existing = dataMap.get(vatNumber);
    if (!existing) continue;

    // Prefer official name (001) over commercial name (002)
    // Prefer French (1) or Dutch (2) over other languages
    const isOfficialName = row.TypeOfDenomination === '001';
    const isPrimaryLanguage = row.Language === '1' || row.Language === '2';

    if (!existing.name || (isOfficialName && isPrimaryLanguage)) {
      existing.name = row.Denomination;
      existing.slug = slugifyCompanyName(row.Denomination);
    }

    count++;
    if (count % 100000 === 0) {
      logger.info({ count }, 'Processed denominations');
    }
  }

  logger.info({ total: count }, 'Finished parsing denomination CSV');
}

/**
 * Parse a KBO address CSV file
 */
async function parseAddressCSV(filePath: string, dataMap: KboDataMap): Promise<void> {
  logger.info({ file: filePath }, 'Parsing address CSV');
  let count = 0;

  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const row of parser as AsyncIterable<AddressRow>) {
    const vatNumber = normalizeVat(row.EntityNumber);
    if (!vatNumber) continue;

    const existing = dataMap.get(vatNumber);
    if (!existing) continue;

    // Only use registered office address (REGO)
    if (row.TypeOfAddress !== 'REGO') continue;

    // Skip if already has address
    if (existing.address) continue;

    const address: CompanyAddress = {
      street: row.StreetFR || row.StreetNL || '',
      number: row.HouseNumber || '',
      box: row.Box || undefined,
      postal_code: row.Zipcode || '',
      city: row.MunicipalityFR || row.MunicipalityNL || '',
      country: 'BE',
    };

    // Only add if we have at least street and city
    if (address.street && address.city) {
      existing.address = address;
    }

    count++;
    if (count % 100000 === 0) {
      logger.info({ count }, 'Processed addresses');
    }
  }

  logger.info({ total: count }, 'Finished parsing address CSV');
}

/**
 * Parse a KBO activity CSV file
 */
async function parseActivityCSV(filePath: string, dataMap: KboDataMap): Promise<void> {
  logger.info({ file: filePath }, 'Parsing activity CSV');
  let count = 0;

  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const row of parser as AsyncIterable<ActivityRow>) {
    const vatNumber = normalizeVat(row.EntityNumber);
    if (!vatNumber) continue;

    const existing = dataMap.get(vatNumber);
    if (!existing) continue;

    // Use NACE 2008 codes
    if (row.NaceVersion !== '2008') continue;

    if (!existing.naceCodes) {
      existing.naceCodes = [];
    }

    // Avoid duplicates
    if (!existing.naceCodes.includes(row.NaceCode)) {
      existing.naceCodes.push(row.NaceCode);
    }

    count++;
    if (count % 100000 === 0) {
      logger.info({ count }, 'Processed activities');
    }
  }

  logger.info({ total: count }, 'Finished parsing activity CSV');
}

export interface ImportOptions {
  enterpriseFile: string;
  denominationFile: string;
  addressFile: string;
  activityFile: string;
  batchSize?: number;
  dryRun?: boolean;
}

/**
 * Import KBO Open Data CSV files into the database
 */
export async function importKboData(options: ImportOptions): Promise<{ imported: number; skipped: number }> {
  const { batchSize = 1000, dryRun = false } = options;

  logger.info({ options: { ...options, dryRun } }, 'Starting KBO CSV import');

  // Build in-memory map of all company data
  const dataMap: KboDataMap = new Map();

  // Parse all CSV files
  await parseEnterpriseCSV(options.enterpriseFile, dataMap);
  await parseDenominationCSV(options.denominationFile, dataMap);
  await parseAddressCSV(options.addressFile, dataMap);
  await parseActivityCSV(options.activityFile, dataMap);

  // Filter out incomplete entries
  const validCompanies: KboCompanyData[] = [];
  let skipped = 0;

  for (const [vatNumber, data] of dataMap) {
    if (!data.name || !data.slug || !data.status) {
      skipped++;
      continue;
    }

    validCompanies.push({
      vatNumber,
      name: data.name,
      slug: data.slug,
      legalForm: data.legalForm ?? null,
      status: data.status,
      address: data.address ?? null,
      naceCodes: data.naceCodes ?? [],
    });
  }

  logger.info({ valid: validCompanies.length, skipped }, 'Filtered companies');

  if (dryRun) {
    logger.info('Dry run - skipping database insert');
    return { imported: 0, skipped };
  }

  // Batch insert
  let imported = 0;
  for (let i = 0; i < validCompanies.length; i += batchSize) {
    const batch = validCompanies.slice(i, i + batchSize);
    const result = await batchUpsertFromKbo(batch);
    imported += result.success;

    logger.info({
      batch: Math.floor(i / batchSize) + 1,
      total: Math.ceil(validCompanies.length / batchSize),
      imported: result.success,
    }, 'Batch inserted');
  }

  logger.info({ imported, skipped }, 'KBO import completed');
  return { imported, skipped };
}
