import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import { logger } from '../utils/logger.js';
import { normalizeVat, isValidVat } from '../utils/vat.js';
import { slugifyCompanyName } from '../utils/slugify.js';
import { batchUpsertFromKbo, batchUpdateNaceCodes, batchUpdateContacts, batchUpdateEstablishmentCounts } from '../db/upsert.js';
import type { CompanyStatus, JuridicalSituation, CompanyNames, CompanyAddress, CompanyContact, CompanyInsert } from '../db/types.js';
import { JURIDICAL_SITUATION_MAP } from '../db/types.js';

/**
 * KBO Open Data CSV Importer
 *
 * Extracts comprehensive company data from Belgian KBO Open Data files:
 * - enterprise.csv: Core company info (VAT, status, legal form, start date, juridical situation)
 * - denomination.csv: Multilingual names (official, abbreviation, commercial)
 * - address.csv: Bilingual registered office address
 * - contact.csv: Phone, email, website, fax
 * - establishment.csv: Count of establishments/branches
 * - activity.csv: NACE codes (main + secondary)
 */

// Legal form code mapping (KBO codes to human-readable abbreviations)
const LEGAL_FORM_MAP: Record<string, string> = {
  '001': 'SCE', '002': 'OFP', '003': 'Unité TVA', '006': 'SCRI', '007': 'SCRIS',
  '008': 'SCRL', '009': 'SCRLS', '010': 'SPRLU', '011': 'SNC', '012': 'SCS',
  '013': 'SCA', '014': 'SA', '015': 'SPRL', '016': 'SC', '017': 'SE',
  '018': 'GIE', '019': 'GEIE', '020': 'Fondation privée', '021': 'Fondation utilité publique',
  '024': 'Mutualité', '025': 'Union nationale mutualités', '026': 'Soc. mutualiste',
  '027': 'ASBL', '028': 'AISBL', '029': 'Fondation', '030': 'Établ. utilité publique',
  '101': 'État fédéral', '102': 'Communauté', '103': 'Région', '104': 'Commission comm.',
  '105': 'Province', '106': 'Commune', '107': 'CPAS', '108': 'Intercommunale',
  '109': 'Zone police', '110': 'Zone secours', '111': 'Polder/Wateringue',
  '112': 'Fabrique église', '113': 'Établ. temporel', '114': 'Autorité étrangère',
  '115': 'Organisation internationale', '116': 'Organisme public', '117': 'Entreprise publique',
  '401': 'Pers. physique commerçant', '402': 'Pers. physique profession libérale',
  '403': 'Pers. physique artisan', '404': 'Pers. physique agriculteur',
  '405': 'Pers. physique administrateur', '406': 'Pers. physique salarié étranger',
  '407': 'Pers. physique autre', '408': 'Pers. physique indépendant',
  '409': 'Pers. physique professionnel indépendant',
  '410': 'Société momentanée', '411': 'Société interne', '412': 'Société de fait',
  '413': 'Association de fait', '414': 'Syndicat', '415': 'Maison collective',
  '416': 'Intercommunale', '417': 'Régie communale', '418': 'Copropriété',
  '419': 'Entreprise sociale', '420': 'Entreprise étrangère', '421': 'Association',
  '430': 'Org. interprofessionnel', '431': 'Consort. validation compétences',
  '432': 'Entreprise portefeuille',
  '610': 'SA', '611': 'SCA', '612': 'SRL', '613': 'SPRL', '614': 'SC',
  '615': 'SCRL', '616': 'SNC', '617': 'SCS', '618': 'GIE',
  '620': 'Fondation privée', '621': 'Fondation utilité publique',
  '627': 'AISBL', '628': 'Fondation', '629': 'ASBL', '630': 'ASBL',
  '631': 'Syndicat', '632': 'Fonds pension', '633': 'Parti politique',
  '639': 'SE', '640': 'SCE',
};

