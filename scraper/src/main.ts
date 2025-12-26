#!/usr/bin/env bun
import { normalizeVat, isValidVat } from './utils/vat.js';

const HELP_TEXT = `
FirmaCheck Scraper - Belgian Company Data Importer

Usage:
  bun run src/main.ts <command> [options]

Commands:
  import-kbo    Import company data from KBO Open Data CSV files
  enrich-nbb    Enrich companies with financial data from NBB

Examples:
  # Import KBO data from CSV files
  bun run src/main.ts import-kbo \\
    --enterprise ./data/enterprise.csv \\
    --denomination ./data/denomination.csv \\
    --address ./data/address.csv \\
    --activity ./data/activity.csv

  # Enrich all companies needing updates
  bun run src/main.ts enrich-nbb

  # Enrich specific company
  bun run src/main.ts enrich-nbb --vat 0417497106

  # Enrich companies not updated in 60 days (limit 500)
  bun run src/main.ts enrich-nbb --older-than 60 --limit 500

Options:
  --help        Show this help message
  --dry-run     Parse files without writing to database (import-kbo only)
`;

interface ImportKboArgs {
  enterprise?: string;
  denomination?: string;
  address?: string;
  activity?: string;
  dryRun: boolean;
  batchSize: number;
}

interface EnrichNbbArgs {
  vat?: string;
  limit: number;
  olderThan: number;
}

function parseArgs(args: string[]): { command: string; options: Record<string, string | boolean> } {
  const options: Record<string, string | boolean> = {};
  let command = 'help';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith('--')) {
        options[key] = nextArg;
        i++;
      } else {
        options[key] = true;
      }
    } else if (i === 0 || command === 'help') {
      // First non-option arg is the command
      command = arg;
    }
  }

  return { command, options };
}

async function runImportKbo(options: Record<string, string | boolean>, logger: any): Promise<void> {
  const { importKboData } = await import('./importers/kbo-csv-importer.js');
  const args: ImportKboArgs = {
    enterprise: options['enterprise'] as string | undefined,
    denomination: options['denomination'] as string | undefined,
    address: options['address'] as string | undefined,
    activity: options['activity'] as string | undefined,
    dryRun: options['dry-run'] === true,
    batchSize: parseInt(options['batch-size'] as string, 10) || 1000,
  };

  if (!args.enterprise || !args.denomination || !args.address || !args.activity) {
    console.error('Error: All CSV files are required');
    console.error('Required: --enterprise, --denomination, --address, --activity');
    process.exit(1);
  }

  logger.info('Starting KBO import');

  const result = await importKboData({
    enterpriseFile: args.enterprise,
    denominationFile: args.denomination,
    addressFile: args.address,
    activityFile: args.activity,
    batchSize: args.batchSize,
    dryRun: args.dryRun,
  });

  logger.info({ imported: result.imported, skipped: result.skipped }, 'KBO import completed');
}

async function runEnrichNbb(options: Record<string, string | boolean>, logger: any): Promise<void> {
  const { runNbbEnrichment, runNbbEnrichmentFromDb } = await import('./crawlers/nbb-crawler.js');
  const args: EnrichNbbArgs = {
    vat: options['vat'] as string | undefined,
    limit: parseInt(options['limit'] as string, 10) || 100,
    olderThan: parseInt(options['older-than'] as string, 10) || 30,
  };

  // Single company mode
  if (args.vat) {
    const normalized = normalizeVat(args.vat);
    if (!normalized || !isValidVat(normalized)) {
      console.error(`Invalid VAT number: ${args.vat}`);
      process.exit(1);
    }

    logger.info({ vatNumber: normalized }, 'Enriching single company');
    await runNbbEnrichment([normalized]);
    return;
  }

  // Batch mode from database
  logger.info({ limit: args.limit, olderThanDays: args.olderThan }, 'Enriching companies from database');
  await runNbbEnrichmentFromDb({
    limit: args.limit,
    olderThanDays: args.olderThan,
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { command, options } = parseArgs(args);

  // Handle help first (no config needed)
  if (command === 'help' || options['help']) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Dynamic imports to avoid loading config at startup
  const { validateConfig } = await import('./config.js');
  const { logger } = await import('./utils/logger.js');

  // Validate config for commands that need database
  try {
    validateConfig();
  } catch (error) {
    console.error(`Configuration error: ${(error as Error).message}`);
    console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'import-kbo':
        await runImportKbo(options, logger);
        break;

      case 'enrich-nbb':
        await runEnrichNbb(options, logger);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log(HELP_TEXT);
        process.exit(1);
    }
  } catch (error) {
    logger.error({ error }, 'Command failed');
    process.exit(1);
  }
}

main();
