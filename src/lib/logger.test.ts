import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../pages/api/logs/action';
import { logJson, requestLogLevel } from './logger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('JSON logger', () => {
  it.each([
    ['info', 'info'],
    ['warning', 'warn'],
    ['error', 'error'],
    ['fatal error', 'fatal'],
    ['user action', 'action'],
  ] as const)('writes %s as a JSON record', (_description, level) => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});

    logJson(level, 'test_event', { detail: 'visible' });

    expect(output).toHaveBeenCalledOnce();
    expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({
      level,
      event: 'test_event',
      detail: 'visible',
    });
    expect(JSON.parse(output.mock.calls[0][0]).timestamp).toEqual(expect.any(String));
  });

  it.each([
    [200, 'info'],
    [404, 'warn'],
    [500, 'error'],
  ] as const)('assigns the %s request to the %s level', (status, expectedLevel) => {
    expect(requestLogLevel(status)).toBe(expectedLevel);
  });
});

describe('action log endpoint', () => {
  it('logs only validated action metadata as JSON', async () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    const request = new Request('http://localhost/api/logs/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'click',
        path: '/blog/a-story/',
        target: 'A',
        text: 'not logged',
      }),
    });

    const response = await POST({ request } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(204);
    expect(output).toHaveBeenCalledOnce();
    expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({
      level: 'action',
      event: 'user_action',
      action: 'click',
      path: '/blog/a-story/',
      target: 'A',
    });
    expect(output.mock.calls[0][0]).not.toContain('not logged');
  });

  it('rejects invalid action payloads without logging an action', async () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    const request = new Request('http://localhost/api/logs/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'click',
        path: '/blog/story/?email=private@example.com',
        target: 'A',
      }),
    });

    const response = await POST({ request } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(400);
    expect(output).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    const request = new Request('http://localhost/api/logs/action', {
      method: 'POST',
      body: '{',
    });

    const response = await POST({ request } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(400);
  });
});
