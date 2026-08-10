'use client';

/**
 * BUILD-220C — Legacy list route redirects to /collaboration/tasks.
 * Preserves query string (e.g. ?filter=overdue) on redirect.
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LoadingState } from '@releaseflow/ui';

function TasksListRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    const target = qs
      ? `/collaboration/tasks?${qs}`
      : '/collaboration/tasks';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center py-24">
      <LoadingState />
    </div>
  );
}

export default function TasksListRedirectPage() {
  return (
    <Suspense
      fallback={(
        <div className="flex items-center justify-center py-24">
          <LoadingState />
        </div>
      )}
    >
      <TasksListRedirectInner />
    </Suspense>
  );
}
