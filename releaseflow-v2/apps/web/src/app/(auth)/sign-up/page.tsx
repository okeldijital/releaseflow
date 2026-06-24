'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';

export default function SignUpPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) router.push('/onboarding');
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  async function handleGoogle() {
    try {
      setError('');
      const auth = getAuthInstance();
      if (!auth) throw new Error('Auth not initialized');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/onboarding');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError('');
      const auth = getAuthInstance();
      if (!auth) throw new Error('Auth not initialized');
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/onboarding');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Create an account</h1>
        <p className="mt-1 text-sm text-zinc-500">Fill in the form to get started</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      <form onSubmit={handleEmail} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
          <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="you@example.com" required />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            required minLength={6} />
        </div>
        <button type="submit" className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">Sign up with Email</button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400">Or continue with</span></div>
      </div>

      <button onClick={handleGoogle} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Google</button>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">Sign in</Link>
      </p>
    </div>
  );
}
