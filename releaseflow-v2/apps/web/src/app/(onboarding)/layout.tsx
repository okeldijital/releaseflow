'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  hasPendingInvitation,
  getStoredInvitationToken,
  getInvitationNavigationState,
} from '@/lib/auth-return';

const FLOW_LOG = '[Invitation Flow]';

/**
 * UAT-005 / ARCH-001 — Onboarding layout.
 * When an invitation token is pending, never show generic onboarding.
 * Business data is not read from session — only the token for navigation.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
      return;
    }

    if (loading || !user) return;

    if (hasPendingInvitation()) {
      const nav = getInvitationNavigationState();
      const token = nav?.token || getStoredInvitationToken();
      const invitePath = nav?.returnUrl || (token ? `/invite/${token}` : '/auth/resolve');
      console.log(FLOW_LOG, '· Blocked generic onboarding — invitation token present', {
        reason: 'pending_invitation_takes_precedence',
        invitePath,
        tokenPrefix: token?.slice(0, 8),
      });
      router.replace(invitePath);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (hasPendingInvitation()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-950 text-surface-50">
      <div className="relative flex-1 flex items-center justify-center px-6 py-16">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(204,85,0,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 w-full max-w-md animate-scale-in">
          {children}
        </div>
      </div>
    </div>
  );
}
