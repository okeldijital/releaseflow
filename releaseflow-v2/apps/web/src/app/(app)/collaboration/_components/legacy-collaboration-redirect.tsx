'use client';

/**
 * BUILD-220C — Redirect legacy Collaboration list routes to canonical paths.
 * Detail routes (/assignments/[id], /tasks/[id], /people/[id]) are unchanged.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@releaseflow/ui';
import { LEGACY_COLLABORATION_REDIRECTS } from '@/lib/navigation/legacy-collaboration-redirects';

export { LEGACY_COLLABORATION_REDIRECTS };

export function LegacyCollaborationRedirect({
  fromPath,
}: {
  fromPath: string;
}) {
  const router = useRouter();
  const target =
    LEGACY_COLLABORATION_REDIRECTS[fromPath] ?? '/collaboration/assignments';

  useEffect(() => {
    router.replace(target);
  }, [router, target]);

  return (
    <div className="flex items-center justify-center py-24">
      <LoadingState />
    </div>
  );
}
