import { PlaywrightCrawler, RequestQueue, Dataset, Configuration } from 'crawlee';
import { enrichWithKbo, getCompaniesNeedingKboEnrichment } from '../db/upsert.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import type { CompanyFunction, EntityLink, Qualification, NaceHistory, FiscalPeriod } from '../db/types.js';

const KBO_BASE_URL = 'https://kbopub.economie.fgov.be';

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
 * Extract all KBO data from page
 */
async function extractKboData(page: any, vatNumber: string): Promise<KboEnrichmentData | null> {
  try {
    // Wait for page content
    await page.waitForSelector('body', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Check for error messages
    const bodyText = await page.textContent('body') || '';

    if (bodyText.includes('geen resultaten') || bodyText.includes('no results') || bodyText.includes('aucun résultat')) {
      logger.info({ vatNumber }, 'No company found on KBO');
      return null;
    }

    // Extract functions directly from page text using simple pattern matching
    // KBO format: "Bestuurder Brouillard, Matthieu Sinds 9 april 2024"
    const functions: Array<{ firstName: string; lastName: string; role: string; roleCode: string; startDate: string | null }> = [];

    // Role patterns in Dutch, French, and English
    const rolePatterns = [
      'Bestuurder',
      'Zaakvoerder',
      'Gedelegeerd bestuurder',
      'Oprichter',
      'Vennoot',
      'Administrateur',
      'Gérant',
      'Administrateur délégué',
      'Fondateur',
      'Associé',
      'Director',
      'Manager',
      'CEO',
    ];

    // Build regex to find: Role + Name (LastName, FirstName) + optional date
    // KBO format: "Bestuurder\n...\n LastName ,   FirstName \n...Sinds date"
    for (const role of rolePatterns) {
      // Pattern: Role followed by whitespace/newlines, then "LastName , FirstName" (with optional spaces around comma)
      // and optionally "Sinds/Since/Depuis date"
      const pattern = new RegExp(
        `${role}[\\s\\n]+([A-ZÀ-ÿ][a-zà-ÿ-]+(?:\\s+[A-ZÀ-ÿ][a-zà-ÿ-]+)*)\\s*,\\s*([A-ZÀ-ÿ][a-zà-ÿ-]+(?:\\s+[A-ZÀ-ÿ][a-zà-ÿ-]+)*)\\s*(?:Sinds|Since|Depuis)\\s+(\\d{1,2}\\s+\\w+\\s+\\d{4})`,
        'gi'
      );

      let match;
      while ((match = pattern.exec(bodyText)) !== null) {
        const lastName = match[1].trim();
        const firstName = match[2].trim();
        const dateStr = match[3] || null;

        functions.push({
          firstName,
          lastName,
          role: role,
          roleCode: '',
          startDate: dateStr,
        });

        logger.debug({ vatNumber, role, firstName, lastName, date: dateStr }, 'Found function');
      }
    }

    // Also try to find from table structure if present
    if (functions.length === 0) {
      // Try table-based extraction
      const tableData = await page.evaluate(() => {
        const results: Array<{ role: string; name: string; date: string | null }> = [];

        // Look for tables
        const tables = document.querySelectorAll('table');
        for (const table of tables) {
          const rows = table.querySelectorAll('tr');
          for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              const text = Array.from(cells).map(c => c.textContent?.trim() || '').join(' ');
              // Check if this row contains a name (LastName, FirstName pattern)
              if (text.match(/[A-Z][a-z]+,\s*[A-Z][a-z]+/)) {
                const roleCell = cells[0]?.textContent?.trim() || '';
                const nameCell = cells[1]?.textContent?.trim() || '';
                const dateCell = cells[2]?.textContent?.trim() || null;
                if (nameCell.includes(',')) {
                  results.push({ role: roleCell, name: nameCell, date: dateCell });
                }
              }
            }
          }
        }
        return results;
      });

      for (const item of tableData) {
        const nameParts = item.name.split(',').map((s: string) => s.trim());
        if (nameParts.length >= 2) {
          functions.push({
            firstName: nameParts[1],
            lastName: nameParts[0],
            role: item.role || 'Unknown',
            roleCode: '',
            startDate: item.date,
          });
        }
      }
    }

    if (functions.length === 0) {
      logger.debug({ vatNumber }, 'No functions found on page');
    }

    // Convert to our format
    const companyFunctions: CompanyFunction[] = functions.map((f: { firstName: string; lastName: string; role: string; roleCode: string; startDate: string | null }) => ({
      first_name: cleanName(f.firstName),
      last_name: cleanName(f.lastName),
      role: f.role,
      role_code: mapRoleToCode(f.role),
      start_date: parseDate(f.startDate),
    }));

    // Extract capital
    const capitalMatch = bodyText.match(/(?:Kapitaal|Capital)[:\s]*([0-9.,]+)\s*EUR/i);
    const capital = capitalMatch ? parseFloat(capitalMatch[1].replace(/\./g, '').replace(',', '.')) : null;

    // Extract fiscal year end
    const fiscalYearMatch = bodyText.match(/(?:Afsluiting boekjaar|Clôture exercice|Fiscal year end)[:\s]*(\d{1,2}\s+\w+|\d{1,2}\/\d{1,2})/i);
    const fiscalYearEnd = fiscalYearMatch ? fiscalYearMatch[1].trim() : null;

    // Extract annual meeting month
    const meetingMatch = bodyText.match(/(?:Jaarlijkse algemene vergadering|Assemblée générale annuelle|Annual meeting)[:\s]*(\w+)/i);
    const annualMeetingMonth = meetingMatch ? meetingMatch[1].trim() : null;

    // Extract juridical situation date
    const juridicalDateMatch = bodyText.match(/(?:Rechtstoestand|Situation juridique)[:\s]*[^(]*\((?:sinds|depuis|since)\s+(\d{1,2}[\/\s]\w+[\/\s]\d{4})\)/i);
    const juridicalSituationDate = juridicalDateMatch ? parseDate(juridicalDateMatch[1]) : null;

    // Extract qualifications (Hoedanigheden)
    const qualifications: Qualification[] = [];
    const qualPatterns = [
      { pattern: /(?:Werkgever|Employeur|RSZ)[^(]*\((?:sinds|depuis|since)\s+(\d{1,2}[\/\s]\w+[\/\s]\d{4})\)/gi, type: 'rsz_employer' as const, label: 'RSZ Employer' },
      { pattern: /(?:Onderworpen aan btw|Assujetti à la TVA|VAT subject)[^(]*(?:\((?:sinds|depuis|since)\s+(\d{1,2}[\/\s]\w+[\/\s]\d{4})\))?/gi, type: 'vat_subject' as const, label: 'VAT Subject' },
      { pattern: /(?:Inschrijvingsplichtige onderneming|Entreprise soumise)[^(]*(?:\((?:sinds|depuis|since)\s+(\d{1,2}[\/\s]\w+[\/\s]\d{4})\))?/gi, type: 'registration_obligated' as const, label: 'Registration Obligated' },
    ];

    for (const { pattern, type, label } of qualPatterns) {
      let match;
      while ((match = pattern.exec(bodyText)) !== null) {
        qualifications.push({
          type,
          label,
          start_date: match[1] ? parseDate(match[1]) : null,
          end_date: null,
        });
      }
    }

    // Extract entity links (Linken tussen entiteiten)
    const entityLinks: EntityLink[] = [];
    // Pattern: enterprise number with relationship description
    const linkPattern = /(\d{4}\.\d{3}\.\d{3})[^(]*\((?:sinds|depuis|since)\s+(\d{1,2}[\/\s]\w+[\/\s]\d{4})\)/gi;
    let linkMatch;
    while ((linkMatch = linkPattern.exec(bodyText)) !== null) {
      const linkedVat = linkMatch[1].replace(/\./g, '');
      if (linkedVat !== vatNumber) {
        entityLinks.push({
          type: 'unknown',
          vat_number: linkedVat,
          name: null,
          start_date: parseDate(linkMatch[2]),
          end_date: null,
        });
      }
    }

    // Extract NACE history (different versions)
    const naceHistory: NaceHistory = {};
    const naceVersionPattern = /(?:Nacebelcode versie|NACE-BEL version)\s*(\d{4})/gi;
    const naceCodePattern = /(\d{2}\.\d{3})\s*-\s*([^\n]+)/g;

    // Simple extraction - find NACE codes
    let naceMatch;
    while ((naceMatch = naceCodePattern.exec(bodyText)) !== null) {
      const code = naceMatch[1];
      const description = naceMatch[2].trim();
      // Default to current version if we can't determine
      if (!naceHistory['current']) {
        naceHistory['current'] = [];
      }
      naceHistory['current'].push({ code, description });
    }

    // Extract exceptional fiscal periods
    const exceptionalFiscalPeriods: FiscalPeriod[] = [];
    const exceptionalPattern = /(?:Uitzonderlijk boekjaar|Exercice exceptionnel)[:\s]*(\d{1,2}[\/\s]\w+[\/\s]\d{4})\s*[-–]\s*(\d{1,2}[\/\s]\w+[\/\s]\d{4})/gi;
    let exceptionalMatch;
    while ((exceptionalMatch = exceptionalPattern.exec(bodyText)) !== null) {
      const startDate = parseDate(exceptionalMatch[1]);
      const endDate = parseDate(exceptionalMatch[2]);
      if (startDate && endDate) {
        exceptionalFiscalPeriods.push({ start_date: startDate, end_date: endDate });
      }
    }

    logger.info({
      vatNumber,
      functionsCount: companyFunctions.length,
      capital,
      fiscalYearEnd,
      qualificationsCount: qualifications.length,
      entityLinksCount: entityLinks.length,
    }, 'Extracted KBO data');

    return {
      vatNumber,
      functions: companyFunctions,
      capital,
      fiscalYearEnd,
      annualMeetingMonth,
      juridicalSituationDate,
      entityLinks,
      qualifications,
      naceHistory,
      exceptionalFiscalPeriods,
    };
  } catch (error) {
    logger.error({ vatNumber, error: error instanceof Error ? error.message : error }, 'Failed to extract KBO data');
    return null;
  }
}

/**
 * Clean up name (remove extra whitespace, fix formatting)
 */
function cleanName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map role text to standardized code
 */
function mapRoleToCode(role: string): string {
  const roleLower = role.toLowerCase();

  if (roleLower.includes('zaakvoerder') || roleLower.includes('gérant')) return 'manager';
  if (roleLower.includes('gedelegeerd') || roleLower.includes('délégué')) return 'ceo';
  if (roleLower.includes('bestuurder') || roleLower.includes('administrateur') || roleLower.includes('director')) return 'director';
  if (roleLower.includes('voorzitter') || roleLower.includes('président') || roleLower.includes('president')) return 'president';
  if (roleLower.includes('secretaris') || roleLower.includes('secrétaire') || roleLower.includes('secretary')) return 'secretary';

  return 'other';
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;

  // Try different date formats
  // Dutch: "9 april 2024" or "09/04/2024"
  // French: "9 avril 2024"

  const monthMap: Record<string, string> = {
    januari: '01', january: '01', janvier: '01',
    februari: '02', february: '02', février: '02',
    maart: '03', march: '03', mars: '03',
    april: '04', avril: '04',
    mei: '05', may: '05', mai: '05',
    juni: '06', june: '06', juin: '06',
    juli: '07', july: '07', juillet: '07',
    augustus: '08', august: '08', août: '08',
    september: '09', septembre: '09',
    oktober: '10', october: '10', octobre: '10',
    november: '11', novembre: '11',
    december: '12', décembre: '12',
  };

  // Try "day month year" format
  const textDateMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (textDateMatch) {
    const [, day, month, year] = textDateMatch;
    const monthNum = monthMap[month.toLowerCase()];
    if (monthNum) {
      return `${year}-${monthNum}-${day.padStart(2, '0')}`;
    }
  }

  // Try "dd/mm/yyyy" format
  const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return null;
}

/**
 * Create and configure the KBO PlaywrightCrawler
 */
export async function createKboCrawler() {
  // Configure Crawlee storage
  Configuration.getGlobalConfig().set('persistStorage', config.storage.persistStorage);

  const requestQueue = await RequestQueue.open('kbo-queue');

  const crawler = new PlaywrightCrawler({
    requestQueue,

    // Rate limiting (same as NBB - be polite)
    maxRequestsPerMinute: config.nbb.maxRequestsPerMinute,
    maxConcurrency: config.nbb.maxConcurrency,
    maxRequestRetries: config.nbb.requestRetries,

    // Timeouts
    requestHandlerTimeoutSecs: 60,
    navigationTimeoutSecs: 30,

    // Browser settings
    launchContext: {
      launchOptions: {
        headless: true,
      },
    },

    // Request handler
    async requestHandler({ page, request }) {
      const vatNumber = request.userData.vatNumber as string;

      logger.info({ vatNumber, url: request.url }, 'Processing KBO page');

      // Wait for page to load
      await page.waitForLoadState('domcontentloaded');

      // Extract all KBO data
      const kboData = await extractKboData(page, vatNumber);

      if (!kboData) {
        logger.warn({ vatNumber }, 'Could not extract KBO data');

        await Dataset.pushData({
          vatNumber,
          status: 'extraction_failed',
          scrapedAt: new Date().toISOString(),
        });
        return;
      }

      // Save to dataset for debugging
      await Dataset.pushData({
        vatNumber,
        status: 'success',
        data: kboData,
        scrapedAt: new Date().toISOString(),
      });

      // Update database
      try {
        await enrichWithKbo(kboData);
        logger.info({
          vatNumber,
          functions: kboData.functions.length,
          capital: kboData.capital,
          qualifications: kboData.qualifications.length,
          entityLinks: kboData.entityLinks.length,
        }, 'Enriched company with KBO data');
      } catch (err) {
        logger.error({ vatNumber, error: err instanceof Error ? err.message : err }, 'Failed to save KBO data to database');
      }
    },

    // Pre-navigation hooks
    preNavigationHooks: [
      async ({ request }) => {
        // Add delay between requests (2-4 seconds)
        const delay = 2000 + Math.random() * 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      },
    ],

    // Error handling
    failedRequestHandler: async ({ request, error }) => {
      const vatNumber = request.userData.vatNumber as string;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({
        vatNumber,
        url: request.url,
        error: errorMessage,
        retryCount: request.retryCount,
      }, 'KBO request failed');

      await Dataset.pushData({
        vatNumber,
        status: 'failed',
        error: errorMessage,
        retryCount: request.retryCount,
        scrapedAt: new Date().toISOString(),
      });
    },
  });

  return { crawler, requestQueue };
}

/**
 * Build KBO URL for a company
 */
function buildKboUrl(vatNumber: string): string {
  // Format: add dots for KBO URL
  const formatted = vatNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3');
  return `${KBO_BASE_URL}/kbopub/zoeknummerform.html?nummer=${formatted}&actionLu=Recherche`;
}

/**
 * Enqueue a single company for KBO enrichment
 */
export async function enqueueCompany(
  requestQueue: RequestQueue,
  vatNumber: string
): Promise<void> {
  await requestQueue.addRequest({
    url: buildKboUrl(vatNumber),
    uniqueKey: `kbo-${vatNumber}`,
    userData: { vatNumber },
  });
}

/**
 * Enqueue companies from database that need KBO enrichment
 */
export async function enqueueCompaniesNeedingKboEnrichment(
  requestQueue: RequestQueue,
  options: { limit?: number; olderThanDays?: number } = {}
): Promise<number> {
  const companies = await getCompaniesNeedingKboEnrichment(options);

  for (const company of companies) {
    await enqueueCompany(requestQueue, company.vat_number);
  }

  logger.info({ count: companies.length }, 'Enqueued companies for KBO enrichment');
  return companies.length;
}

/**
 * Run KBO enrichment for specified VAT numbers
 */
export async function runKboEnrichment(vatNumbers: string[]): Promise<void> {
  logger.info({ count: vatNumbers.length }, 'Starting KBO enrichment');

  const { crawler, requestQueue } = await createKboCrawler();

  for (const vatNumber of vatNumbers) {
    await enqueueCompany(requestQueue, vatNumber);
  }

  await crawler.run();

  logger.info('KBO enrichment completed');
}

/**
 * Run KBO enrichment for companies needing updates
 */
export async function runKboEnrichmentFromDb(options: {
  limit?: number;
  olderThanDays?: number;
} = {}): Promise<void> {
  const { crawler, requestQueue } = await createKboCrawler();

  const count = await enqueueCompaniesNeedingKboEnrichment(requestQueue, options);

  if (count === 0) {
    logger.info('No companies need KBO enrichment');
    return;
  }

  await crawler.run();

  logger.info({ processed: count }, 'KBO enrichment completed');
}
