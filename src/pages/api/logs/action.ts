import type { APIRoute } from 'astro';
import { logJson } from '../../../lib/logger';

export const prerender = false;

const actionTargets = new Set(['A', 'BUTTON', 'FORM', 'INPUT', 'role=button']);

function isActionPayload(
  value: unknown,
): value is { action: 'click' | 'submit'; path: string; target: string } {
  if (typeof value !== 'object' || value === null) return false;

  const payload = value as Record<string, unknown>;
  return (
    (payload.action === 'click' || payload.action === 'submit') &&
    typeof payload.path === 'string' &&
    payload.path.length <= 256 &&
    payload.path.startsWith('/') &&
    !/[?#\r\n]/.test(payload.path) &&
    typeof payload.target === 'string' &&
    actionTargets.has(payload.target)
  );
}

export const POST: APIRoute = async ({ request }) => {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 2048) {
    return new Response(null, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!isActionPayload(payload)) {
    return new Response(null, { status: 400 });
  }

  logJson('action', 'user_action', {
    action: payload.action,
    path: payload.path,
    target: payload.target,
  });
  return new Response(null, { status: 204 });
};
