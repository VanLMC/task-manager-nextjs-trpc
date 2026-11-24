import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import type { Context } from '@/server/trpc';
import { FeedbackProvider } from '@/shared/feedback/FeedbackProvider';
import { createHttpLink, TRPCReactProvider } from '@/trpc/client';
import { createInProcessFetch, createTestContext } from './server-context';

export function renderWithProviders(ui: ReactElement, context: Context = createTestContext()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const link = createHttpLink(createInProcessFetch(context));
  return {
    user: userEvent.setup(),
    context,
    queryClient,
    ...render(
      <TRPCReactProvider queryClient={queryClient} link={link}>
        <FeedbackProvider>{ui}</FeedbackProvider>
      </TRPCReactProvider>,
    ),
  };
}
