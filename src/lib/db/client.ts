import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Get environment variables from various sources.
 * Priority: Cloudflare runtime env > import.meta.env > process.env
 */
function getEnvVar(name: string, runtimeEnv?: Record<string, string>): string | undefined {
  // Try Cloudflare runtime env first
  if (runtimeEnv?.[name]) {
    return runtimeEnv[name];
  }
  // Try import.meta.env (Vite/Astro)
  if (import.meta.env[name]) {
    return import.meta.env[name];
  }
  // Try process.env (Node.js fallback)
  if (typeof process !== 'undefined' && process.env?.[name]) {
    return process.env[name];
  }
  return undefined;
}

/**
 * Get Supabase client for server-side operations.
 * Creates a fresh client per request to avoid concurrency issues.
 *
 * @param runtimeEnv - Optional Cloudflare runtime env (from context.locals.runtime.env)
 */
export function getSupabase(runtimeEnv?: Record<string, string>): SupabaseClient<Database> {
  const supabaseUrl = getEnvVar('SUPABASE_URL', runtimeEnv);
  const supabaseKey = getEnvVar('SUPABASE_ANON_KEY', runtimeEnv);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

