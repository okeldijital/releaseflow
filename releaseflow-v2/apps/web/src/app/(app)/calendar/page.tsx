'use client';

/**
 * BUILD-220F — Calendar module entry.
 * Default tab: Schedule.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@releaseflow/ui';

export default function CalendarIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/calendar/schedule');
  }, [router]);
  return (
    <div className="flex items-center justify-center py-24">
      <LoadingState />
    </div>
  );
}
