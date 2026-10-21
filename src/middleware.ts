import { defineMiddleware } from 'astro:middleware';
import { logJson, requestLogLevel } from './lib/logger';

export const onRequest = defineMiddleware(async ({ request }, next) => {
  const startedAt = performance.now();
  const { method } = request;
  const path = new URL(request.url).pathname;
  let statusCode = 500;

  try {
    const response = await next();
    statusCode = response.status;
    return response;
  } catch (error) {
    logJson('fatal', 'request_failed', {
      method,
      path,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : { name: 'UnknownError', message: String(error) },
    });
    throw error;
  } finally {
    logJson(requestLogLevel(statusCode), 'http_request', {
      method,
      path,
      status: statusCode,
      duration_ms: Number((performance.now() - startedAt).toFixed(2)),
    });
  }
});
