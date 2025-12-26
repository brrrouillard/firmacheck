/**
 * Scraper Configuration
 */
export const config = {
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY ?? '',
  },
  nbb: {
    baseUrl: 'https://consult.cbso.nbb.be',
    maxRequestsPerMinute: parseInt(process.env.NBB_MAX_REQUESTS_PER_MINUTE ?? '20', 10),
    maxConcurrency: parseInt(process.env.NBB_MAX_CONCURRENCY ?? '1', 10),
    requestRetries: 3,
  },
  storage: {
    persistStorage: true,
    storageDir: './storage',
  },
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
} as const;

export function validateConfig(): void {
  if (!config.supabase.url) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }
  if (!config.supabase.serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
  }
}
