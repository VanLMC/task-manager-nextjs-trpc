import { middleware } from '../trpc';

export const logRequests = middleware(async ({ ctx, path, type, next }) => {
  const startedAt = performance.now();
  const result = await next();
  ctx.logger.log({
    event: 'trpc.request',
    requestId: ctx.requestId,
    path,
    type,
    durationMs: Math.round(performance.now() - startedAt),
    ok: result.ok,
    ...(result.ok ? {} : { code: result.error.code }),
  });
  return result;
});
