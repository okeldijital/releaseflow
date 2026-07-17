'use client';

import { useEffect, useState } from 'react';
import { canInstallApp, isStandaloneDisplay, onCanInstall, promptInstall } from '@/lib/pwa/install';
import { Button } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';

export function InstallButton({ variant = 'default' }: { variant?: 'default' | 'menu' }) {
  const [canInstall, setCanInstall] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    return onCanInstall(setCanInstall);
  }, []);

  if (standalone) {
    if (variant === 'menu') {
      return <p className="text-xs text-text-500 px-1">Installed as app</p>;
    }
    return null;
  }

  if (!canInstall && !canInstallApp()) {
    if (variant === 'menu') {
      return (
        <p className="text-xs text-text-500 px-1">
          Use your browser menu to install ReleaseFlow when available.
        </p>
      );
    }
    return null;
  }

  const onClick = async () => {
    const result = await promptInstall();
    if (result === 'accepted') toast.success('ReleaseFlow installed');
    else if (result === 'unavailable') toast.error('Install is not available in this browser yet');
  };

  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={() => void onClick()}
        className="w-full text-left text-sm text-surface-100 hover:text-primary-400 py-2"
      >
        Install ReleaseFlow
      </button>
    );
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => void onClick()}>
      Install ReleaseFlow
    </Button>
  );
}
