'use client';

/**
 * BUILD-220C — Legacy list route redirects to /collaboration/people.
 * Detail/new/invitations under /people/* remain.
 */

import { LegacyCollaborationRedirect } from '@/app/(app)/collaboration/_components/legacy-collaboration-redirect';

export default function PeopleListRedirectPage() {
  return <LegacyCollaborationRedirect fromPath="/people" />;
}
