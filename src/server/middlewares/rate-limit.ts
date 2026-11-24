import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';

const ANONYMOUS_CLIENT = 'anonymous';

export const limitMutationRate = middleware(({ ctx, type, next }) => {
  if (type !== 'mutation') return next();
  if (!ctx.rateLimiter.tryConsume(ctx.clientIp ?? ANONYMOUS_CLIENT)) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many changes in a short time. Please try again in a minute.',
    });
  }
  return next();
});
