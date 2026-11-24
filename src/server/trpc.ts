import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError, z } from 'zod';
import type { Services } from './services';

export type Context = Services & {
  clientIp: string | null;
  requestId: string;
};

export const INTERNAL_ERROR_MESSAGE = 'Something went wrong on our side. Please try again.';

// The app runs behind a single trusted proxy, which appends the address it saw as the last
// entry. Earlier entries are supplied by the client and can be spoofed.
function readClientIp(headers: Headers): string | null {
  return headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || null;
}

export function readRequestMetadata(headers: Headers): Pick<Context, 'clientIp' | 'requestId'> {
  return {
    clientIp: readClientIp(headers),
    requestId: headers.get('x-request-id') ?? crypto.randomUUID(),
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const fieldErrors =
      error.cause instanceof ZodError ? z.flattenError(error.cause).fieldErrors : null;
    const message = error.code === 'INTERNAL_SERVER_ERROR' ? INTERNAL_ERROR_MESSAGE : shape.message;
    return { ...shape, message, data: { ...shape.data, fieldErrors } };
  },
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
