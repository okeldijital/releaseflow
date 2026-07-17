'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getUserProfile } from '@/lib/user-profile-repository';
import { updateDoc, doc, Timestamp } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';

export default function InvitationOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/sign-in');
      return;
    }

    async function check() {
      const profile = await getUserProfile(user!.uid);
      if (!profile) {
        router.replace('/dashboard');
        return;
      }
      if (profile.displayName?.trim()) {
        router.replace('/dashboard');
        return;
      }
      setDisplayName(user!.displayName || '');
      setChecking(false);
    }
    check();
  }, [user, loading, router]);

  async function handleSave() {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore unavailable');
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        updatedAt: Timestamp.now(),
      });
      router.replace('/dashboard');
    } catch {
      setSaving(false);
    }
  }

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 2 }).map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-500 ${
              i === 0
                ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
                : 'h-2 w-2 bg-primary-500/60'
            }`}
          />
        ))}
      </div>

      <h1 className="text-display-md font-semibold tracking-tight text-primary-400">You&apos;re almost there</h1>
      <p className="mt-2 text-sm text-text-400">Just one more thing before you get started.</p>

      <div className="mt-10 space-y-6">
        <div className="text-left">
          <label className="block text-xs font-medium text-text-500 uppercase tracking-wider mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            required
            autoFocus
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-body text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-150"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !displayName.trim()}
        className="mt-10 w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]"
      >
        {saving ? 'Saving...' : 'Continue to Dashboard'}
      </button>

      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 shadow-sm">
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-white"><path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" /></svg>
          </div>
          <span className="text-body font-semibold text-surface-50 tracking-tight">ReleaseFlow</span>
        </div>
      </div>
    </div>
  );
}
