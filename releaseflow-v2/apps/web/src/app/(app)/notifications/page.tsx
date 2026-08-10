'use client';

/**
 * BUILD-220C — Legacy list route redirects to /collaboration/inbox.
 */

import { LegacyCollaborationRedirect } from '@/app/(app)/collaboration/_components/legacy-collaboration-redirect';

export default function NotificationsListRedirectPage() {
  return <LegacyCollaborationRedirect fromPath="/notifications" />;
}
