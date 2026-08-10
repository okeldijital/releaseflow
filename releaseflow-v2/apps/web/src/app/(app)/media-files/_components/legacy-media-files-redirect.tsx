'use client';

/**
 * BUILD-220E — Redirect /assets list to /media-files (query preserved).
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingState } from '@releaseflow/ui';
import { LEGACY_MEDIA_FILES_REDIRECTS } from '@/lib/navigation/legacy-media-files-redirects';

export { LEGACY_MEDIA_FILES_REDIRECTS };

function RedirectInner({ fromPath }: { fromPath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const base = LEGACY_MEDIA_FILES_REDIRECTS[fromPath] ?? '/media-files';

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

export function LegacyMediaFilesRedirect({ fromPath }: { fromPath: string }) {
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
