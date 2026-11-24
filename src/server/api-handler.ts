import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './routers/_app';
import type { Context } from './trpc';

export const TRPC_ENDPOINT = '/api/trpc';

export function handleTrpcRequest(request: Request, createContext: () => Context) {
  return fetchRequestHandler({
    endpoint: TRPC_ENDPOINT,
    req: request,
    router: appRouter,
    createContext,
    responseMeta: ({ ctx }) => ({
      headers: ctx ? new Headers({ 'x-request-id': ctx.requestId }) : undefined,
    }),
  });
}
