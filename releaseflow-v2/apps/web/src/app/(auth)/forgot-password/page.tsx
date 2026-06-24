'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError('');
      const auth = getAuthInstance();
      if (!auth) throw new Error('Auth not initialized');
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Reset your password</h1>
        <p className="mt-1 text-sm text-zinc-500">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      {sent ? (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-4 text-sm text-emerald-700 dark:text-emerald-300 text-center">Check your email for a password reset link.</div>
      ) : (
        <>
          {error && <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="you@example.com" required />
            </div>
            <button type="submit" className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">Send Reset Link</button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-zinc-500">
        <Link href="/sign-in" className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">Back to sign in</Link>
      </p>
    </div>
  );
}
