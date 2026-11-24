import 'server-only';

import { createTRPCOptionsProxy, unstable_createHydrateClient } from '@trpc/tanstack-react-query';
import { headers } from 'next/headers';
import { cache } from 'react';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/trpc';
import { makeQueryClient } from './query-client';

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: async () => createContext({ headers: await headers() }),
  router: appRouter,
  queryClient: getQueryClient,
});

export const HydrateClient = unstable_createHydrateClient(getQueryClient);
