'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getOrganizationsByUser } from '@/lib/organization-repository';
import { acceptInvitationAtomically } from '@/lib/invitation-service';
import { useOrgStore } from '@/stores/org-store';
import {
  getStoredInvitationToken,
  getInvitationContext,
  hasPendingInvitation,
  clearInvitationContext,
  consumeAuthReturn,
  collaboratorWorkspacePath,
} from '@/lib/auth-return';
import { generateNotificationEvent } from '@/lib/notification-event-service';

const FLOW_LOG = '[Invitation Flow]';

/**
 * CE-002 / UAT-005 — Authentication resolver.
 *
 * Invitation-aware routing ALWAYS takes precedence over generic onboarding:
 *
 *   if (pendingInvitation) {
 *     completeInvitationFlow()  // never company selection
 *   } else {
 *     continueStandardOnboarding()
 *   }
 *
 * Decision matrix:
 *   pending invitation (any membership count) → accept → collaborator workspace
 *   invite return URL                         → /invite/[token]
 *   0 memberships + no invitation             → /onboarding (admin only)
 *   1 membership                              → /dashboard
 *   >1 memberships                            → /select-organization
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
      // ── UAT-005: invitation flow always wins ──────────────────────────
      const returnTo = consumeAuthReturn();
      if (returnTo && returnTo.startsWith('/invite/')) {
        console.log(FLOW_LOG, '✓ Invitation context restored → invite URL', { returnTo });
        router.replace(returnTo);
        return;
      }

      const pendingToken = getStoredInvitationToken();
      if (pendingToken || hasPendingInvitation()) {
        const token = pendingToken || getInvitationContext()?.token;
        if (!token) {
          console.log(FLOW_LOG, '· Pending flag without token — continuing standard routing');
        } else {
          const ctx = getInvitationContext();
          console.log(FLOW_LOG, '✓ Invitation context restored', {
            tokenPrefix: token.slice(0, 8),
            organizationId: ctx?.organizationId,
            platformRole: ctx?.platformRole,
          });
          console.log(FLOW_LOG, '✓ User authenticated', { uid: user!.uid, email: user!.email });

          const result = await acceptInvitationAtomically(token, {
            uid: user!.uid,
            email: user!.email ?? '',
            displayName: user!.displayName,
          });
          if (cancelled) return;

          if (result.ok) {
            console.log(FLOW_LOG, '✓ Membership created');
            console.log(FLOW_LOG, '✓ Platform role assigned', {
              platformRole: result.invitation.platformRole,
            });
            console.log(FLOW_LOG, '✓ Professional role assigned', {
              professionalRole: result.invitation.professionalRole,
            });
            console.log(FLOW_LOG, '✓ Invitation accepted');
            console.log(FLOW_LOG, '✓ User profile created');

            try {
              await generateNotificationEvent({
                type: 'invitation.accepted',
                organizationId: result.invitation.organizationId,
                actorId: user!.uid,
                recipientId: result.invitation.invitedByUserId,
                entityId: result.invitation.id,
                entityType: 'invitation',
                metadata: {
                  inviteeEmail: result.invitation.inviteeEmail,
                  platformRole: result.invitation.platformRole,
                  professionalRole: result.invitation.professionalRole,
                },
              });
              console.log(FLOW_LOG, '✓ Notification event generated');
            } catch (notifyErr) {
              console.warn(FLOW_LOG, '· Notification event generation failed (non-blocking)', notifyErr);
            }

            clearInvitationContext();
            setActiveOrgId(result.invitation.organizationId);
            setOrgsLoaded(true);
            const dest = collaboratorWorkspacePath(result.invitation.platformRole);
            console.log(FLOW_LOG, '✓ Redirecting to collaborator workspace', { dest });
            router.replace(dest);
            return;
          }

          console.error(FLOW_LOG, '✗ Auth resolve accept failed', {
            reason: result.reason,
            message: result.message,
          });
          // Return to invite page so the user sees the real error / can retry.
          router.replace(`/invite/${token}`);
          return;
        }
      }

      // ── Standard routing (no invitation context) ──────────────────────
      const orgs = await getOrganizationsByUser(uid);
      if (cancelled) return;

      if (orgs.length === 0) {
        console.log(FLOW_LOG, '· Branching to generic onboarding', {
          reason: 'no_pending_invitation_and_zero_memberships',
          uid,
        });
        router.replace('/onboarding');
        return;
      }

      const persistedOrgId = useOrgStore.getState().activeOrgId;

      if (persistedOrgId && orgs.some((o) => o.id === persistedOrgId)) {
        setActiveOrgId(persistedOrgId);
        setOrgsLoaded(true);
        router.replace('/dashboard');
        return;
      }

      if (orgs.length === 1 && orgs[0]) {
        setActiveOrgId(orgs[0].id);
        setOrgsLoaded(true);
        router.replace('/dashboard');
        return;
      }

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
