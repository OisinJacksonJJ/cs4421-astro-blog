export type LogLevel = 'info' | 'warn' | 'error' | 'fatal' | 'action';

export function requestLogLevel(status: number): 'info' | 'warn' | 'error' {
  if (status >= 500) return 'error';
  if (status >= 400) return 'warn';
  return 'info';
}

export function logJson(
  level: LogLevel,
  event: string,
  details: Record<string, unknown> = {},
): void {
  console.log(
    JSON.stringify({
      ...details,
      timestamp: new Date().toISOString(),
      level,
      event,
    }),
  );
}
