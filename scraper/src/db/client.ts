import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.js';
import { config } from '../config.js';

let supabase: SupabaseClient<Database> | null = null;

/**
 * Get Supabase client singleton with service key (write access).
 */
export function getSupabase(): SupabaseClient<Database> {
  if (supabase) {
    return supabase;
  }

  if (!config.supabase.url || !config.supabase.serviceKey) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env'
    );
  }

  supabase = createClient<Database>(config.supabase.url, config.supabase.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabase;
}

/**
 * Create a fresh Supabase client (useful for isolated requests).
 */
export function createSupabaseClient(): SupabaseClient<Database> {
  if (!config.supabase.url || !config.supabase.serviceKey) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env'
    );
  }

  return createClient<Database>(config.supabase.url, config.supabase.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
