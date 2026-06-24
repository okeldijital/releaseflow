'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/sign-in'); return; }
    const db = getDb();
    if (!db) return;
    const q = query(collection(db, 'memberships'), where('userId', '==', user.uid), where('status', '==', 'active'));
    getDocs(q).then((snap) => {
      if (!snap.empty) router.replace('/dashboard');
      else setChecking(false);
    });
  }, [user, loading, router]);

  function generateSlug(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSubmitting(true);
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      const orgRef = await addDoc(collection(db, 'organizations'), {
        name,
        slug,
        ownerId: user.uid,
        createdAt: Timestamp.now(),
      });
      await addDoc(collection(db, 'memberships'), {
        organizationId: orgRef.id,
        userId: user.uid,
        roleId: 'owner',
        status: 'active',
        invitedBy: user.uid,
        createdAt: Timestamp.now(),
      });
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Create your organization</h1>
        <p className="text-zinc-500 mt-1">Name your label or group to get started.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400 mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div>
          <label htmlFor="orgName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Organization Name</label>
          <input id="orgName" type="text" value={name} onChange={(e) => { setName(e.target.value); setSlug(generateSlug(e.target.value)); }}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="My Label" required />
        </div>
        <div>
          <label htmlFor="orgSlug" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Slug</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm text-zinc-400">/</span>
            <input id="orgSlug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 pl-7 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="my-label" required />
          </div>
          <p className="text-xs text-zinc-400 mt-1">Used in URLs. Lowercase letters, numbers, and hyphens only.</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={() => router.push('/sign-in')} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Back</button>
          <button type="submit" disabled={submitting}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-6 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  );
}
