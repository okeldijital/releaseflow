'use client';

/**
 * BUILD-220C — /my-work → Collaboration Assignments.
 */

import { LegacyCollaborationRedirect } from '@/app/(app)/collaboration/_components/legacy-collaboration-redirect';

export default function MyWorkPage() {
  return <LegacyCollaborationRedirect fromPath="/my-work" />;
}
