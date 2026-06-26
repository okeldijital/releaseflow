'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { ToastContainer } from '@/components/toast-container';
import { CommandPalette } from '@/components/command-palette';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
        <ToastContainer />
        <CommandPalette />
      </AuthProvider>
    </ErrorBoundary>
  );
}
