import { performance } from 'node:perf_hooks';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () => {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();
  const eventLoop = performance.eventLoopUtilization();

  return Response.json(
    {
      status: 'ok',
      uptimeSeconds: process.uptime(),
      memoryBytes: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
        arrayBuffers: memory.arrayBuffers,
      },
      cpuMicroseconds: {
        user: cpu.user,
        system: cpu.system,
      },
      eventLoopUtilization: eventLoop.utilization,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
};
