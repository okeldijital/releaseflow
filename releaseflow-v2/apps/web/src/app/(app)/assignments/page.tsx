'use client';

/**
 * BUILD-220C — Legacy list route redirects to /collaboration/assignments.
 * Detail: /assignments/[id] and /assignments/new remain.
 */

import { LegacyCollaborationRedirect } from '@/app/(app)/collaboration/_components/legacy-collaboration-redirect';

export default function AssignmentsListRedirectPage() {
  return <LegacyCollaborationRedirect fromPath="/assignments" />;
}