// CSV Row interfaces
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
  Zipcode: string;
  MunicipalityNL: string;
  MunicipalityFR: string;
  StreetNL: string;
  StreetFR: string;
  HouseNumber: string;
  Box: string;
}

interface ContactRow {
  EntityNumber: string;
  EntityContact: string;
  ContactType: string;
  Value: string;
}

interface EstablishmentRow {
  EstablishmentNumber: string;
  StartDate: string;
  EnterpriseNumber: string;
}

interface ActivityRow {
  EntityNumber: string;
  ActivityGroup: string;
  NaceVersion: string;
  NaceCode: string;
  Classification: string;
}

// Build data structure
interface CompanyBuildData {
  vatNumber: string;
  status: CompanyStatus;
  juridicalSituation: JuridicalSituation;
  legalForm: string | null;
  legalFormCode: string | null;
  startDate: string | null;
  names: CompanyNames;
  address?: CompanyAddress;
  contact?: CompanyContact;
  establishmentCount: number;
  naceMain?: string;
}

/**
 * Parse date from KBO format (DD-MM-YYYY) to ISO format (YYYY-MM-DD)
 */
function parseKboDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Get best display name from multilingual names (preference: FR > NL > DE > EN > commercial > abbreviation)
 */
function getBestDisplayName(names: CompanyNames): string | null {
  return names.fr || names.nl || names.de || names.en || names.commercial || names.abbreviation || null;
}

/**
 * Pass 1: Parse enterprise.csv - Core company data
 */
async function parseEnterprises(
  filePath: string,
  activeOnly: boolean
): Promise<Map<string, CompanyBuildData>> {
  logger.info({ file: filePath, activeOnly }, 'Pass 1: Parsing enterprises');
  const dataMap = new Map<string, CompanyBuildData>();
  let total = 0, filtered = 0;

  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true })
  );

  for await (const row of parser as AsyncIterable<EnterpriseRow>) {
    total++;

    const vatNumber = normalizeVat(row.EnterpriseNumber);
    if (!vatNumber || !isValidVat(vatNumber)) continue;

    // Only legal entities (type 2)
    if (row.TypeOfEnterprise !== '2') continue;

    // Filter to active only if requested
    if (activeOnly && row.Status !== 'AC') continue;

    const status: CompanyStatus = row.Status === 'AC' ? 'active' : 'stopped';
    const juridicalSituation = JURIDICAL_SITUATION_MAP[row.JuridicalSituation] ?? 'other';
    const legalForm = LEGAL_FORM_MAP[row.JuridicalForm] ?? null;

    dataMap.set(vatNumber, {
      vatNumber,
      status,
      juridicalSituation,
      legalForm,
      legalFormCode: row.JuridicalForm || null,
      startDate: parseKboDate(row.StartDate),
      names: {},
      establishmentCount: 0,
    });

    filtered++;
    if (filtered % 100000 === 0) {
      logger.info({ filtered, total }, 'Enterprises progress');
    }
  }

  logger.info({ filtered, total }, 'Finished parsing enterprises');
  return dataMap;
}

/**
 * Pass 2: Parse denomination.csv - Multilingual names
 */
