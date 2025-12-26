/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Cloudflare Workers types for platform bindings
type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  // Add other Cloudflare bindings here when configured
  // DB: D1Database;
  // KV: KVNamespace;
}
