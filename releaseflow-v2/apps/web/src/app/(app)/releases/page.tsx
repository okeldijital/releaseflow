'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { fmtDate } from '@/lib/utils';
import type { Release } from '../types';

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  in_production: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  ready_for_distribution: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  released: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  archived: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

export default function ReleasesPage() {
  const { activeOrgId } = useOrgStore();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeOrgId) { setLoading(false); return; }
    async function load() {
      const db = getDb();
      if (!db) return;
      const q = query(collection(db, 'releases'), where('organizationId', '==', activeOrgId), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReleases(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Release));
      setLoading(false);
    }
    load();
  }, [activeOrgId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Releases</h1>
        {activeOrgId && (
          <Link href="/releases/new" className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800">New Release</Link>
        )}
      </div>

      {!activeOrgId ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 mb-4">Select an organization to view releases.</p>
          <Link href="/organizations" className="text-sm text-zinc-900 dark:text-zinc-100 underline underline-offset-4">Go to Organizations</Link>
        </div>
      ) : releases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-16 text-center">
          <p className="text-zinc-500 mb-2">No releases in this organization yet.</p>
          <Link href="/releases/new" className="inline-block rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800">Create your first release</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {releases.map((release) => (
            <Link key={release.id} href={`/releases/${release.id}`}
              className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">{release.title}</p>
                    <span className={`shrink-0 text-xs capitalize rounded-full px-2.5 py-0.5 ${statusColors[release.status] ?? statusColors.draft}`}>
                      {release.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 capitalize mt-1">
                    {release.releaseType}
                    {release.targetReleaseDate ? <> &middot; Target: {fmtDate(release.targetReleaseDate)}</> : null}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400 ml-4">{fmtDate(release.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
