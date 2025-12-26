import type { APIRoute } from 'astro';
import { getSupabase } from '@/lib/db/client';

// SSR API route - do not prerender
export const prerender = false;

export interface SearchResult {
  vat_number: string;
  name: string;
  slug: string;
  city: string | null;
  status: 'active';
}

export const GET: APIRoute = async ({ url, locals }) => {
  const query = url.searchParams.get('q')?.trim();
  const lang = url.searchParams.get('lang') || 'fr';

  // Validation: require at least 3 characters for trigram search
  if (!query || query.length < 3) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get Cloudflare runtime env if available
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env;
  const supabase = getSupabase(runtimeEnv);

  // Use optimized RPC function for search
  const { data, error } = await supabase.rpc('search_companies', {
    search_query: query,
    search_lang: lang,
    result_limit: 10,
  });

  if (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({
      error: 'Database error',
      details: error.message,
      code: error.code,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Map to SearchResult interface
  const results: SearchResult[] = (data || []).map((row: {
    vat_number: string;
    name: string;
    slug: string;
    city: string | null;
    status: string;
  }) => ({
    vat_number: row.vat_number,
    name: row.name,
    slug: row.slug,
    city: row.city,
    status: 'active' as const,
  }));

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
