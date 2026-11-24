export type RateLimiter = { tryConsume(key: string): boolean };

type FixedWindowOptions = { limit: number; windowMs: number; now?: () => number };

type Window = { startedAt: number; count: number };

const PRUNE_THRESHOLD = 1_000;

export function createFixedWindowRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: FixedWindowOptions): RateLimiter {
  const windows = new Map<string, Window>();

  const isExpired = (window: Window, at: number) => at - window.startedAt >= windowMs;

  const pruneExpiredWindows = (at: number) => {
    for (const [key, window] of windows) {
      if (isExpired(window, at)) windows.delete(key);
    }
  };

  return {
    tryConsume(key) {
      const at = now();
      if (windows.size > PRUNE_THRESHOLD) pruneExpiredWindows(at);
      const window = windows.get(key);
      if (!window || isExpired(window, at)) {
        windows.set(key, { startedAt: at, count: 1 });
        return true;
      }
      if (window.count >= limit) return false;
      window.count += 1;
      return true;
    },
  };
}