async function enrichWithDenominations(
  filePath: string,
  dataMap: Map<string, CompanyBuildData>
): Promise<void> {
  logger.info({ file: filePath }, 'Pass 2: Parsing denominations');
  let count = 0;

  // Language code mapping: 1=FR, 2=NL, 3=DE, 4=EN
  const LANG_MAP: Record<string, keyof CompanyNames> = {
    '1': 'fr', '2': 'nl', '3': 'de', '4': 'en',
  };

  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true })
  );

  for await (const row of parser as AsyncIterable<DenominationRow>) {
    count++;

    const vatNumber = normalizeVat(row.EntityNumber);
    if (!vatNumber) continue;

    const existing = dataMap.get(vatNumber);
    if (!existing) continue;

    const denomination = row.Denomination?.trim();
    if (!denomination) continue;

    // Type 001 = Official name, 002 = Abbreviation, 003 = Commercial name
    if (row.TypeOfDenomination === '001') {
      // Official name by language
      const langKey = LANG_MAP[row.Language];
      if (langKey && !existing.names[langKey]) {
        existing.names[langKey] = denomination;
      }
    } else if (row.TypeOfDenomination === '002') {
      // Abbreviation
      if (!existing.names.abbreviation) {
        existing.names.abbreviation = denomination;
      }
    } else if (row.TypeOfDenomination === '003') {
      // Commercial name
      if (!existing.names.commercial) {
        existing.names.commercial = denomination;
      }
    }

    if (count % 500000 === 0) {
      logger.info({ count }, 'Denominations progress');
    }
  }

  logger.info({ count }, 'Finished parsing denominations');
}

/**
 * Pass 3: Parse address.csv - Bilingual addresses
 */
async function enrichWithAddresses(
  filePath: string,
  dataMap: Map<string, CompanyBuildData>
): Promise<void> {
  logger.info({ file: filePath }, 'Pass 3: Parsing addresses');
  let count = 0, matched = 0;

  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true })
  );

  for await (const row of parser as AsyncIterable<AddressRow>) {
    count++;

    const vatNumber = normalizeVat(row.EntityNumber);
    if (!vatNumber) continue;

    const existing = dataMap.get(vatNumber);
    if (!existing) continue;

    // Only registered office (REGO), skip branches
    if (row.TypeOfAddress !== 'REGO') continue;

    // Skip if already has address
    if (existing.address) continue;

    const address: CompanyAddress = {
      street_fr: row.StreetFR?.trim() || undefined,
      street_nl: row.StreetNL?.trim() || undefined,
      number: row.HouseNumber?.trim() || undefined,
      box: row.Box?.trim() || undefined,
      postal_code: row.Zipcode?.trim() || undefined,
      city_fr: row.MunicipalityFR?.trim() || undefined,
      city_nl: row.MunicipalityNL?.trim() || undefined,
      country: 'BE',
    };

    // Only add if we have at least street and city
    if ((address.street_fr || address.street_nl) && (address.city_fr || address.city_nl)) {
      existing.address = address;
      matched++;
    }

    if (count % 500000 === 0) {
      logger.info({ count, matched }, 'Addresses progress');
    }
  }

  logger.info({ count, matched }, 'Finished parsing addresses');
}

/**
 * Pass 4: Parse contact.csv - Contact information
 */
async function parseContacts(
  filePath: string,
  vatNumbers: Set<string>
): Promise<Map<string, CompanyContact>> {
  logger.info({ file: filePath }, 'Pass 4: Parsing contacts');
  const contactMap = new Map<string, CompanyContact>();
  let count = 0;

  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true })
  );

  for await (const row of parser as AsyncIterable<ContactRow>) {
    count++;

    // Only enterprise-level contacts (ENT), not establishment-level
    if (row.EntityContact !== 'ENT') continue;

    const vatNumber = normalizeVat(row.EntityNumber);
    if (!vatNumber || !vatNumbers.has(vatNumber)) continue;

    const value = row.Value?.trim();
    if (!value) continue;

    let contact = contactMap.get(vatNumber);
    if (!contact) {
      contact = {};
      contactMap.set(vatNumber, contact);
    }

    switch (row.ContactType) {
      case 'TEL':
        if (!contact.phone) contact.phone = value;
        break;
      case 'EMAIL':
        if (!contact.email) contact.email = value.toLowerCase();
        break;
      case 'WEB':
        if (!contact.website) {
          // Ensure website has protocol
          contact.website = value.startsWith('http') ? value : `https://${value}`;
        }
        break;
      case 'FAX':
        if (!contact.fax) contact.fax = value;
        break;
    }

    if (count % 100000 === 0) {
      logger.info({ count, contacts: contactMap.size }, 'Contacts progress');
    }
  }

  logger.info({ count, contacts: contactMap.size }, 'Finished parsing contacts');
  return contactMap;
}

