export type LogEvent = Record<string, unknown> & { event: string };

export type Logger = { log(event: LogEvent): void };

export function createJsonLogger(write: (line: string) => void = console.log): Logger {
  return { log: (event) => write(JSON.stringify({ time: new Date().toISOString(), ...event })) };
}

export const silentLogger: Logger = { log: () => {} };
