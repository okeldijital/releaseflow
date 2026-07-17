'use client';

/**
 * UAT-006 — Request password reset for email/password accounts.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  requestPasswordReset,
  userFacingPasswordError,
  PasswordResetError,
  normalizeEmail,
} from '@/lib/auth/password-reset-service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [googleOnly, setGoogleOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setGoogleOnly(false);
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setSentTo(result.email);
      setSent(true);
    } catch (err) {
      if (err instanceof PasswordResetError && err.code === 'google_only') {
        setGoogleOnly(true);
        setError(err.message);
      } else {
        setError(userFacingPasswordError(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-center text-display-md font-semibold text-primary-400 tracking-tight">
        Reset your password
      </h1>
      <p className="mt-1 text-center text-sm text-text-500">
        Enter the email for your ReleaseFlow email/password account.
      </p>

      {sent ? (
        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-success-400 bg-success-500/10 rounded-lg py-3 px-4">
            If an account exists for <strong className="text-success-300">{sentTo}</strong>, we sent a password reset link.
            Check your inbox and spam folder.
          </p>
          <p className="text-center text-xs text-text-500">
            The link expires after a short time. After resetting, sign in with your new password.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div
              className={`mt-5 text-center text-sm rounded-lg py-2.5 px-3 ${
                googleOnly
                  ? 'text-warning-400 bg-warning-500/10'
                  : 'text-danger-400 bg-danger-500/10'
              }`}
            >
              <p>{error}</p>
              {googleOnly ? (
                <Link
                  href="/sign-in"
                  className="inline-block mt-2 font-semibold text-primary-400 hover:text-primary-300"
                >
                  Continue with Google on Sign In →
                </Link>
              ) : null}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmail((v) => normalizeEmail(v))}
              placeholder="Email"
              required
              autoComplete="email"
              className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-body text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.2)]"
            >
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-body-small text-text-500">
        <Link
          href="/sign-in"
          className="font-semibold text-primary-400 hover:text-primary-300 transition-colors duration-150"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
