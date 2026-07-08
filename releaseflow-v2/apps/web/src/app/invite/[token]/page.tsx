'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { resolveInvitation } from '@/lib/invitation-service';

interface InviteState {
  status: 'loading' | 'valid' | 'invalid' | 'expired' | 'accepted' | 'error';
  message: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const token = params?.token as string;
  const [state, setState] = useState<InviteState>({ status: 'loading', message: 'Verifying invitation...' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'invalid', message: 'Invalid invitation link.' });
      return;
    }

    async function verify() {
      try {
        const { isValid, reason } = await resolveInvitation(token);
        if (!isValid) {
          setState({ status: reason === 'Invitation has expired' ? 'expired' : 'invalid', message: reason || 'Invalid invitation.' });
          return;
        }
        setState({ status: 'valid', message: 'Invitation verified.' });
      } catch {
        setState({ status: 'error', message: 'Failed to verify invitation. Please try again.' });
      }
    }
    verify();
  }, [token]);

  useEffect(() => {
    if (state.status !== 'valid' || !user || !token) return;

    async function accept() {
      try {
        const { acceptUserInvitation } = await import('@/lib/invitation-service');
        const result = await acceptUserInvitation(token, user!.uid);
        if (result.success && result.organizationId) {
          setState({ status: 'accepted', message: 'You have joined the organization!' });
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          setState({ status: 'error', message: result.error || 'Failed to accept invitation.' });
        }
      } catch {
        setState({ status: 'error', message: 'Something went wrong. Please try again.' });
      }
    }
    accept();
  }, [state.status, user, token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-6 py-12">
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(204,85,0,0.06) 0%, transparent 70%)' }} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-8 text-center shadow-lg">
          <div className="mb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 shadow-lg">
              <svg viewBox="0 0 20 20" className="h-6 w-6 fill-white">
                <path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-text-100">Organization Invitation</h1>
          </div>

          {state.status === 'loading' && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              <p className="text-sm text-text-400">{state.message}</p>
            </div>
          )}

          {(state.status === 'valid' || state.status === 'accepted') && (
            <div className="py-4">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${state.status === 'accepted' ? 'bg-emerald-500/20' : 'bg-primary-500/20'}`}>
                {state.status === 'accepted' ? (
                  <svg className="h-7 w-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-7 w-7 text-primary-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-text-300">{state.message}</p>
              {state.status === 'accepted' && (
                <p className="mt-2 text-xs text-text-500">Redirecting to dashboard...</p>
              )}
              {state.status === 'valid' && !user && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs text-text-500">Sign in or create an account to accept this invitation.</p>
                  <button onClick={() => router.push('/sign-in')} className="w-full rounded-lg bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors">
                    Sign In
                  </button>
                  <button onClick={() => router.push('/sign-up')} className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2.5 text-sm font-medium text-text-300 hover:bg-surface-700 transition-colors">
                    Create Account
                  </button>
                </div>
              )}
            </div>
          )}

          {(state.status === 'invalid' || state.status === 'expired') && (
            <div className="py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20">
                <svg className="h-7 w-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-amber-300">{state.message}</p>
              <p className="mt-2 text-xs text-text-500">Please contact the person who invited you for a new link.</p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
                <svg className="h-7 w-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-300">{state.message}</p>
              <button onClick={() => setState({ status: 'loading', message: 'Retrying...' })}
                className="mt-4 rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
