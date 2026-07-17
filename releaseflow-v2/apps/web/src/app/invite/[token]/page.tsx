'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { validateInvitation, acceptInvitationAtomically } from '@/lib/invitation-service';
import { PLATFORM_ROLE_LABELS } from '@/lib/platform-roles';
import type { AtomicAcceptError, InvitationRecord } from '@/lib/invitation-service';
import {
  storeInvitationToken,
  clearInvitationContext,
  collaboratorWorkspacePath,
} from '@/lib/auth-return';
import { useOrgStore } from '@/stores/org-store';
import { generateNotificationEvent } from '@/lib/notification-event-service';

interface InviteState {
  status: 'loading' | 'valid' | 'accepting' | 'accepted' | 'invalid' | 'expired' | 'revoked' | 'error';
  message: string;
}

const FLOW_LOG = '[Invitation Flow]';

const ERROR_ROUTES: Record<AtomicAcceptError, string> = {
  not_found: '/invitation-error/invalid-token',
  expired: '/invitation-error/expired',
  revoked: '/invitation-error/revoked',
  accepted: '/invitation-error/already-accepted',
  invalid: '/invitation-error/invalid-token',
  email_mismatch: '/invitation-error/email-mismatch',
  org_not_found: '/invitation-error/organization-not-found',
};

function getRedirectFromError(reason: AtomicAcceptError): string {
  return ERROR_ROUTES[reason] ?? '/invitation-error/invalid-token';
}

