'use client';

/**
 * UAT-006 — Firebase Auth email action handler.
 *
 * Configure Firebase Console → Authentication → Templates →
 * customize action URL to:
 *   https://flow.okeldijital.africa/auth/action
 * (and localhost for development)
 *
 * Handles mode=resetPassword with oobCode.
 */

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  verifyResetCode,
  completePasswordReset,
  userFacingPasswordError,
  PasswordResetError,
} from '@/lib/auth/password-reset-service';

function AuthActionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = searchParams.get('mode') ?? '';
  const oobCode = searchParams.get('oobCode') ?? '';

  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!oobCode) {
        setStatus('error');
        setError('Missing reset code. Open the link from your email, or request a new password reset.');
        return;
      }

      if (mode && mode !== 'resetPassword' && mode !== 'recoverEmail' && mode !== 'verifyEmail') {
        // Still allow resetPassword when mode missing (some custom links)
      }

      if (mode === 'verifyEmail') {
        setStatus('error');
        setError('Email verification is handled separately. You can sign in if your email is already verified.');
        return;
      }

      // Default: password reset
      try {
        const verifiedEmail = await verifyResetCode(oobCode);
        if (cancelled) return;
        setEmail(verifiedEmail);
        setStatus('form');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(userFacingPasswordError(err));
      }
    }

    void init();
    return () => { cancelled = true; };
  }, [mode, oobCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await completePasswordReset(oobCode, password);
      setStatus('success');
    } catch (err) {
      setError(userFacingPasswordError(err));
      if (err instanceof PasswordResetError && (err.code === 'expired_code' || err.code === 'invalid_code')) {
        setStatus('error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        <p className="text-sm text-text-500">Verifying reset link…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <>
        <h1 className="text-center text-display-md font-semibold text-primary-400 tracking-tight">
          Password updated
        </h1>
        <p className="mt-3 text-center text-sm text-success-400 bg-success-500/10 rounded-lg py-3 px-4">
          Your password has been changed. You can sign in with your new password now.
        </p>
        <button
          type="button"
          onClick={() => router.replace('/sign-in')}
          className="mt-6 w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] transition-all duration-150"
        >
          Sign in
        </button>
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        <h1 className="text-center text-display-md font-semibold text-primary-400 tracking-tight">
          Reset unavailable
        </h1>
        <p className="mt-5 text-center text-sm text-danger-400 bg-danger-500/10 rounded-lg py-2.5 px-3">
          {error}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/forgot-password"
            className="w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body flex items-center justify-center hover:bg-primary-400"
          >
            Request a new link
          </Link>
          <Link
            href="/sign-in"
            className="text-center text-sm font-semibold text-primary-400 hover:text-primary-300"
          >
            Back to sign in
          </Link>
        </div>
      </>
    );
  }

  // form
  return (
    <>
      <h1 className="text-center text-display-md font-semibold text-primary-400 tracking-tight">
        Choose a new password
      </h1>
      <p className="mt-1 text-center text-sm text-text-500">
        For <span className="text-text-300">{email}</span>
      </p>

      {error ? (
        <p className="mt-5 text-center text-sm text-danger-400 bg-danger-500/10 rounded-lg py-2 px-3">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (8+ characters)"
          required
          autoComplete="new-password"
          minLength={8}
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-body text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          required
          autoComplete="new-password"
          minLength={8}
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-body text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.2)]"
        >
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <p className="mt-6 text-center text-body-small text-text-500">
        <Link href="/sign-in" className="font-semibold text-primary-400 hover:text-primary-300">
          Back to sign in
        </Link>
      </p>
    </>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <AuthActionContent />
    </Suspense>
  );
}
