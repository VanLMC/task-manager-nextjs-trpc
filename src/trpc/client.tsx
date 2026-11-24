'use client';

import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink, type TRPCLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { type ReactNode, useState } from 'react';
import superjson from 'superjson';
import type { AppRouter } from '@/server/routers/_app';
import { makeQueryClient } from './query-client';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function createHttpLink(fetchImpl?: typeof fetch): TRPCLink<AppRouter> {
  return httpBatchLink({ url: '/api/trpc', transformer: superjson, fetch: fetchImpl });
}

type TRPCReactProviderProps = {
  children: ReactNode;
  queryClient?: QueryClient;
  link?: TRPCLink<AppRouter>;
};

export function TRPCReactProvider({ children, queryClient, link }: TRPCReactProviderProps) {
  const [client] = useState(() => queryClient ?? getQueryClient());
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({ links: [link ?? createHttpLink()] }),
  );

  return (
    <QueryClientProvider client={client}>
      <TRPCProvider trpcClient={trpcClient} queryClient={client}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