function parseInviteToken(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { setActiveOrgId, setOrgsLoaded } = useOrgStore();
  const token = params?.token as string;
  const [state, setState] = useState<InviteState>({ status: 'loading', message: 'Verifying invitation...' });
  const [invitation, setInvitation] = useState<InvitationRecord | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [verifyAttempt, setVerifyAttempt] = useState(0);
  const acceptStarted = useRef(false);

  useEffect(() => {
    if (!token) {
      console.error(FLOW_LOG, '✗ No token in route params');
      setState({ status: 'invalid', message: 'This invitation link is invalid.' });
      return;
    }

    const parsedToken = parseInviteToken(token);

    console.log(FLOW_LOG, '· Verification started', {
      rawLength: token.length,
      parsedLength: parsedToken.length,
      prefix: parsedToken.slice(0, 8),
      attempt: verifyAttempt,
    });

    async function verify() {
      setState({ status: 'loading', message: 'Verifying invitation...' });
      try {
        const result = await validateInvitation(parsedToken);
        if (!result.ok) {
          console.log(FLOW_LOG, '✗ Validation returned not ok', { reason: result.reason });
          const map: Record<string, InviteState> = {
            not_found: { status: 'invalid', message: 'This invitation link is invalid.' },
            expired: { status: 'expired', message: 'This invitation has expired.' },
            revoked: { status: 'revoked', message: 'This invitation has been revoked.' },
            accepted: { status: 'invalid', message: 'This invitation has already been used.' },
            invalid: { status: 'invalid', message: 'This invitation is no longer valid.' },
          };
          const mapped = map[result.reason] ?? { status: 'invalid', message: 'This invitation is no longer valid.' };
          setState(mapped);
          return;
        }

        const inv = result.invitation;
        console.log(FLOW_LOG, '✓ Invitation fetched', {
          invitationId: inv.id,
          source: 'firestore',
        });
        console.log(FLOW_LOG, '✓ Invitation validated', {
          status: inv.status,
          organizationId: inv.organizationId,
          platformRole: inv.platformRole,
        });

        // ARCH-001: store token only — business data stays in Firestore.
        storeInvitationToken(parsedToken, `/invite/${parsedToken}`);

        setState({ status: 'valid', message: '' });
        setInvitation(inv);
      } catch (err) {
        const code = (err as { code?: string })?.code;
        console.error(FLOW_LOG, '✗ Unhandled exception during verification', {
          type: err instanceof Error ? err.name : typeof err,
          message: err instanceof Error ? err.message : String(err),
          code,
        });
        const permissionDenied =
          code === 'permission-denied'
          || (err instanceof Error && /permission/i.test(err.message));
        setState({
          status: 'error',
          message: permissionDenied
            ? 'Failed to verify invitation (permission denied). The invitation may be inaccessible — try again or request a new invite.'
            : `Failed to verify invitation. ${err instanceof Error ? err.message : 'Please try again.'}`,
        });
      }
    }
    void verify();
  }, [token, verifyAttempt]);

  const accept = useCallback(async () => {
    if (!token || !user || accepting || acceptStarted.current) return;
    acceptStarted.current = true;
    const parsedToken = parseInviteToken(token);

    setAccepting(true);
    setState({ status: 'accepting', message: 'Joining...' });
    console.log(FLOW_LOG, '✓ Token restored', { tokenPrefix: parsedToken.slice(0, 8) });
    console.log(FLOW_LOG, '✓ User authenticated', {
      uid: user.uid,
      email: user.email,
    });

    try {
      // ARCH-001: re-fetch + validate from Firestore inside acceptInvitationAtomically.
      // Do not use any business data from sessionStorage.
      const result = await acceptInvitationAtomically(parsedToken, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName,
      });

      if (!result.ok) {
        acceptStarted.current = false;
        console.error(FLOW_LOG, '✗ Accept failed', {
          reason: result.reason,
          message: result.message,
        });
        if (result.reason === 'invalid' && /permission/i.test(result.message)) {
          setState({ status: 'error', message: result.message });
          return;
        }
        router.replace(getRedirectFromError(result.reason));
        return;
      }

      // Roles / org from Firestore result only (never sessionStorage).
      console.log(FLOW_LOG, '✓ Membership created');
      console.log(FLOW_LOG, '✓ Roles assigned', {
        platformRole: result.invitation.platformRole,
        professionalRole: result.invitation.professionalRole,
        source: 'firestore',
      });
      console.log(FLOW_LOG, '✓ Invitation accepted', {
        organizationId: result.invitation.organizationId,
        source: 'firestore',
      });

      // Best-effort notification event for the inviter (outside transaction).
      try {
        await generateNotificationEvent({
          type: 'invitation.accepted',
          organizationId: result.invitation.organizationId,
          actorId: user.uid,
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
      setState({ status: 'accepted', message: 'You have joined the organization!' });

      // UAT-005: NEVER send invitees into generic onboarding.
      const dest = collaboratorWorkspacePath(result.invitation.platformRole);
      console.log(FLOW_LOG, '✓ Redirecting to collaborator workspace', { dest });
      setTimeout(() => {
        router.replace(dest);
      }, 1200);
    } catch (err) {
      acceptStarted.current = false;
      console.error(FLOW_LOG, '✗ Accept threw', err);
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setAccepting(false);
    }
  }, [token, user, router, accepting, setActiveOrgId, setOrgsLoaded]);

  // Authenticated + valid invitation → skip auth UI, accept immediately.
  useEffect(() => {
    if (authLoading || !user || accepting || acceptStarted.current) return;
    if (state.status !== 'valid') return;
    console.log(FLOW_LOG, '✓ Authenticated visitor — skipping auth UI, accepting invitation');
    void accept();
  }, [authLoading, user, state.status, accepting, accept]);

  function handleCreateAccount() {
    if (!token) return;
    const parsedToken = parseInviteToken(token);
    const returnPath = `/invite/${parsedToken}`;
    // ARCH-001: navigation token only — not org/roles/email.
    storeInvitationToken(parsedToken, returnPath);
    console.log(FLOW_LOG, '· Redirecting to sign-up (primary CTA)', { returnPath });
    router.push(`/sign-up?return=${encodeURIComponent(returnPath)}`);
  }

  function handleSignIn() {
    if (!token) return;
    const parsedToken = parseInviteToken(token);
    const returnPath = `/invite/${parsedToken}`;
    storeInvitationToken(parsedToken, returnPath);
    console.log(FLOW_LOG, '· Redirecting to sign-in (secondary CTA)', { returnPath });
    router.push(`/sign-in?return=${encodeURIComponent(returnPath)}`);
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-6 py-12">
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(204,85,0,0.06) 0%, transparent 70%)' }} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-8 text-center shadow-lg">
          {state.status === 'loading' && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              <p className="text-sm text-text-400">{state.message}</p>
            </div>
          )}

          {(state.status === 'valid' || state.status === 'accepting' || state.status === 'accepted') && (
            <InvitationCard
              status={state.status}
              invitation={invitation}
              authenticated={!!user}
              onCreateAccount={handleCreateAccount}
              onSignIn={handleSignIn}
            />
          )}

          {(state.status === 'invalid' || state.status === 'expired' || state.status === 'revoked') && (
            <ErrorCard status={state.status} message={state.message} />
          )}

          {state.status === 'error' && (
            <div className="py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-500/20">
                <svg className="h-7 w-7 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-danger-500">{state.message}</p>
              <button
                type="button"
                onClick={() => {
                  acceptStarted.current = false;
                  setVerifyAttempt((n) => n + 1);
                }}
                className="mt-4 rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-surface-0 hover:bg-primary-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InvitationCard({
  status,
  invitation,
  onCreateAccount,
  onSignIn,
  authenticated,
}: {
  status: 'valid' | 'accepting' | 'accepted';
  invitation: InvitationRecord | null;
  onCreateAccount: () => void;
  onSignIn: () => void;
  authenticated: boolean;
}) {
  if (status === 'accepted') {
    return (
      <div className="py-4">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-500/20">
          <svg className="h-7 w-7 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-text-300">You have joined the organization!</p>
        <p className="mt-2 text-xs text-text-500">Redirecting to your workspace...</p>
      </div>
    );
  }

  // Authenticated visitors skip the CTA UI and auto-accept.
  if (status === 'accepting' || authenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <p className="text-sm text-text-400">Accepting invitation...</p>
        {invitation && (
          <p className="text-xs text-text-500">
            Joining {invitation.organizationName} as{' '}
            {PLATFORM_ROLE_LABELS[invitation.platformRole as keyof typeof PLATFORM_ROLE_LABELS]
              ?? invitation.platformRole}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="py-2 text-left">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 shadow-lg">
          <svg viewBox="0 0 20 20" className="h-6 w-6 fill-white">
            <path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-text-100">Welcome to ReleaseFlow</h1>
      </div>

      <dl className="space-y-3 rounded-lg border border-surface-700/60 bg-surface-950/40 p-4 text-sm">
        <Row label="You've been invited by" value={invitation?.invitedByName || '—'} />
        <Row label="Organisation" value={invitation?.organizationName || '—'} />
        <Row
          label="Platform Role"
          value={
            invitation?.platformRole
              ? (PLATFORM_ROLE_LABELS[invitation.platformRole as keyof typeof PLATFORM_ROLE_LABELS]
                ?? invitation.platformRole)
              : '—'
          }
        />
      </dl>
      <p className="mt-3 text-center text-xs text-text-500">
        Creative contribution roles (e.g. Lyricist, Producer) are assigned when work is assigned to you.
      </p>

      <div className="mt-5 space-y-3">
        {/* UAT-005: Primary = Create Account (invite assumes new user) */}
        <button
          type="button"
          onClick={onCreateAccount}
          className="w-full rounded-lg bg-primary-500 py-2.5 text-sm font-medium text-surface-0 hover:bg-primary-600 transition-colors"
        >
          Create Account &amp; Accept Invitation
        </button>
        <button
          type="button"
          onClick={onSignIn}
          className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2.5 text-sm font-medium text-text-300 hover:bg-surface-700 transition-colors"
        >
          Already have a ReleaseFlow account? Sign In
        </button>
        <p className="text-center text-xs text-text-500">
          Your organization, role, and access are configured automatically from this invitation.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-text-500">{label}</dt>
      <dd className="text-right font-medium text-text-100">{value}</dd>
    </div>
  );
}

function ErrorCard({ status, message }: { status: 'invalid' | 'expired' | 'revoked'; message: string }) {
  const titles: Record<string, string> = {
    invalid: 'Invitation unavailable',
    expired: 'Invitation expired',
    revoked: 'Invitation revoked',
  };
  return (
    <div className="py-4">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning-500/20">
        <svg className="h-7 w-7 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-warning-500">{titles[status]}</p>
      <p className="mt-1 text-sm text-text-400">{message}</p>
      <p className="mt-2 text-xs text-text-500">Please contact the person who invited you for a new link.</p>
    </div>
  );
}
