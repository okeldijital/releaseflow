'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export default function CompletePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const companyId = params.get('companyId') ?? '';
  const role = params.get('role') ?? '';
  const category = params.get('category') ?? 'creative';
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push('/sign-in'); return; }
    if (user && !done) {
      setDone(true);
      saveAndRoute();
    }
  }, [user, loading, done]);

  async function saveAndRoute() {
    if (!user) return;
    try {
      const db = getDb();
      if (db) {
        await setDoc(doc(db, 'users', user.uid), {
          role,
          roleCategory: category,
          activeOrganizationId: companyId || null,
          updatedAt: Timestamp.now(),
          onboardingComplete: true,
        }, { merge: true });
      }
    } catch { /* best effort */ }

    // Auto-route after brief delay for the completion animation
    setTimeout(() => {
      if (category === 'business') {
        router.replace('/releases');
      } else if (category === 'creative') {
        router.replace('/work');
      } else if (category === 'artist') {
        router.replace('/releases');
      } else {
        if (role === 'Administrator') {
          router.replace('/administration');
        } else {
          router.replace('/work');
        }
      }
    }, 1500);
  }

  if (loading || !user) return null;

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i}
            className={`block rounded-full transition-all duration-500 ${
              i < 3 ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_10px_rgba(204,85,0,0.5)]'
              : 'h-2.5 w-2.5 bg-primary-500 animate-pulse'
            }`} />
        ))}
      </div>

      <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/15">
        <svg className="h-8 w-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-display-md font-semibold tracking-tight text-surface-50">You&apos;re all set.</h1>
      <p className="mt-2 text-sm text-text-400">Your workspace is ready.</p>

      <button
        onClick={() => {
          if (category === 'business') router.replace('/releases');
          else if (category === 'creative') router.replace('/work');
          else if (category === 'artist') router.replace('/releases');
          else if (role === 'Administrator') router.replace('/administration');
          else router.replace('/work');
        }}
        className="mt-10 w-full h-12 rounded-xl bg-primary-500 text-surface-50 font-semibold text-body hover:bg-primary-400 active:scale-[0.98] transition-all duration-150 shadow-[0_4px_24px_rgba(204,85,0,0.25)] animate-scale-in">
        Continue to ReleaseFlow
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
