'use client';

/**
 * UAT-006 / UAT-006A — Request password reset.
 * Surfaces real Firebase error codes during recovery debugging.
 * Does not redesign the recovery flow — diagnostics only.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  requestPasswordReset,
  userFacingPasswordError,
  PasswordResetError,
  normalizeEmail,
  getPublicAuthRuntimeConfig,
  logPasswordRecoveryConfiguration,
} from '@/lib/auth/password-reset-service';

const LOG = '[Password Recovery]';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [debugDetail, setDebugDetail] = useState('');
  const [googleOnly, setGoogleOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // UAT-006A: log public runtime Firebase config once (no secrets).
  useEffect(() => {
    const cfg = getPublicAuthRuntimeConfig();
    logPasswordRecoveryConfiguration();
    console.log(LOG, '· Page mount — public auth runtime config object', cfg);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDebugDetail('');
    setGoogleOnly(false);
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setSentTo(result.email);
      setSent(true);
    } catch (err) {
      const mapped = err instanceof PasswordResetError ? err : null;
      const message = userFacingPasswordError(err);
      setError(message);

      if (mapped) {
        setGoogleOnly(mapped.code === 'google_only');
        setDebugDetail(
          [
            mapped.firebaseCode ? `Firebase code: ${mapped.firebaseCode}` : null,
            mapped.firebaseMessage ? `Firebase message: ${mapped.firebaseMessage}` : null,
            `App code: ${mapped.code}`,
          ]
            .filter(Boolean)
            .join('\n'),
        );
        console.error({
          code: mapped.firebaseCode ?? mapped.code,
          message: mapped.firebaseMessage ?? mapped.message,
          customData: undefined,
          stack: mapped.stack,
        });
        console.error(LOG, '✗ UI received PasswordResetError', {
          code: mapped.code,
          message: mapped.message,
          firebaseCode: mapped.firebaseCode,
          firebaseMessage: mapped.firebaseMessage,
        });
      } else {
        const anyErr = err as {
          code?: string;
          message?: string;
          customData?: unknown;
          stack?: string;
        };
        console.error({
          code: anyErr?.code,
          message: anyErr?.message ?? String(err),
          customData: anyErr?.customData,
          stack: anyErr?.stack,
        });
        console.error(LOG, '✗ UI received non-PasswordResetError', err);
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
              <p className="whitespace-pre-wrap break-words">{error}</p>
              {debugDetail ? (
                <pre className="mt-2 text-left text-[11px] opacity-80 whitespace-pre-wrap break-all font-mono">
                  {debugDetail}
                </pre>
              ) : null}
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
