'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa/register-sw';
import { initInstallPrompt } from '@/lib/pwa/install';
import { initConnectivityListeners } from '@/lib/pwa/connectivity';
import { registerDefaultOfflineHandlers } from '@/lib/pwa/offline-handlers';
import { ConnectionStatusBanner } from './connection-status-banner';
import { SwUpdateBanner } from './sw-update-banner';

/**
 * Client-only PWA bootstrap: SW, install prompt, connectivity, offline handlers.
 */
export function PwaBootstrap() {
  useEffect(() => {
    registerDefaultOfflineHandlers();
    const unsubInstall = initInstallPrompt();
    const unsubConn = initConnectivityListeners();
    void registerServiceWorker();
    return () => {
      unsubInstall();
      unsubConn();
    };
  }, []);

  return (
    <>
      <ConnectionStatusBanner />
      <SwUpdateBanner />
    </>
  );
}
