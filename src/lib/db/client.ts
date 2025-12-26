import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let supabase: SupabaseClient<Database> | null = null;

/**
 * Get Supabase client singleton.
 * Use this for server-side operations in Astro pages/endpoints.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (supabase) {
    return supabase;
  }

  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

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
