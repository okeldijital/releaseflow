'use client';

import { useEffect, useState } from 'react';
import { applyServiceWorkerUpdate, onSwUpdateAvailable } from '@/lib/pwa/register-sw';
import { Button } from '@releaseflow/ui';

export function SwUpdateBanner() {
  const [available, setAvailable] = useState(false);

  useEffect(() => onSwUpdateAvailable(setAvailable), []);

  if (!available) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] max-w-md w-[calc(100%-2rem)]
        rounded-xl border border-primary-500/40 bg-layer-2 shadow-lg px-4 py-3 flex items-center gap-3"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-surface-100">A new version of ReleaseFlow is available.</p>
        <p className="text-xs text-text-500 mt-0.5">Refresh when you are ready — unfinished work will not be interrupted automatically.</p>
      </div>
      <Button size="sm" onClick={() => void applyServiceWorkerUpdate()}>
        Refresh now
      </Button>
    </div>
  );
}
