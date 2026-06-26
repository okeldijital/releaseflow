'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { Button, Card } from '@releaseflow/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try { const auth = getAuthInstance(); if (!auth) throw new Error('Auth not initialized');
      await sendPasswordResetEmail(auth, email); setSent(true);
    } catch (err) { setError((err as Error).message); } finally { setSubmitting(false); }
  }

  return (
    <Card padding="lg" className="w-full max-w-sm">
      <div className="text-center mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary-500 mx-auto mb-3 flex items-center justify-center">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <h1 className="text-xl font-bold text-text-900">Reset your password</h1>
        <p className="text-sm text-text-500 mt-1">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      {sent ? (
        <div className="rounded-lg bg-success-50 text-success-500 p-4 text-sm text-center">Check your email for a password reset link.</div>
      ) : (
        <>
          {error ? <div className="rounded-lg bg-danger-50 text-danger-500 p-3 text-sm mb-4">{error}</div> : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-700 mb-1.5">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm text-text-900 placeholder:text-text-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="you@example.com" required />
            </div>
            <Button type="submit" fullWidth loading={submitting}>Send Reset Link</Button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-text-500 mt-6">
        <Link href="/sign-in" className="font-medium text-primary-500 hover:text-primary-600 underline underline-offset-4">Back to sign in</Link>
      </p>
    </Card>
  );
}
