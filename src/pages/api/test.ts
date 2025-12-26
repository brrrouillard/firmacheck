import type { APIRoute } from 'astro';

// SSR API route - do not prerender
export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  // Get Cloudflare runtime env
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env;

  const envCheck = {
    // Build-time env (import.meta.env)
    buildTime: {
      hasUrl: !!import.meta.env.SUPABASE_URL,
      hasKey: !!import.meta.env.SUPABASE_ANON_KEY,
      urlPrefix: import.meta.env.SUPABASE_URL?.substring(0, 30) || 'missing',
    },
    // Cloudflare runtime env
    runtime: {
      hasUrl: !!runtimeEnv?.SUPABASE_URL,
      hasKey: !!runtimeEnv?.SUPABASE_ANON_KEY,
      urlPrefix: runtimeEnv?.SUPABASE_URL?.substring(0, 30) || 'missing',
    },
    query: url.searchParams.get('q') || 'none',
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(envCheck, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
