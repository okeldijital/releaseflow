'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/sign-in'); return; }
    async function check() {
      const db = getDb();
      if (db) {
        try {
          const snap = await getDoc(doc(db, 'users', user!.uid));
          if (snap.exists()) router.replace('/dashboard');
        } catch { /* first run */ }
      }
    }
    check();
  }, [user, loading, router]);

  if (loading || !user) return null;

  const displayName = user.displayName ?? '—';
  const email = user.email ?? '—';
  const avatarUrl = user.photoURL ?? null;
  const initials = displayName !== '—'
    ? displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : email.charAt(0).toUpperCase();

  async function handleContinue() {
    setSaving(true);
    try {
      const db = getDb();
      if (db) {
        await setDoc(doc(db, 'users', user!.uid), {
          displayName, email, avatarUrl,
          updatedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
        }, { merge: true });
      }
    } catch { /* best effort */ }
    router.push('/onboarding/company');
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className={`block rounded-full transition-all duration-500 ${
            i === 0 ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
            : i === 1 ? 'h-2 w-2 bg-primary-500/60'
            : 'h-1.5 w-1.5 bg-surface-700'
          }`} />
        ))}
      </div>

      <h1 className="text-[2rem] font-semibold tracking-tight text-surface-50">Welcome to ReleaseFlow</h1>
      <p className="mt-2 text-sm text-text-400">Let&apos;s confirm your identity and get started.</p>

      <div className="mt-10 flex justify-center">
        <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-surface-700">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-surface-800 text-2xl font-semibold text-text-300">{initials}</span>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-3 text-left">
        <div>
          <span className="block text-xs font-medium text-text-500 uppercase tracking-wider mb-1">Name</span>
          <p className="text-[15px] text-surface-100">{displayName}</p>
        </div>
        <div>
          <span className="block text-xs font-medium text-text-500 uppercase tracking-wider mb-1">Email</span>
          <p className="text-[15px] text-surface-100">{email}</p>
        </div>
      </div>

      <button onClick={handleContinue} disabled={saving}
        className="mt-10 w-full h-12 rounded-xl bg-primary-500 text-white font-semibold text-[15px] hover:bg-primary-400 active:scale-[0.98] disabled:opacity-60 transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)]">
        {saving ? 'Setting up...' : 'Continue'}
      </button>

      <p className="mt-6 text-xs text-text-500">You can change these later in Settings.</p>

      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 shadow-sm">
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-white"><path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" /></svg>
          </div>
          <span className="text-[15px] font-semibold text-surface-50 tracking-tight">ReleaseFlow</span>
        </div>
      </div>
    </div>
  );
}
