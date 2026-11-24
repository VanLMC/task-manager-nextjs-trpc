import 'server-only';

import { createJsonLogger, type Logger, silentLogger } from './observability/logger';
import {
  createFixedWindowRateLimiter,
  type RateLimiter,
} from './rate-limit/fixed-window-rate-limiter';
import { createInMemoryTaskRepository } from './tasks/in-memory-task.repository';
import { buildSeedTasks, shouldSeedTasks } from './tasks/seed';
import type { TaskRepository } from './tasks/task.repository';

export type Services = {
  taskRepository: TaskRepository;
  rateLimiter: RateLimiter;
  logger: Logger;
};

const DEFAULT_MUTATIONS_PER_MINUTE = 30;
const ONE_MINUTE_MS = 60_000;

export function createServices(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Services {
  return {
    taskRepository: createInMemoryTaskRepository({
      initialTasks: shouldSeedTasks(env) ? buildSeedTasks() : [],
    }),
    rateLimiter: createFixedWindowRateLimiter({
      limit: Number(env.RATE_LIMIT_PER_MINUTE) || DEFAULT_MUTATIONS_PER_MINUTE,
      windowMs: ONE_MINUTE_MS,
    }),
    logger: env.NODE_ENV === 'test' ? silentLogger : createJsonLogger(),
  };
}

// Kept on globalThis so Server Components and the API route handler, which Next.js may bundle
// separately, share one in-memory store per process (and it survives dev hot reloads).
const globalWithServices = globalThis as typeof globalThis & { taskManagerServices?: Services };

export function getServices(): Services {
  globalWithServices.taskManagerServices ??= createServices();
  return globalWithServices.taskManagerServices;
}
