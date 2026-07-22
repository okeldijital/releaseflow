'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { createUserProfile } from '@/lib/user-profile-repository';
import {
  hasPendingInvitation,
  getInvitationNavigationState,
  getStoredInvitationToken,
} from '@/lib/auth-return';
import { OnboardingBrandBar } from '@/components/branding/onboarding-brand-bar';

const FLOW_LOG = '[Invitation Flow]';

function inviteResumePath(): string {
  const nav = getInvitationNavigationState();
  const token = nav?.token || getStoredInvitationToken();
  return nav?.returnUrl || (token ? `/invite/${token}` : '/auth/resolve');
}

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // UAT-005 / ARCH-001: never run generic onboarding when invitation token is pending.
  useEffect(() => {
    if (loading || !user) return;
    if (!hasPendingInvitation()) return;
    const dest = inviteResumePath();
    console.log(FLOW_LOG, '· Blocked welcome/onboarding — invitation token present', {
      reason: 'pending_invitation_takes_precedence',
      dest,
    });
    router.replace(dest);
  }, [user, loading, router]);

  if (loading || !user) return null;
  if (hasPendingInvitation()) return null;

  // Bootstrap only: seed users/{uid} from Auth email (identity lives on profile after).
  const email = user.email ?? '';
  const displayName = email.split('@')[0] || 'User';
  const avatarUrl: string | null = null;
  const initials = displayName.charAt(0).toUpperCase();

  async function handleContinue() {
    if (hasPendingInvitation()) {
      router.replace(inviteResumePath());
      return;
    }
    setSaving(true);
    try {
      await createUserProfile(user!.uid, { displayName, email, avatarUrl });
    } catch { /* best effort */ }
    router.push('/onboarding/company');
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className={`block rounded-full transition-all duration-500 ${
            i === 0 ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
            : i === 1 ? 'h-2 w-2 bg-primary-500/60'
            : 'h-1.5 w-1.5 bg-surface-700'
          }`} />
        ))}
      </div>

      <h1 className="text-display-md font-semibold tracking-tight text-primary-400">Welcome to ReleaseFlow</h1>
      <p className="mt-2 text-sm text-text-400">Let&apos;s confirm your identity and get started.</p>

      <div className="mt-10 flex justify-center">
        <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-surface-700">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-surface-800 text-2xl font-semibold text-text-300">{initials}</span>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-3 text-left">
        <div>
          <span className="block text-xs font-medium text-text-500 uppercase tracking-wider mb-1">Name</span>
          <p className="text-body text-surface-100">{displayName}</p>
        </div>
        <div>
          <span className="block text-xs font-medium text-text-500 uppercase tracking-wider mb-1">Email</span>
          <p className="text-body text-surface-100">{email}</p>
        </div>
      </div>

      <button onClick={handleContinue} disabled={saving}
        className="mt-10 w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-60 transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]">
        {saving ? 'Setting up...' : 'Continue'}
      </button>

      <p className="mt-6 text-xs text-text-500">You can change these later in Administration.</p>

      <OnboardingBrandBar />
    </div>
  );
}
