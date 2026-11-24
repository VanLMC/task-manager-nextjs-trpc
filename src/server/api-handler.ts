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
    onError: ({ error, path, ctx }) => {
      if (error.code !== 'INTERNAL_SERVER_ERROR') return;
      ctx?.logger.log({
        event: 'trpc.internal_error',
        requestId: ctx.requestId,
        path,
        message: error.message,
      });
    },
    responseMeta: ({ ctx }) => ({
      headers: ctx ? new Headers({ 'x-request-id': ctx.requestId }) : undefined,
    }),
  });
}
