'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getOrganizationsByUser } from '@/lib/organization-repository';
import { acceptInvitationAtomically } from '@/lib/invitation-service';
import { useOrgStore } from '@/stores/org-store';
import {
  getStoredInvitationToken,
  clearInvitationToken,
  clearAuthReturn,
  consumeAuthReturn,
} from '@/lib/auth-return';

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
      // UAT-002: if we have an invite return path, prefer returning there
      // so acceptance happens on the invite page with full context.
      const returnTo = consumeAuthReturn();
      if (returnTo && returnTo.startsWith('/invite/')) {
        console.log('[Invitation Acceptance] ✓ Auth resolve → restoring invite URL', { returnTo });
        router.replace(returnTo);
        return;
      }

      const orgs = await getOrganizationsByUser(uid);
      if (cancelled) return;

      // Pending invitation token even if user already has other memberships.
      const pendingToken = getStoredInvitationToken();
      if (pendingToken) {
        console.log('[Invitation Acceptance] ✓ Auth resolve attempting token accept', {
          tokenPrefix: pendingToken.slice(0, 8),
          existingOrgs: orgs.length,
        });
        const result = await acceptInvitationAtomically(pendingToken, {
          uid: user!.uid,
          email: user!.email ?? '',
          displayName: user!.displayName,
        });
        if (cancelled) return;
        if (result.ok) {
          clearInvitationToken();
          clearAuthReturn();
          setActiveOrgId(result.invitation.organizationId);
          setOrgsLoaded(true);
          const dest =
            result.invitation.platformRole === 'collaborator' ? '/home' : '/dashboard';
          console.log('[Invitation Acceptance] ✓ Auth resolve accept succeeded', { dest });
          router.replace(dest);
          return;
        }
        console.error('[Invitation Acceptance] ✗ Auth resolve accept failed', {
          reason: result.reason,
          message: result.message,
        });
        // Return to invite page so the user sees the real error / can retry.
        router.replace(`/invite/${pendingToken}`);
        return;
      }

      if (orgs.length === 0) {
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
