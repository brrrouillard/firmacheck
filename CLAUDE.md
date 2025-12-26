# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FirmaCheck is a Belgian company directory website. It displays company information fetched from a Supabase database, including VAT numbers, addresses, financial data, and NACE codes.

## Tech Stack

- **Framework**: Astro 5 with SSR (server-side rendering)
- **UI**: React 19 + Tailwind CSS 4 + shadcn/ui (base-nova style)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Cloudflare Workers (via `@astrojs/cloudflare` adapter)
- **Package Manager**: Bun

## Commands

```bash
# Web app (root directory)
bun dev          # Start dev server
bun run build    # Production build
bun run preview  # Preview production build
bun run lint     # Run ESLint

# Scraper (scraper/ directory)
cd scraper
bun run src/main.ts import-kbo --enterprise ./data/enterprise.csv --denomination ./data/denomination.csv --address ./data/address.csv --activity ./data/activity.csv
bun run src/main.ts enrich-nbb --vat 0417497106  # Single company
bun run src/main.ts enrich-nbb --limit 500       # Batch mode
```

## Environment Variables

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key        # Web app (public, RLS-protected)
SUPABASE_SERVICE_KEY=your-service-key  # Scraper only (bypasses RLS)
```

## Architecture

### Routing

URL pattern: `/{lang}/{vat}/{slug}` (e.g., `/fr/0123456789/company-name`)

- `src/pages/[...path].astro` - Dynamic catch-all route for company pages
- Validates language (fr, nl, en), normalizes VAT, 301 redirects to canonical slug

### Database Layer (`src/lib/db/`)

- `client.ts` - Supabase client singleton (`getSupabase()`)
- `types.ts` - TypeScript types matching `supabase/migrations/001_create_companies.sql`

### Utility Libraries (`src/lib/`)

- `vat.ts` - Belgian VAT validation with checksum verification (97 - mod 97 algorithm)
- `slugify.ts` - URL slug generation with French/Dutch character handling
- `index.ts` - Re-exports all utilities for convenient imports via `@/lib`

### Components

- `src/components/company-page.astro` - Main Astro component for company display (static HTML)
- `src/components/copy-button.tsx` - Small React island for clipboard functionality
- `src/components/ui/` - shadcn/ui components (do not edit directly)

#### shadcn/ui Guidelines

- **Always add new shadcn components** when needed using `bunx shadcn@latest add <component>`
- **Never overwrite theme values** - extend or add to the existing theme instead of replacing

#### JavaScript Optimization

- **Minimize client-side JS** - Use Astro's island architecture
- **Prefer `.astro` components** for static content (no JS shipped)
- **Use `client:*` directives sparingly** - Only on components that need interactivity
- **Create small client islands** - Extract only interactive parts (e.g., buttons, forms) into React components with `client:load`

### Middleware

- `src/middleware.ts` - Cache control headers (static assets: immutable, API: no-cache, pages: stale-while-revalidate)

### Scraper (`scraper/`)

Separate Bun project for data import and enrichment. Uses Crawlee + Playwright for web scraping.

- `import-kbo` - Imports company data from KBO Open Data CSV files
- `enrich-nbb` - Enriches companies with financial data from NBB (National Bank of Belgium)

## KBO Data Import

### Data Source

Belgian company data comes from the **KBO Open Data** (Kruispuntbank van Ondernemingen / Banque-Carrefour des Entreprises):

- **Download**: https://kbopub.economie.fgov.be/kbo-open-data/
- **License**: Open Data (free for commercial use)
- **Update frequency**: Monthly

### Required CSV Files

Download and extract the KBO Open Data ZIP. The import uses these files:

| File | Size | Description |
|------|------|-------------|
| `enterprise.csv` | ~86MB | Core company data (VAT, status, legal form, start date) |
| `denomination.csv` | ~147MB | Company names (multilingual: FR/NL/DE/EN) |
| `address.csv` | ~288MB | Registered addresses (bilingual) |
| `activity.csv` | ~1.5GB | NACE codes (industry classification) |
| `contact.csv` | ~25MB | Phone, email, website, fax (optional) |
| `establishment.csv` | ~60MB | Branch/establishment data (optional) |

### Import Command

```bash
cd scraper

# Full import with all data (recommended)
bun run src/main.ts import-kbo \
  --enterprise ../datasets/enterprise.csv \
  --denomination ../datasets/denomination.csv \
  --address ../datasets/address.csv \
  --activity ../datasets/activity.csv \
  --contact ../datasets/contact.csv \
  --establishment ../datasets/establishment.csv

# Minimal import (required files only)
bun run src/main.ts import-kbo \
  --enterprise ../datasets/enterprise.csv \
  --denomination ../datasets/denomination.csv \
  --address ../datasets/address.csv \
  --activity ../datasets/activity.csv

# Include stopped/inactive companies
bun run src/main.ts import-kbo \
  --enterprise ../datasets/enterprise.csv \
  ... \
  --all
```

### Import Process (7-Pass Stream Processing)

The importer uses memory-efficient streaming to handle the 1.5GB activity.csv:

1. **Pass 1**: Parse `enterprise.csv` → filter active legal entities, extract VAT/status/legal form/start date
2. **Pass 2**: Parse `denomination.csv` → match names (FR/NL/DE/EN, abbreviations, commercial names)
3. **Pass 3**: Parse `address.csv` → match addresses (bilingual street/city)
4. **Pass 4**: Parse `contact.csv` → extract phone/email/website/fax
5. **Pass 5**: Parse `establishment.csv` → count branches per enterprise
6. **Pass 6**: Batch upsert companies to Supabase (1000/batch)
7. **Pass 7**: Stream `activity.csv` → update NACE codes directly in DB

### Database Schema

Primary key is `vat_number` (10-digit Belgian enterprise number). Key fields:

```sql
vat_number VARCHAR(10) PRIMARY KEY,
name TEXT NOT NULL,                    -- Primary display name
slug VARCHAR(255) NOT NULL,            -- URL slug
names JSONB,                           -- {fr, nl, de, en, abbreviation, commercial}
legal_form VARCHAR(50),                -- e.g., "SRL", "SA", "SPRL"
status company_status,                 -- 'active' | 'stopped'
juridical_situation juridical_situation, -- 'normal', 'bankruptcy', 'liquidation', etc.
start_date DATE,
address JSONB,                         -- {street_fr, street_nl, city_fr, city_nl, postal_code, ...}
contact JSONB,                         -- {phone, email, website, fax}
nace_codes TEXT[],                     -- All NACE 2008 activity codes
nace_main VARCHAR(10),                 -- Primary activity code
establishment_count INT,               -- Number of branches
financial_summary JSONB,               -- NBB enrichment data
```

### Import Statistics (December 2024)

| Metric | Value |
|--------|-------|
| Total companies imported | 1,132,830 |
| With NACE codes | 723,905 (63.9%) |
| With contact info | 129,340 (11.4%) |
| With establishments | 790,916 (69.8%) |
| Import duration | ~75 minutes |
| CSV rows processed | ~45M total |

### Juridical Situation Codes

The KBO uses numeric codes for juridical situations, mapped to our enum:

| Code | Meaning |
|------|---------|
| 000 | Normal activity |
| 012 | Opening of bankruptcy |
| 050 | Bankruptcy |
| 091 | Liquidation |
| 041 | Merger/acquisition |
| 020 | Voluntary dissolution |

Full mapping in `scraper/src/db/types.ts`

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json)

## Belgian VAT Format

- Normalized: 10 digits (e.g., `0123456789`)
- Formatted: `BE 0123.456.789`
- Validation: checksum = 97 - (first 8 digits mod 97)
