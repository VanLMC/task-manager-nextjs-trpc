import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { NONCE_HEADER } from '@/server/security/content-security-policy';
import { AppProviders } from '@/shared/ui/AppProviders';

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'A simple task manager built with Next.js and tRPC.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined;

  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ key: 'mui', nonce }}>
          <AppProviders>{children}</AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
