'use client';

/**
 * ARS-004.1 — /work no longer surfaces Task entities.
 * Operational work is Assignments only.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@releaseflow/ui';

export default function WorkPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/assignments');
  }, [router]);
  return (
    <div className="py-16">
      <LoadingState text="Redirecting to Assignments…" />
    </div>
  );
}
