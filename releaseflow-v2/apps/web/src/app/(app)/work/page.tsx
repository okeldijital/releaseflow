'use client';

/**
 * ARS-004.1 / BUILD-220C — /work → Collaboration Assignments.
 */

import { LegacyCollaborationRedirect } from '@/app/(app)/collaboration/_components/legacy-collaboration-redirect';

export default function WorkPage() {
  return <LegacyCollaborationRedirect fromPath="/work" />;
}
