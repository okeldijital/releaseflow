'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  hasPendingInvitation,
  getInvitationNavigationState,
  getStoredInvitationToken,
} from '@/lib/auth-return';

const FLOW_LOG = '[Invitation Flow]';

/**
 * UAT-005 / ARCH-001 — Legacy invitation profile step.
 * Profile is created during accept from Firestore invitation data.
 * Resume via token only — never business fields from sessionStorage.
 */
export default function InvitationOnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasPendingInvitation()) {
      const nav = getInvitationNavigationState();
      const token = nav?.token || getStoredInvitationToken();
      const dest = nav?.returnUrl || (token ? `/invite/${token}` : '/auth/resolve');
      console.log(FLOW_LOG, '· Blocked /onboarding/invitation — resume via token', {
        reason: 'profile_created_during_accept',
        dest,
        tokenPrefix: token?.slice(0, 8),
      });
      router.replace(dest);
      return;
    }

    console.log(FLOW_LOG, '· /onboarding/invitation without invite token → /auth/resolve');
    router.replace('/auth/resolve');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>
  );
}
