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

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json)

## Belgian VAT Format

- Normalized: 10 digits (e.g., `0123456789`)
- Formatted: `BE 0123.456.789`
- Validation: checksum = 97 - (first 8 digits mod 97)
