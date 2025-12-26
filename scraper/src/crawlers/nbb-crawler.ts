import { PlaywrightCrawler, RequestQueue, Dataset, Configuration } from 'crawlee';
import { enrichWithNbb, getCompaniesNeedingEnrichment } from '../db/upsert.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import type { NbbFinancialData } from '../db/upsert.js';

const NBB_BASE_URL = 'https://consult.cbso.nbb.be';

/**
 * Belgian accounting rubric codes mapping
 * See: https://www.nbb.be/en/central-balance-sheet-office
 */
const RUBRIC_CODES = {
  // Turnover / Revenue
  TURNOVER: ['70', '70/74', '9903'],
  // Profit/Loss
  PROFIT_LOSS: ['9904', '9905', '70/67'],
  // Equity
  EQUITY: ['10/15', '10/49'],
  // Employees (FTE) - 9087/9097 are the standard FTE codes
  // Note: Micro companies often don't report FTE
  EMPLOYEES: ['9087', '9097'],
} as const;

/**
 * Parse CSV content from NBB
 */
function parseCsvContent(csvContent: string): Record<string, number> {
  const data: Record<string, number> = {};
  const lines = csvContent.split('\n');

  for (const line of lines) {
    // Parse CSV line: "code","value"
    const match = line.match(/^"([^"]+)","([^"]+)"$/);
    if (match) {
      const [, key, value] = match;
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        data[key] = numValue;
      }
    }
  }

  return data;
}

/**
 * Find value by rubric codes (first match wins)
 */
function findByRubric(data: Record<string, number>, codes: readonly string[]): number | undefined {
  for (const code of codes) {
    if (data[code] !== undefined) {
      return data[code];
    }
  }
  return undefined;
}

/**
 * Extract financial data by downloading CSV from NBB page
 */
async function extractFinancialData(page: any, vatNumber: string): Promise<NbbFinancialData | null> {
  try {
    // Wait for the page to load
    await page.waitForSelector('#enterpriseName, .block-company', {
      timeout: 15000
    }).catch(() => null);

    // Give Angular time to render
    await page.waitForTimeout(2000);

    // Get year from page
    const bodyText = await page.textContent('body') || '';
    const yearEndMatch = bodyText.match(/Year-end date\s*(\d{2}\/\d{2}\/(\d{4}))/);
    const year = yearEndMatch ? parseInt(yearEndMatch[2], 10) : null;

    if (!year) {
      logger.warn({ vatNumber }, 'Could not find filing year on page');
      return null;
    }

    // Try to download CSV from the first filing
    let csvData: Record<string, number> = {};

    try {
      // Find the first CSV download button (in the first filing row)
      const csvButton = await page.$('app-deposit-item button[aria-label="Download csv"], button[aria-label="Download csv"]');

      if (csvButton) {
        const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
        await csvButton.click();

        const download = await downloadPromise;
        const path = await download.path();

        if (path) {
          const fs = await import('fs/promises');
          const content = await fs.readFile(path, 'utf-8');
          csvData = parseCsvContent(content);
          logger.debug({ vatNumber, rubrics: Object.keys(csvData).length }, 'Parsed CSV data');
        }
      } else {
        logger.warn({ vatNumber }, 'No CSV download button found');
      }
    } catch (err) {
      logger.warn({ vatNumber, error: err instanceof Error ? err.message : err }, 'Could not download CSV');
    }

    // Extract financial metrics from CSV
    const turnover = findByRubric(csvData, RUBRIC_CODES.TURNOVER);
    const profitLoss = findByRubric(csvData, RUBRIC_CODES.PROFIT_LOSS);
    const equity = findByRubric(csvData, RUBRIC_CODES.EQUITY);
    const employeesRaw = findByRubric(csvData, RUBRIC_CODES.EMPLOYEES);
    const employees = employeesRaw !== undefined ? Math.round(employeesRaw) : undefined;

    logger.info({
      vatNumber,
      year,
      turnover,
      profitLoss,
      equity,
      employees,
    }, 'Extracted NBB financial data from CSV');

    return {
      vatNumber,
      year,
      turnover,
      profitLoss,
      equity,
      employees,
    };
  } catch (error) {
    logger.error({ vatNumber, error: error instanceof Error ? error.message : error }, 'Failed to extract data');
    return null;
  }
}

