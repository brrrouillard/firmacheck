/**
 * Sitemap Index
 *
 * Strategy: Only list the top ~50k most important companies
 * (by establishment count + financial data). Let Google discover
 * the rest via internal links (neighbors, similar companies).
 *
 * This avoids wasting Google's crawl budget on 1.1M+ pages.
 */

import type { APIRoute } from 'astro';

// We limit to 50k top companies, split into chunks of 10k for faster generation
const TOP_COMPANIES_LIMIT = 50000;
const COMPANIES_PER_SITEMAP = 10000;
const TOTAL_SITEMAPS = Math.ceil(TOP_COMPANIES_LIMIT / COMPANIES_PER_SITEMAP);

export const GET: APIRoute = async () => {
  const siteUrl = 'https://firmacheck.be';
  const lastmod = new Date().toISOString().split('T')[0];

  const sitemapEntries = Array.from({ length: TOTAL_SITEMAPS }, (_, i) =>
    `  <sitemap>
    <loc>${siteUrl}/sitemap-${i + 1}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
};
