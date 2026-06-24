'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { Campaign } from '../types';

const typeLabels: Record<string, string> = {
  pre_save: 'Pre-Save',
  social: 'Social',
  press: 'Press',
  playlist: 'Playlist',
  advertising: 'Advertising',
};

export default function CampaignsPage() {
  const { activeOrgId } = useOrgStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const db = getDb();
      if (!db || !activeOrgId) { setLoading(false); return; }
      const releasesSnap = await getDocs(
        query(collection(db, 'releases'), where('organizationId', '==', activeOrgId)),
      );
      const releaseIds = releasesSnap.docs.map((d) => d.id);
      const all: Campaign[] = [];
      for (const rid of releaseIds) {
        const snap = await getDocs(
          query(collection(db, 'campaigns'), where('releaseId', '==', rid), orderBy('createdAt', 'desc')),
        );
        all.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Campaign));
      }
      setCampaigns(all);
      setLoading(false);
    }
    load();
  }, [activeOrgId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Campaigns</h1>
        <Link href="/campaigns/new" className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">New Campaign</Link>
      </div>

      {!activeOrgId ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <p className="text-zinc-500">Select an organization first.</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <p className="text-zinc-500 mb-1">No campaigns yet.</p>
          <Link href="/campaigns/new" className="text-sm text-zinc-900 dark:text-zinc-100 underline underline-offset-4">Create your first campaign</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/campaigns/${c.id}`} className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{c.name}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">{typeLabels[c.type] ?? c.type} &middot; {c.status}</p>
                </div>
                <span className={`text-xs capitalize rounded-full px-2.5 py-0.5 ${
                  c.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                  c.status === 'completed' ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                }`}>{c.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
