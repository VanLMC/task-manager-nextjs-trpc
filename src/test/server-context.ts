import { createTRPCClient } from '@trpc/client';
import { handleTrpcRequest } from '@/server/api-handler';
import { silentLogger } from '@/server/observability/logger';
import { createFixedWindowRateLimiter } from '@/server/rate-limit/fixed-window-rate-limiter';
import { type AppRouter, appRouter } from '@/server/routers/_app';
import { createInMemoryTaskRepository } from '@/server/tasks/in-memory-task.repository';
import { type Context, createCallerFactory } from '@/server/trpc';
import { createHttpLink } from '@/trpc/client';

export function createTestContext(overrides: Partial<Context> = {}): Context {
  return {
    taskRepository: createInMemoryTaskRepository(),
    rateLimiter: createFixedWindowRateLimiter({ limit: 1_000, windowMs: 60_000 }),
    logger: silentLogger,
    clientIp: '203.0.113.10',
    requestId: 'test-request-id',
    ...overrides,
  };
}

export const createCaller = createCallerFactory(appRouter);

export function createInProcessFetch(context: Context): typeof fetch {
  return async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost');
    return handleTrpcRequest(new Request(url, init), () => context);
  };
}

export function createInProcessClient(context: Context) {
  return createTRPCClient<AppRouter>({ links: [createHttpLink(createInProcessFetch(context))] });
}
