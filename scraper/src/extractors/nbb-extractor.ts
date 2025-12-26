import type { CheerioAPI } from 'cheerio';
import type { NbbFinancialData } from '../db/upsert.js';
import { logger } from '../utils/logger.js';


/**
 * NBB CBSO (Centrale des Bilans) Financial Data Extractor
 *
 * The NBB provides annual account data for Belgian companies.
 * URL pattern: https://consult.cbso.nbb.be/consult-enterprise/{vatNumber}
 *
 * The page structure includes:
 * - Company identification
 * - List of filed annual accounts by year
 * - Summary financial data for each filing
 */

interface FilingData {
  year: number;
  referenceNumber?: string;
  turnover?: number;
  profitLoss?: number;
  equity?: number;
  employees?: number;
  depositDate?: string;
}

/**
 * Parse Belgian number format (1.234.567,89) to number
 */
function parseAmount(text: string): number | undefined {
  if (!text || text.trim() === '' || text.trim() === '-') {
    return undefined;
  }

  // Belgian format: 1.234.567,89
  // Remove thousand separators (dots), replace decimal comma with dot
  const cleaned = text
    .replace(/\s/g, '')           // Remove spaces
    .replace(/\./g, '')           // Remove thousand separators
    .replace(',', '.')            // Convert decimal separator
    .replace(/[^\d.-]/g, '');     // Remove any remaining non-numeric chars

  const value = parseFloat(cleaned);
  return isNaN(value) ? undefined : value;
}

/**
 * Parse integer from text
 */
function parseInteger(text: string): number | undefined {
  const cleaned = text.replace(/\D/g, '');
  const value = parseInt(cleaned, 10);
  return isNaN(value) ? undefined : value;
}

/**
 * Extract financial year from filing row
 */
function extractYear($: CheerioAPI, row: any): number | null {
  // Look for year in various formats
  const yearPatterns = [
    /\b(20\d{2})\b/,  // 4-digit year starting with 20
    /\b(19\d{2})\b/,  // 4-digit year starting with 19
  ];

  const rowText = $(row).text();
  for (const pattern of yearPatterns) {
    const match = rowText.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Extract financial data from NBB CBSO page
 */
export function extractNbbFinancialData($: CheerioAPI, vatNumber: string): NbbFinancialData | null {
  try {
    const filings: FilingData[] = [];

    // NBB page typically has a table or list of annual accounts
    // Common selectors for the filings list
    const filingSelectors = [
      'table.accounts-list tr',
      '.filing-row',
      '.annual-account-item',
      'tr[data-year]',
      '.deposit-list-item',
    ];

    let foundRows = false;

    for (const selector of filingSelectors) {
      const rows = $(selector);
      if (rows.length > 0) {
        foundRows = true;

        rows.each((_, row) => {
          const $row = $(row);
          const year = extractYear($, row);

          if (!year) return;

          const filing: FilingData = { year };

          // Try to extract financial metrics from the row
          // These selectors are based on common patterns - may need adjustment
          const cells = $row.find('td');

          cells.each((idx, cell) => {
            const $cell = $(cell);
            const text = $cell.text().trim();
            const label = $cell.attr('data-label')?.toLowerCase() || '';
            const className = $cell.attr('class')?.toLowerCase() || '';

            // Match by data attribute, class, or position
            if (label.includes('omzet') || label.includes('turnover') || label.includes('chiffre')) {
              filing.turnover = parseAmount(text);
            } else if (label.includes('winst') || label.includes('verlies') || label.includes('profit') || label.includes('perte')) {
              filing.profitLoss = parseAmount(text);
            } else if (label.includes('eigen vermogen') || label.includes('equity') || label.includes('capitaux')) {
              filing.equity = parseAmount(text);
            } else if (label.includes('personeel') || label.includes('employees') || label.includes('effectif')) {
              filing.employees = parseInteger(text);
            }

            // Check class names too
            if (className.includes('turnover')) {
              filing.turnover = parseAmount(text);
            } else if (className.includes('profit')) {
              filing.profitLoss = parseAmount(text);
            } else if (className.includes('equity')) {
              filing.equity = parseAmount(text);
            } else if (className.includes('employee')) {
              filing.employees = parseInteger(text);
            }
          });

          filings.push(filing);
        });

        break;
      }
    }

    // Also try to find summary data in dedicated sections
    const summarySelectors = [
      '.financial-summary',
      '.key-figures',
      '#summary-data',
    ];

    for (const selector of summarySelectors) {
      const summary = $(selector);
      if (summary.length > 0) {
        // Extract year from heading
        const yearMatch = summary.find('h2, h3, .year').text().match(/\b(20\d{2})\b/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear() - 1;

        const filing: FilingData = { year };

        // Look for labeled values
        summary.find('[data-field], .metric, dt, th').each((_, el) => {
          const $el = $(el);
          const label = ($el.attr('data-field') || $el.text()).toLowerCase();
          const valueText = $el.next('dd, td, .value').text() || $el.find('.value').text();

          if (label.includes('omzet') || label.includes('turnover')) {
            filing.turnover = parseAmount(valueText);
          } else if (label.includes('resultaat') || label.includes('profit')) {
            filing.profitLoss = parseAmount(valueText);
          } else if (label.includes('eigen vermogen') || label.includes('equity')) {
            filing.equity = parseAmount(valueText);
          } else if (label.includes('personeel') || label.includes('fte')) {
            filing.employees = parseInteger(valueText);
          }
        });

        if (filing.turnover !== undefined || filing.profitLoss !== undefined) {
          filings.push(filing);
        }
      }
    }

    if (filings.length === 0) {
      if (!foundRows) {
        logger.debug({ vatNumber }, 'No filing rows found on NBB page');
      }
      return null;
    }

    // Sort by year descending, get latest
    filings.sort((a, b) => b.year - a.year);
    const latest = filings[0];

    logger.debug({
      vatNumber,
      year: latest.year,
      hasData: {
        turnover: latest.turnover !== undefined,
        profitLoss: latest.profitLoss !== undefined,
        equity: latest.equity !== undefined,
        employees: latest.employees !== undefined,
      },
    }, 'Extracted NBB financial data');

    return {
      vatNumber,
      year: latest.year,
      turnover: latest.turnover,
      profitLoss: latest.profitLoss,
      equity: latest.equity,
      employees: latest.employees,
    };
  } catch (error) {
    logger.error({ vatNumber, error }, 'Failed to extract NBB data');
    return null;
  }
}

/**
 * Check if the page indicates no data available
 */
export function hasNoDataAvailable($: CheerioAPI): boolean {
  const noDataIndicators = [
    'geen jaarrekeningen',
    'no annual accounts',
    'aucun compte annuel',
    'not found',
    'niet gevonden',
  ];

  const pageText = $('body').text().toLowerCase();
  return noDataIndicators.some((indicator) => pageText.includes(indicator));
}
