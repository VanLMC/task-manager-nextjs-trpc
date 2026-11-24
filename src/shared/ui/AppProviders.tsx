'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { FeedbackProvider } from '@/shared/feedback/FeedbackProvider';
import { TRPCReactProvider } from '@/trpc/client';
import { theme } from './theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <TRPCReactProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </TRPCReactProvider>
    </ThemeProvider>
  );
}