/**
 * Pass 5: Parse establishment.csv - Count establishments per enterprise
 */
async function parseEstablishmentCounts(
  filePath: string,
  vatNumbers: Set<string>
): Promise<Map<string, number>> {
  logger.info({ file: filePath }, 'Pass 5: Parsing establishments');
  const countMap = new Map<string, number>();
  let count = 0;

  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true })
  );

  for await (const row of parser as AsyncIterable<EstablishmentRow>) {
    count++;

    const vatNumber = normalizeVat(row.EnterpriseNumber);
    if (!vatNumber || !vatNumbers.has(vatNumber)) continue;

    countMap.set(vatNumber, (countMap.get(vatNumber) ?? 0) + 1);

    if (count % 100000 === 0) {
      logger.info({ count }, 'Establishments progress');
    }
  }

  logger.info({ count, enterprises: countMap.size }, 'Finished parsing establishments');
  return countMap;
}

/**
 * Pass 6: Batch upsert companies to database
 */
async function batchInsertCompanies(
  dataMap: Map<string, CompanyBuildData>,
  contactMap: Map<string, CompanyContact>,
  establishmentCounts: Map<string, number>,
  batchSize: number,
  dryRun: boolean
): Promise<{ imported: number; skipped: number }> {
  logger.info({ total: dataMap.size, batchSize, dryRun }, 'Pass 6: Upserting companies');

  const validCompanies: CompanyInsert[] = [];
  let skipped = 0;

  for (const [vatNumber, data] of dataMap) {
    const displayName = getBestDisplayName(data.names);
    if (!displayName) {
      skipped++;
      continue;
    }

    // Merge contact data
    const contact = contactMap.get(vatNumber);

    // Get establishment count
    const establishmentCount = establishmentCounts.get(vatNumber) ?? 0;

    validCompanies.push({
      vat_number: vatNumber,
      name: displayName,
      slug: slugifyCompanyName(displayName),
      names: Object.keys(data.names).length > 0 ? data.names : undefined,
      legal_form: data.legalForm ?? undefined,
      legal_form_code: data.legalFormCode ?? undefined,
      status: data.status,
      juridical_situation: data.juridicalSituation,
      start_date: data.startDate ?? undefined,
      address: data.address,
      contact: contact && Object.keys(contact).length > 0 ? contact : undefined,
      nace_codes: [], // Will be filled in Pass 7
      establishment_count: establishmentCount,
    });
  }

  logger.info({ valid: validCompanies.length, skipped }, 'Filtered companies');

  if (dryRun) {
    logger.info('Dry run - skipping database insert');
    return { imported: 0, skipped };
  }

  let imported = 0;
  const totalBatches = Math.ceil(validCompanies.length / batchSize);

  for (let i = 0; i < validCompanies.length; i += batchSize) {
    const batch = validCompanies.slice(i, i + batchSize);
    const result = await batchUpsertFromKbo(batch);
    imported += result.success;

    const batchNum = Math.floor(i / batchSize) + 1;
    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      const pct = ((batchNum / totalBatches) * 100).toFixed(1);
      logger.info({ batch: batchNum, total: totalBatches, pct: `${pct}%`, imported }, 'Upsert progress');
    }
  }

  logger.info({ imported, skipped }, 'Finished upserting companies');
  return { imported, skipped };
}

/**
 * Pass 7: Stream activity.csv and update NACE codes
 */
