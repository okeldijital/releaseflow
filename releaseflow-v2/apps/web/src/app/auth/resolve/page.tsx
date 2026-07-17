'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getOrganizationsByUser } from '@/lib/organization-repository';
import { acceptInvitationAtomically } from '@/lib/invitation-service';
import { useOrgStore } from '@/stores/org-store';
import {
  getStoredInvitationToken,
  hasPendingInvitation,
  clearInvitationContext,
  consumeAuthReturn,
  collaboratorWorkspacePath,
} from '@/lib/auth-return';
import { generateNotificationEvent } from '@/lib/notification-event-service';

const FLOW_LOG = '[Invitation Flow]';

/**
 * CE-002 / UAT-005 / ARCH-001 — Authentication resolver.
 *
 * Invitation-aware routing ALWAYS takes precedence over generic onboarding.
 * Only the invitation token is restored from the browser; org/roles come from
 * Firestore via acceptInvitationAtomically (single source of truth).
 *
 *   if (pendingInvitationToken) {
 *     completeInvitationFlow()  // fetch + validate + accept from Firestore
 *   } else {
 *     continueStandardOnboarding()
 *   }
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
      // Prefer returning to invite page so acceptance happens with full UI context.
      const returnTo = consumeAuthReturn();
      if (returnTo && returnTo.startsWith('/invite/')) {
        console.log(FLOW_LOG, '✓ Token restored → invite URL', { returnTo });
        router.replace(returnTo);
        return;
      }

      const token = getStoredInvitationToken();
      if (token || hasPendingInvitation()) {
        if (!token) {
          console.log(FLOW_LOG, '· Pending flag without token — continuing standard routing');
        } else {
          console.log(FLOW_LOG, '✓ Token restored', { tokenPrefix: token.slice(0, 8) });
          console.log(FLOW_LOG, '✓ User authenticated', { uid: user!.uid, email: user!.email });

          // ARCH-001: accept reloads invitation from Firestore (not session).
          const result = await acceptInvitationAtomically(token, {
            uid: user!.uid,
            email: user!.email ?? '',
            displayName: user!.displayName,
          });
          if (cancelled) return;

          if (result.ok) {
            console.log(FLOW_LOG, '✓ Membership created');
            console.log(FLOW_LOG, '✓ Roles assigned', {
              platformRole: result.invitation.platformRole,
              professionalRole: result.invitation.professionalRole,
              source: 'firestore',
            });
            console.log(FLOW_LOG, '✓ Invitation accepted');

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
          router.replace(`/invite/${token}`);
          return;
        }
      }

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
