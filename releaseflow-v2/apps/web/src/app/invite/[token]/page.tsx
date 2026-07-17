'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { fetchInvitationByToken, validateInvitation, acceptInvitationAtomically } from '@/lib/invitation-service';
import { PLATFORM_ROLE_LABELS } from '@/lib/platform-roles';
import { getUserProfile } from '@/lib/user-profile-repository';
import type { AtomicAcceptError } from '@/lib/invitation-service';

interface InviteState {
  status: 'loading' | 'valid' | 'accepting' | 'accepted' | 'invalid' | 'expired' | 'revoked' | 'error';
  message: string;
}

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

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = params?.token as string;
  const [state, setState] = useState<InviteState>({ status: 'loading', message: 'Verifying invitation...' });
  const [invitation, setInvitation] = useState<{
    invitedByName: string;
    organizationName: string;
    professionalRole: string;
    platformRole: string;
  } | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ status: 'invalid', message: 'This invitation link is invalid.' });
      return;
    }

    async function verify() {
      try {
        const result = await validateInvitation(token);
        if (!result.ok) {
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
        setState({ status: 'valid', message: '' });
        const inv = await fetchInvitationByToken(token);
        if (inv) {
          setInvitation({
            invitedByName: inv.invitedByName,
            organizationName: inv.organizationName,
            professionalRole: inv.professionalRole,
            platformRole: inv.platformRole,
          });
        }
      } catch {
        setState({ status: 'error', message: 'Failed to verify invitation. Please try again.' });
      }
    }
    verify();
  }, [token]);

  const accept = useCallback(async () => {
    if (!token || !user || accepting) return;
    setAccepting(true);
    setState({ status: 'accepting', message: 'Joining...' });
    try {
      const result = await acceptInvitationAtomically(token, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName,
      });
      if (!result.ok) {
        router.replace(getRedirectFromError(result.reason));
        return;
      }
      setState({ status: 'accepted', message: 'You have joined the organization!' });
      // Check if profile completion is needed
      const profile = await getUserProfile(user.uid);
      const needsProfileCompletion = profile && !profile.displayName?.trim();
      setTimeout(() => {
        router.replace(needsProfileCompletion ? '/onboarding/invitation' : '/dashboard');
      }, 1500);
    } catch {
      setState({ status: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setAccepting(false);
    }
  }, [token, user, router, accepting]);

  async function handleContinueInBrowser() {
    if (!token) return;
    if (user) {
      await accept();
      return;
    }
    sessionStorage.setItem('auth_return_to', '/invite/' + token);
    sessionStorage.setItem('invitation_token', token);
    router.push(`/sign-in?return=${encodeURIComponent('/invite/' + token)}`);
  }

  async function handleInstallApp() {
    if (!token) return;
    if (user) {
      await accept();
      return;
    }
    sessionStorage.setItem('auth_return_to', '/invite/' + token);
    sessionStorage.setItem('invitation_token', token);
    router.push(`/sign-up?return=${encodeURIComponent('/invite/' + token)}`);
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
              onInstall={handleInstallApp}
              onContinue={handleContinueInBrowser}
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
              <button onClick={() => setState({ status: 'loading', message: 'Retrying...' })}
                className="mt-4 rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-surface-0 hover:bg-primary-600 transition-colors">
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
  onInstall,
  onContinue,
  authenticated,
}: {
  status: 'valid' | 'accepting' | 'accepted';
  invitation: {
    invitedByName: string;
    organizationName: string;
    professionalRole: string;
    platformRole: string;
  } | null;
  onInstall: () => void;
  onContinue: () => void;
  authenticated: boolean;
}) {
  if (status === 'accepting') {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <p className="text-sm text-text-400">Accepting invitation...</p>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="py-4">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-500/20">
          <svg className="h-7 w-7 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-text-300">You have joined the organization!</p>
        <p className="mt-2 text-xs text-text-500">Redirecting to dashboard...</p>
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
        <Row label="Professional Role" value={invitation?.professionalRole || '—'} />
        <Row label="Platform Access" value={invitation?.platformRole ? (PLATFORM_ROLE_LABELS[invitation.platformRole as keyof typeof PLATFORM_ROLE_LABELS] ?? invitation.platformRole) : '—'} />
      </dl>

      <div className="mt-5 space-y-3">
        <button onClick={onContinue}
          className="w-full rounded-lg bg-primary-500 py-2.5 text-sm font-medium text-surface-0 hover:bg-primary-600 transition-colors">
          {authenticated ? 'Accept Invitation' : 'Sign in to Accept'}
        </button>
        {!authenticated && (
          <button onClick={onInstall}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2.5 text-sm font-medium text-text-300 hover:bg-surface-700 transition-colors">
            Create an Account
          </button>
        )}
        <p className="text-center text-xs text-text-500">
          {authenticated
            ? 'Your organization, role, and access are configured automatically.'
            : 'Sign in or create an account to accept this invitation.'}
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
