import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ request }, next) => {
  const startedAt = performance.now();
  let statusCode = 500;

  try {
    const response = await next();
    statusCode = response.status;
    return response;
  } finally {
    console.log(
      JSON.stringify({
        event: 'http_request',
        timestamp: new Date().toISOString(),
        method: request.method,
        path: new URL(request.url).pathname,
        status: statusCode,
        duration_ms: Number((performance.now() - startedAt).toFixed(2)),
      }),
    );
  }
});
