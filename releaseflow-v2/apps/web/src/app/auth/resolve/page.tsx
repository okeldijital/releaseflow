'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getOrganizationsByUser } from '@/lib/organization-repository';
import { acceptInvitationAtomically } from '@/lib/invitation-service';
import { useOrgStore } from '@/stores/org-store';

/**
 * CE-002 — Authentication resolver.
 *
 * Routing is determined primarily by organization memberships.
 * If the user has no memberships but a pending invitation token exists in
 * session storage (from a prior invite flow that was interrupted), we attempt
 * to accept it before falling back to the standard onboarding.
 *
 * Decision matrix:
 *   0 memberships + no pending invitation  → /onboarding (admin flow)
 *   0 memberships + pending invitation     → atomic accept → dashboard
 *   1 membership                           → /dashboard
 *   >1 memberships                         → /select-organization
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
        // No memberships — check for a pending invitation in session storage.
        const pendingToken = typeof window !== 'undefined'
          ? sessionStorage.getItem('invitation_token')
          : null;

        if (pendingToken) {
          sessionStorage.removeItem('invitation_token');
          const result = await acceptInvitationAtomically(pendingToken, {
            uid: user!.uid,
            email: user!.email ?? '',
            displayName: user!.displayName,
          });
          if (cancelled) return;
          if (result.ok) {
            setActiveOrgId(result.invitation.organizationId);
            setOrgsLoaded(true);
            router.replace('/dashboard');
            return;
          }
        }

        // No invitation — standard admin onboarding.
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
