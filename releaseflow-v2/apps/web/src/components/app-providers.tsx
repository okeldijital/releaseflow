'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
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

const SearchContext = createContext<() => void>(() => undefined);
export const useOpenWorkspaceSearch = () => useContext(SearchContext);

export function AppProviders({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CurrentUserProvider>
          <PwaBootstrap />
          <SearchContext.Provider value={() => setSearchOpen(true)}>{children}</SearchContext.Provider>
          <ToastContainer />
          <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
        </CurrentUserProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
