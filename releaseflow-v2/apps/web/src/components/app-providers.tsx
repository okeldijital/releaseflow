'use client';

import { type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/contexts/auth-context';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { ToastContainer } from '@/components/toast-container';

const CommandPalette = dynamic(
  () => import('@/components/command-palette').then((mod) => ({ default: mod.CommandPalette })),
  { ssr: false },
);

const PwaBootstrap = dynamic(
  () => import('@/components/pwa/pwa-bootstrap').then((mod) => ({ default: mod.PwaBootstrap })),
  { ssr: false },
);

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CurrentUserProvider>
          <PwaBootstrap />
          {children}
          <ToastContainer />
          <CommandPalette />
        </CurrentUserProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
