import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let supabase: SupabaseClient<Database> | null = null;

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
 * Get Supabase client singleton.
 * Use this for server-side operations in Astro pages/endpoints.
 *
 * @param runtimeEnv - Optional Cloudflare runtime env (from context.locals.runtime.env)
 */
export function getSupabase(runtimeEnv?: Record<string, string>): SupabaseClient<Database> {
  // If runtime env provided, always create fresh client (different requests may have different env)
  if (runtimeEnv) {
    const supabaseUrl = getEnvVar('SUPABASE_URL', runtimeEnv);
    const supabaseKey = getEnvVar('SUPABASE_ANON_KEY', runtimeEnv);

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY.'
      );
    }

    return createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  // Use singleton for non-Cloudflare environments
  if (supabase) {
    return supabase;
  }

  const supabaseUrl = getEnvVar('SUPABASE_URL');
  const supabaseKey = getEnvVar('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env'
    );
  }

  supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  return supabase;
}

/**
 * Create a fresh Supabase client (useful for isolated requests).
 */
export function createSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

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
