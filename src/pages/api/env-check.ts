import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env;

  return new Response(JSON.stringify({
    hasRuntimeEnv: !!runtimeEnv,
    hasUrl: !!runtimeEnv?.SUPABASE_URL,
    hasKey: !!runtimeEnv?.SUPABASE_ANON_KEY,
    keyLength: runtimeEnv?.SUPABASE_ANON_KEY?.length || 0,
    keyPrefix: runtimeEnv?.SUPABASE_ANON_KEY?.substring(0, 20) || 'missing',
    keySuffix: runtimeEnv?.SUPABASE_ANON_KEY?.slice(-10) || 'missing',
    urlPrefix: runtimeEnv?.SUPABASE_URL?.substring(0, 30) || 'missing',
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
