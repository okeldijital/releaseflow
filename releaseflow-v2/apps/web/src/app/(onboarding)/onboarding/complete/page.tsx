'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { completeUserOnboarding } from '@/lib/user-profile-repository';
import { useOrgStore } from '@/stores/org-store';
import { OnboardingBrandBar } from '@/components/branding/onboarding-brand-bar';

export default function CompletePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const companyId = params.get('companyId') ?? '';
  const role = params.get('role') ?? '';
  const category = params.get('category') ?? 'creative';
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push('/sign-in'); return; }
    if (user && !done) {
      setDone(true);
      saveAndRoute();
    }
  }, [user, loading, done]);

  async function saveAndRoute() {
    if (!user) return;
    try {
      await completeUserOnboarding(user.uid, {
        role,
        roleCategory: category,
        defaultOrganizationId: companyId || null,
      });
    } catch { /* best effort */ }

    // BUG-009B: bind active org so Save Draft / draft list work immediately after onboarding.
    if (companyId) {
      useOrgStore.getState().setActiveOrgId(companyId);
      useOrgStore.getState().setOrgsLoaded(true);
    }

    setTimeout(() => router.replace('/dashboard'), 1500);
  }

  if (loading || !user) return null;

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i}
            className={`block rounded-full transition-all duration-500 ${
              i < 3 ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
              : 'h-2.5 w-2.5 bg-primary-500 animate-pulse'
            }`} />
        ))}
      </div>

      <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/15">
        <svg className="h-8 w-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-display-md font-semibold tracking-tight text-primary-400">You&apos;re all set.</h1>
      <p className="mt-2 text-sm text-text-400">Your workspace is ready.</p>

      <button
        onClick={() => router.replace('/dashboard')}
        className="mt-10 w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)] animate-scale-in">
        Continue to ReleaseFlow
      </button>

            <OnboardingBrandBar />
    </div>
  );
}
