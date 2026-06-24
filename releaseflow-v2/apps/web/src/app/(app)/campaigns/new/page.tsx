'use client';

import Link from 'next/link';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { createCampaign } from '@/lib/campaign-service';

const campaignTypes = [
  { value: 'pre_save', label: 'Pre-Save' },
  { value: 'social', label: 'Social' },
  { value: 'press', label: 'Press' },
  { value: 'playlist', label: 'Playlist' },
  { value: 'advertising', label: 'Advertising' },
];

export default function NewCampaignPage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState('social');
  const [releaseId, setReleaseId] = useState('');
  const [releases, setReleases] = useState<{ id: string; title: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const db = getDb();
      if (!db || !activeOrgId) return;
      const snap = await getDocs(
        query(collection(db, 'releases'), where('organizationId', '==', activeOrgId), orderBy('createdAt', 'desc')),
      );
      const data = snap.docs.map((d) => ({ id: d.id, title: d.data().title as string }));
      setReleases(data);
      if (data[0]) setReleaseId(data[0].id);
    }
    load();
  }, [activeOrgId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !releaseId || !user) return;
    setSubmitting(true);
    try {
      const id = await createCampaign({
        releaseId,
        name: name.trim(),
        type: type as never,
        ownerId: user.uid,
        actorId: user.uid,
      });
      router.push(`/campaigns/${id}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <Link href="/campaigns" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 inline-block">&larr; Back</Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">New Campaign</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Summer Release Campaign"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900">
            {campaignTypes.map((ct) => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Release</label>
          <select value={releaseId} onChange={(e) => setReleaseId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900">
            {releases.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={submitting || !name.trim() || !releaseId}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-6 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Campaign'}
          </button>
          <Link href="/campaigns" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