/**
 * Create and configure the NBB PlaywrightCrawler
 */
export async function createNbbCrawler() {
  // Configure Crawlee storage
  Configuration.getGlobalConfig().set('persistStorage', config.storage.persistStorage);

  const requestQueue = await RequestQueue.open('nbb-queue');

  const crawler = new PlaywrightCrawler({
    requestQueue,

    // Rate limiting
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

      logger.info({ vatNumber, url: request.url }, 'Processing NBB page with Playwright');

      // Wait for page to be ready
      await page.waitForLoadState('networkidle');

      // Check for no data message
      const pageText = await page.textContent('body') || '';
      const noDataIndicators = [
        'geen jaarrekeningen',
        'no annual accounts',
        'aucun compte annuel',
        'not found',
        'niet gevonden',
        'geen gegevens',
      ];

      if (noDataIndicators.some(indicator => pageText.toLowerCase().includes(indicator))) {
        logger.info({ vatNumber }, 'No annual accounts available');
        await Dataset.pushData({
          vatNumber,
          status: 'no_data',
          scrapedAt: new Date().toISOString(),
        });
        return;
      }

      // Extract financial data
      const financialData = await extractFinancialData(page, vatNumber);

      if (!financialData) {
        logger.warn({ vatNumber }, 'Could not extract financial data');

        // Take screenshot for debugging
        const screenshot = await page.screenshot({ type: 'png' });

        await Dataset.pushData({
          vatNumber,
          status: 'extraction_failed',
          pageText: pageText.substring(0, 1000),
          scrapedAt: new Date().toISOString(),
        });
        return;
      }

      // Save to dataset for debugging
      await Dataset.pushData({
        vatNumber,
        status: 'success',
        data: financialData,
        scrapedAt: new Date().toISOString(),
      });

      // Update database
      try {
        await enrichWithNbb(financialData);
        logger.info({ vatNumber, year: financialData.year }, 'Enriched company with NBB data');
      } catch (err) {
        logger.error({ vatNumber, error: err instanceof Error ? err.message : err }, 'Failed to save NBB data to database');
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
      }, 'NBB request failed');

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
 * Build NBB URL for a company
 */
function buildNbbUrl(vatNumber: string): string {
  return `${NBB_BASE_URL}/consult-enterprise/${vatNumber}`;
}

/**
 * Enqueue a single company for NBB enrichment
 */
export async function enqueueCompany(
  requestQueue: RequestQueue,
  vatNumber: string
): Promise<void> {
  await requestQueue.addRequest({
    url: buildNbbUrl(vatNumber),
    uniqueKey: `nbb-${vatNumber}`,
    userData: { vatNumber },
  });
}

/**
 * Enqueue companies from database that need enrichment
 */
export async function enqueueCompaniesNeedingEnrichment(
  requestQueue: RequestQueue,
  options: { limit?: number; olderThanDays?: number } = {}
): Promise<number> {
  const companies = await getCompaniesNeedingEnrichment(options);

  for (const company of companies) {
    await enqueueCompany(requestQueue, company.vat_number);
  }

  logger.info({ count: companies.length }, 'Enqueued companies for NBB enrichment');
  return companies.length;
}

/**
 * Run NBB enrichment for specified VAT numbers
 */
export async function runNbbEnrichment(vatNumbers: string[]): Promise<void> {
  logger.info({ count: vatNumbers.length }, 'Starting NBB enrichment');

  const { crawler, requestQueue } = await createNbbCrawler();

  for (const vatNumber of vatNumbers) {
    await enqueueCompany(requestQueue, vatNumber);
  }

  await crawler.run();

  logger.info('NBB enrichment completed');
}

/**
 * Run NBB enrichment for companies needing updates
 */
export async function runNbbEnrichmentFromDb(options: {
  limit?: number;
  olderThanDays?: number;
} = {}): Promise<void> {
  const { crawler, requestQueue } = await createNbbCrawler();

  const count = await enqueueCompaniesNeedingEnrichment(requestQueue, options);

  if (count === 0) {
    logger.info('No companies need NBB enrichment');
    return;
  }

  await crawler.run();

  logger.info({ processed: count }, 'NBB enrichment completed');
}
