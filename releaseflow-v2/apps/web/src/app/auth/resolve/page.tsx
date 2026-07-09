'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getOrganizationsByUser } from '@/lib/organization-repository';
import { useOrgStore } from '@/stores/org-store';

/**
 * Authentication resolver.
 *
 * Routing is determined exclusively by organization memberships.
 * The `onboardingCompleted` flag is informational only and does not
 * participate in routing decisions.
 *
 * Decision matrix:
 *   0 memberships          → /onboarding
 *   1 membership           → /dashboard
 *   >1 memberships         → /select-organization
 */
export default function AuthResolvePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { setActiveOrgId, setOrgsLoaded } = useOrgStore();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/sign-in');
      return;
    }

    const uid = user.uid;
    let cancelled = false;

    async function resolve() {
      const orgs = await getOrganizationsByUser(uid);
      if (cancelled) return;

      if (orgs.length === 0) {
        // No memberships — new user or account with no org yet.
        router.replace('/onboarding');
        return;
      }

      const persistedOrgId = useOrgStore.getState().activeOrgId;

      if (persistedOrgId && orgs.some((o) => o.id === persistedOrgId)) {
        // Honour the persisted org selection.
        setActiveOrgId(persistedOrgId);
        setOrgsLoaded(true);
        router.replace('/dashboard');
        return;
      }

      if (orgs.length === 1 && orgs[0]) {
        // Exactly one org — select it and go straight to the dashboard.
        setActiveOrgId(orgs[0].id);
        setOrgsLoaded(true);
        router.replace('/dashboard');
        return;
      }

      // Multiple orgs with no valid persisted selection — let the user choose.
      setOrgsLoaded(true);
      router.replace('/select-organization');
    }

    resolve();

    return () => { cancelled = true; };
  }, [user, loading, router, setActiveOrgId, setOrgsLoaded]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950">
      <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
    </div>
  );
}
