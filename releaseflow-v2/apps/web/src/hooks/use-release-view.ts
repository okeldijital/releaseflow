'use client';

import { useEffect, useState } from 'react';

export type ReleaseView = 'grid' | 'list';
const storageKey = 'rf-releases-view';

export function useReleaseView() {
  const [view, setView] = useState<ReleaseView>('grid');

  useEffect(() => {
    function restore() {
      try {
        setView(localStorage.getItem(storageKey) === 'list' ? 'list' : 'grid');
      } catch {
        // Keep the in-memory preference when browser storage is unavailable.
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key === storageKey) restore();
    }

    restore();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function setCompact(compact: boolean) {
    const next = compact ? 'list' : 'grid';
    setView(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The current view still works when persistence is disabled.
    }
  }

  return { view, setCompact };
}
