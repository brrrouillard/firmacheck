import type { APIRoute } from 'astro';

// SSR API route - do not prerender
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const envCheck = {
    hasUrl: !!import.meta.env.SUPABASE_URL,
    hasKey: !!import.meta.env.SUPABASE_ANON_KEY,
    urlPrefix: import.meta.env.SUPABASE_URL?.substring(0, 30) || 'missing',
    query: url.searchParams.get('q') || 'none',
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(envCheck), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
