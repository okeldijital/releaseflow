'use client';

/**
 * BUILD-220F — Redirect legacy schedule list routes to /calendar/*.
 * Query string is preserved (e.g. /schedule?date=… → /calendar/schedule?date=…).
 */

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingState } from '@releaseflow/ui';
import { LEGACY_CALENDAR_REDIRECTS } from '@/lib/navigation/legacy-calendar-redirects';

export { LEGACY_CALENDAR_REDIRECTS };

function RedirectInner({ fromPath }: { fromPath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const base = LEGACY_CALENDAR_REDIRECTS[fromPath] ?? '/calendar/schedule';

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

export function LegacyCalendarRedirect({ fromPath }: { fromPath: string }) {
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
