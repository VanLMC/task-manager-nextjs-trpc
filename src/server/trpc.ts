import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError, z } from 'zod';
import type { Services } from './services';

export type Context = Services & {
  clientIp: string | null;
  requestId: string;
};

export function readRequestMetadata(headers: Headers): Pick<Context, 'clientIp' | 'requestId'> {
  return {
    clientIp: headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    requestId: headers.get('x-request-id') ?? crypto.randomUUID(),
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const fieldErrors =
      error.cause instanceof ZodError ? z.flattenError(error.cause).fieldErrors : null;
    return { ...shape, data: { ...shape.data, fieldErrors } };
  },
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
