'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { FeedbackProvider } from '@/shared/feedback/FeedbackProvider';
import { TRPCReactProvider } from '@/trpc/client';
import { SkipLink } from './SkipLink';
import { theme } from './theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <SkipLink />
      <TRPCReactProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </TRPCReactProvider>
    </ThemeProvider>
  );
}
