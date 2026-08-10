'use client';

/**
 * BUILD-220B — Redirect legacy query lifecycle URLs to path-based tabs.
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const LEGACY_LIFECYCLE_REDIRECT: Record<string, string> = {
  draft: '/releases/draft',
  active: '/releases/active',
  archived: '/releases/archived',
};

export function LegacyLifecycleRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lifecycle = searchParams.get('lifecycle');

  useEffect(() => {
    if (!lifecycle) return;
    const target = LEGACY_LIFECYCLE_REDIRECT[lifecycle];
    if (target) router.replace(target);
  }, [lifecycle, router]);

  if (lifecycle && LEGACY_LIFECYCLE_REDIRECT[lifecycle]) {
    return null;
  }

  return null;
}

export function shouldRedirectLegacyLifecycle(lifecycle: string | null): string | null {
  if (!lifecycle) return null;
  return LEGACY_LIFECYCLE_REDIRECT[lifecycle] ?? null;
}
