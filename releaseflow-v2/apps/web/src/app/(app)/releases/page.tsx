'use client';

/**
 * BUILD-220B — Releases root (All) + legacy lifecycle query redirects.
 *
 * /releases?lifecycle=draft|active|archived → /releases/{lifecycle}
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReleasesModule } from './_components/releases-module';
import { shouldRedirectLegacyLifecycle } from './_components/legacy-lifecycle-redirect';

function ReleasesAllWithLegacyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lifecycle = searchParams.get('lifecycle');
  const redirectTo = shouldRedirectLegacyLifecycle(lifecycle);

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (redirectTo) return null;

  return <ReleasesModule tab="all" />;
}

export default function ReleasesPage() {
  return (
    <Suspense fallback={<ReleasesModule tab="all" />}>
      <ReleasesAllWithLegacyRedirect />
    </Suspense>
  );
}