async function streamActivityCodes(
  filePath: string,
  batchSize: number,
  dryRun: boolean
): Promise<{ updated: number; mainCodes: number }> {
  logger.info({ file: filePath, batchSize }, 'Pass 7: Streaming activity codes');

  if (dryRun) {
    logger.info('Dry run - skipping activity import');
    return { updated: 0, mainCodes: 0 };
  }

  let count = 0;
  let updated = 0;
  let mainCodes = 0;
  let currentBatch = new Map<string, { codes: string[]; main?: string }>();

  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true })
  );

  for await (const row of parser as AsyncIterable<ActivityRow>) {
    count++;

    // Only NACE 2008 or 2025 codes
    if (row.NaceVersion !== '2008' && row.NaceVersion !== '2025') continue;

    const vatNumber = normalizeVat(row.EntityNumber);
    if (!vatNumber) continue;

    // Get or create entry
    let entry = currentBatch.get(vatNumber);
    if (!entry) {
      entry = { codes: [] };
      currentBatch.set(vatNumber, entry);
    }

    // Add code if not duplicate
    if (!entry.codes.includes(row.NaceCode)) {
      entry.codes.push(row.NaceCode);
    }

    // Track main activity
    if (row.Classification === 'MAIN' && !entry.main) {
      entry.main = row.NaceCode;
    }

    // Flush batch when it reaches size limit
    if (currentBatch.size >= batchSize) {
      const result = await batchUpdateNaceCodes(currentBatch);
      updated += result.updated;
      mainCodes += result.mainCodes;
      currentBatch.clear();

      if (count % 1000000 === 0) {
        logger.info({ rows: count, updated, mainCodes }, 'Activity progress');
      }
    }
  }

  // Flush remaining batch
  if (currentBatch.size > 0) {
    const result = await batchUpdateNaceCodes(currentBatch);
    updated += result.updated;
    mainCodes += result.mainCodes;
  }

  logger.info({ rows: count, updated, mainCodes }, 'Finished streaming activity codes');
  return { updated, mainCodes };
}

export interface ImportOptions {
  enterpriseFile: string;
  denominationFile: string;
  addressFile: string;
  activityFile: string;
  contactFile?: string;
  establishmentFile?: string;
  batchSize?: number;
  dryRun?: boolean;
  activeOnly?: boolean;
}

/**
 * Import KBO Open Data CSV files into the database
 */
export async function importKboData(options: ImportOptions): Promise<{
  imported: number;
  skipped: number;
  naceCodes: number;
  contacts: number;
}> {
  const { batchSize = 1000, dryRun = false, activeOnly = true } = options;

  logger.info({ ...options, batchSize, dryRun, activeOnly }, 'Starting KBO CSV import');
  const startTime = Date.now();

  // Pass 1: Parse enterprise data
  const dataMap = await parseEnterprises(options.enterpriseFile, activeOnly);
  const vatNumbers = new Set(dataMap.keys());

  // Pass 2: Enrich with denominations
  await enrichWithDenominations(options.denominationFile, dataMap);

  // Pass 3: Enrich with addresses
  await enrichWithAddresses(options.addressFile, dataMap);

  // Pass 4: Parse contacts (optional)
  let contactMap = new Map<string, CompanyContact>();
  if (options.contactFile) {
    contactMap = await parseContacts(options.contactFile, vatNumbers);
  }

  // Pass 5: Parse establishment counts (optional)
  let establishmentCounts = new Map<string, number>();
  if (options.establishmentFile) {
    establishmentCounts = await parseEstablishmentCounts(options.establishmentFile, vatNumbers);
  }

  // Pass 6: Batch upsert to database
  const { imported, skipped } = await batchInsertCompanies(
    dataMap, contactMap, establishmentCounts, batchSize, dryRun
  );

  // Clear memory before processing large activity file
  dataMap.clear();
  contactMap.clear();
  establishmentCounts.clear();

  // Pass 7: Stream activity codes
  const { updated: naceCodes } = await streamActivityCodes(options.activityFile, batchSize, dryRun);

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  logger.info({
    imported, skipped, naceCodes,
    contacts: contactMap.size,
    durationMinutes: duration
  }, 'KBO import completed');

  return { imported, skipped, naceCodes, contacts: contactMap.size };
}
