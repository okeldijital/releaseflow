'use client';

/**
 * BUILD-220D — Redirect legacy catalogue list routes to /library/*.
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LoadingState } from '@releaseflow/ui';
import { LEGACY_LIBRARY_REDIRECTS } from '@/lib/navigation/legacy-library-redirects';

export { LEGACY_LIBRARY_REDIRECTS };

function RedirectInner({ fromPath }: { fromPath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const base = LEGACY_LIBRARY_REDIRECTS[fromPath] ?? '/library/tracks';

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `${base}?${qs}` : base);
  }, [router, searchParams, base]);

  return (
    <div className="flex items-center justify-center py-24">
      <LoadingState />
    </div>
  );
}

export function LegacyLibraryRedirect({ fromPath }: { fromPath: string }) {
  return (
    <Suspense
      fallback={(
        <div className="flex items-center justify-center py-24">
          <LoadingState />
        </div>
      )}
    >
      <RedirectInner fromPath={fromPath} />
    </Suspense>
  );
}
