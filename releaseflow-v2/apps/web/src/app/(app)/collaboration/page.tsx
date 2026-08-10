'use client';

/**
 * BUILD-220C — Collaboration module entry.
 * Default tab: Assignments (primary operational workspace).
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@releaseflow/ui';

export default function CollaborationIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/collaboration/assignments');
  }, [router]);
  return (
    <div className="flex items-center justify-center py-24">
      <LoadingState />
    </div>
  );
}
