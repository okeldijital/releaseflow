'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  hasPendingInvitation,
  getInvitationContext,
  getStoredInvitationToken,
} from '@/lib/auth-return';

const FLOW_LOG = '[Invitation Flow]';

/**
 * UAT-005 — Legacy invitation profile step.
 *
 * Profile creation now happens inside acceptInvitationAtomically.
 * This route must never re-enter generic onboarding; bounce invitees
 * back to the invitation accept path or auth resolve.
 */
export default function InvitationOnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasPendingInvitation()) {
      const ctx = getInvitationContext();
      const token = ctx?.token || getStoredInvitationToken();
      const dest = ctx?.returnUrl || (token ? `/invite/${token}` : '/auth/resolve');
      console.log(FLOW_LOG, '· Blocked /onboarding/invitation — completing invite flow instead', {
        reason: 'profile_created_during_accept',
        dest,
      });
      router.replace(dest);
      return;
    }

    // No invite context: send to resolve rather than company wizard.
    console.log(FLOW_LOG, '· /onboarding/invitation without invite context → /auth/resolve');
    router.replace('/auth/resolve');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>
  );
}
