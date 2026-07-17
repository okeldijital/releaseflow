'use client';

/**
 * ARS-003 — legacy contributor dashboard retired.
 * Collaborator operational UI is /home (Assignment Service).
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@releaseflow/ui';

export default function ContributorPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div className="py-16">
      <LoadingState text="Redirecting to Home…" />
    </div>
  );
}
