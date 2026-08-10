'use client';

/**
 * BUILD-220D — Library module entry.
 * Default tab: Tracks.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@releaseflow/ui';

export default function LibraryIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/library/tracks');
  }, [router]);
  return (
    <div className="flex items-center justify-center py-24">
      <LoadingState />
    </div>
  );
}
