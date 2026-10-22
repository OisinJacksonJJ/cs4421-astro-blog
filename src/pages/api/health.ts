import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () =>
  Response.json(
    {
      status: 'ok',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    { status: 500 },
  );
