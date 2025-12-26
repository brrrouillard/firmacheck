import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  const pathname = context.url.pathname;

  // Static assets - long cache
  if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return response;
  }

  // API routes - no cache
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }

  // HTML pages - stale-while-revalidate pattern
  // Browser: 1 min, CDN: 1 hour, stale for 1 day
  response.headers.set(
    'Cache-Control',
    'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400'
  );

  return response;
});
