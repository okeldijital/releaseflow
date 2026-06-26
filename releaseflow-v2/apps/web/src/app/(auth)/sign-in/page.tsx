'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { Button, Card } from '@releaseflow/ui';

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  async function handleGoogle() {
    try { setError(''); const auth = getAuthInstance(); if (!auth) throw new Error('Auth not initialized');
      await signInWithPopup(auth, new GoogleAuthProvider()); router.push('/dashboard');
    } catch (err) { setError((err as Error).message); }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try { const auth = getAuthInstance(); if (!auth) throw new Error('Auth not initialized');
      await signInWithEmailAndPassword(auth, email, password); router.push('/dashboard');
    } catch (err) { setError((err as Error).message); } finally { setSubmitting(false); }
  }

  return (
    <Card padding="lg" className="w-full max-w-sm">
      <div className="text-center mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary-500 mx-auto mb-3 flex items-center justify-center">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <h1 className="text-xl font-bold text-text-900">Sign in</h1>
        <p className="text-sm text-text-500 mt-1">Enter your credentials to continue</p>
      </div>

      {error ? (
        <div className="rounded-lg bg-danger-50 text-danger-500 p-3 text-sm mb-4">{error}</div>
      ) : null}

      <form onSubmit={handleEmail} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-700 mb-1.5">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm text-text-900 placeholder:text-text-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="you@example.com" required />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-700 mb-1.5">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm text-text-900 placeholder:text-text-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
          <div className="flex justify-end mt-1">
            <Link href="/forgot-password" className="text-xs text-text-500 hover:text-primary-500 underline underline-offset-2">Forgot password?</Link>
          </div>
        </div>
        <Button type="submit" fullWidth loading={submitting}>Sign in with Email</Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-surface-200" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-text-400">Or continue with</span></div>
      </div>

      <Button variant="outline" fullWidth onClick={handleGoogle}>Google</Button>

      <p className="text-center text-sm text-text-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="font-medium text-primary-500 hover:text-primary-600 underline underline-offset-4">Sign up</Link>
      </p>
    </Card>
  );
}
