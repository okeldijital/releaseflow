'use client';

import Link from 'next/link';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { collection, query, where, getDocs, orderBy } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { createCampaign } from '@/lib/campaign-service';
import { Button, Card, Input, Select } from '@releaseflow/ui';

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
      <Link href="/campaigns" className="text-sm text-text-500 hover:text-text-900 dark:hover:text-surface-100 mb-6 inline-block">&larr; Back</Link>
      <p className="text-2xl font-bold text-text-900 dark:text-surface-50 mb-8">New Campaign</p>
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Summer Release Campaign" />
          <Select label="Type" options={campaignTypes} value={type} onChange={(v) => setType(v)} />
          <Select label="Release" options={releases.map((r) => ({ value: r.id, label: r.title }))} value={releaseId} onChange={(v) => setReleaseId(v)} />
          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" loading={submitting} disabled={submitting || !name.trim() || !releaseId}>
              {submitting ? 'Creating...' : 'Create Campaign'}
            </Button>
            <Link href="/campaigns" className="text-sm text-text-500 hover:text-text-900 dark:hover:text-surface-100">Cancel</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
