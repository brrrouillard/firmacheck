/**
 * Dynamic Sitemap Pages
 *
 * Only lists the TOP companies ordered by importance:
 * 1. Has financial data (most valuable for users)
 * 2. Establishment count (larger companies)
 * 3. Oldest companies (established businesses)
 *
 * Each sitemap contains 10,000 companies (only FR URLs to stay under 50k limit).
 * Google will discover NL/EN via hreflang tags on the pages.
 */

import type { APIRoute } from 'astro';
import { getSupabase } from '@/lib';

const COMPANIES_PER_SITEMAP = 10000;
const MAX_SITEMAPS = 5; // 5 sitemaps × 10k = 50k top companies

export const GET: APIRoute = async ({ params, locals }) => {
  const page = parseInt(params.page || '1', 10);

  if (isNaN(page) || page < 1 || page > MAX_SITEMAPS) {
    return new Response('Sitemap not found', { status: 404 });
  }

  // Get Cloudflare runtime env if available
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env;
  const supabase = getSupabase(runtimeEnv);
  const offset = (page - 1) * COMPANIES_PER_SITEMAP;

  // Fetch TOP companies ordered by importance
  const { data: companies } = await supabase
    .from('companies')
    .select('vat_number, slug, updated_at')
    .eq('status', 'active')
    .order('financial_summary', { ascending: false, nullsFirst: false })
    .order('establishment_count', { ascending: false, nullsFirst: false })
    .order('start_date', { ascending: true, nullsFirst: false })
    .range(offset, offset + COMPANIES_PER_SITEMAP - 1);

  if (!companies || companies.length === 0) {
    return new Response('Sitemap not found', { status: 404 });
  }

  const siteUrl = 'https://firmacheck.be';

  // Generate URL entries (FR only - Google discovers NL/EN via hreflang)
  const urlEntries = companies
    .map((company) => {
      const lastmod = company.updated_at
        ? new Date(company.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      return `  <url>
    <loc>${siteUrl}/fr/${company.vat_number}/${company.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
};
