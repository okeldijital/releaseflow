'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const auth = getAuthInstance();
      if (!auth) throw new Error('Auth not initialized');
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch {
      setError('Could not send reset email. Please check the address and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-center text-xl font-semibold text-surface-50 tracking-tight">Reset your password</h1>
      <p className="mt-1 text-center text-sm text-text-500">Enter your email and we&apos;ll send you a reset link.</p>

      {sent ? (
        <p className="mt-6 text-center text-sm text-success-400 bg-success-500/10 rounded-lg py-3 px-4">
          Check your email for a password reset link.
        </p>
      ) : (
        <>
          {error && (
            <p className="mt-5 text-center text-sm text-danger-400 bg-danger-500/10 rounded-lg py-2 px-3">{error}</p>
          )}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-[15px] text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-primary-500 text-white font-semibold text-[15px] hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.2)]"
            >
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-[13px] text-text-500">
        <Link href="/sign-in" className="font-semibold text-primary-400 hover:text-primary-300 transition-colors duration-150">Back to sign in</Link>
      </p>
    </>
  );
}
