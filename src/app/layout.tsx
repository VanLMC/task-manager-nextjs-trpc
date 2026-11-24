import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppProviders } from '@/shared/ui/AppProviders';

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'A simple task manager built with Next.js and tRPC.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <AppProviders>{children}</AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
