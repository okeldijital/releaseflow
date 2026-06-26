'use client';

import { useEffect, useState } from 'react';

export function useUnsavedChanges(hasChanges: boolean) {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!hasChanges) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  return { showWarning, setShowWarning };
}

export function useKeyShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      for (const [key, fn] of Object.entries(shortcuts)) {
        const parts = key.split('+');
        const needsMod = parts.includes('mod');
        const keyPart = parts.filter((p) => p !== 'mod')[0];
        if (needsMod && mod && e.key.toLowerCase() === keyPart) {
          e.preventDefault();
          fn();
        } else if (!needsMod && e.key.toLowerCase() === keyPart && !mod) {
          fn();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
