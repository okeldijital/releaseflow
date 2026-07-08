'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';

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

  if (loading || user) return null;

  async function handleGoogle() {
    try {
      setError('');
      const auth = getAuthInstance();
      if (!auth) throw new Error('Auth not initialized');
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push('/dashboard');
    } catch {
      setError('Could not sign in with Google. Please try again.');
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const auth = getAuthInstance();
      if (!auth) throw new Error('Auth not initialized');
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-center text-xl font-semibold text-surface-50 tracking-tight">Sign in</h1>
      <p className="mt-1 text-center text-sm text-text-500">Welcome back to ReleaseFlow</p>

      {error && (
        <p className="mt-5 text-center text-sm text-danger-400 bg-danger-500/10 rounded-lg py-2 px-3">{error}</p>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        className="mt-6 w-full h-12 rounded-xl border border-surface-700 bg-surface-900 text-body font-medium text-surface-200 hover:border-surface-600 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-3"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09a6.95 6.95 0 010-4.18V7.07H2.18A11.96 11.96 0 001 12c0 2.08.53 4.04 1.45 5.73l2.85-2.22.54-.42z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-surface-700/60" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface-950 px-3 text-xs font-medium text-text-500 uppercase tracking-wider">or</span>
        </div>
      </div>

      <form onSubmit={handleEmail} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          autoComplete="email"
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-body text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150"
        />
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-body text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150"
          />
          <div className="flex justify-end mt-1">
            <Link href="/forgot-password" className="text-xs text-text-500 hover:text-primary-400 transition-colors duration-150">
              Forgot password?
            </Link>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.2)]"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-body-small text-text-500">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="font-semibold text-primary-400 hover:text-primary-300 transition-colors duration-150">
          Sign up
        </Link>
      </p>
    </>
  );
}
