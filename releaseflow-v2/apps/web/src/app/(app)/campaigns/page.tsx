'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { collection, query, where, getDocs, orderBy } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Button, Card, EmptyState, LoadingState, StatusBadge } from '@releaseflow/ui';
import type { Campaign } from '../types';

const typeLabels: Record<string, string> = {
  pre_save: 'Pre-Save',
  social: 'Social',
  press: 'Press',
  playlist: 'Playlist',
  advertising: 'Advertising',
};

export default function CampaignsPage() {
  const router = useRouter();
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
    return <LoadingState />;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <p className="text-display-md font-semibold text-primary-400 tracking-tight">Campaigns</p>
        <Link href="/campaigns/new"><Button variant="primary">New Campaign</Button></Link>
      </div>

      {!activeOrgId ? (
        <EmptyState title="Select an organization first." />
      ) : campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet." action={{ label: 'Create your first campaign', onClick: () => router.push('/campaigns/new') }} />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/campaigns/${c.id}`}>
              <Card hover clickable>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-700">{c.name}</p>
                    <p className="text-sm text-text-500 mt-0.5">{typeLabels[c.type] ?? c.type} &middot; {c.status}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
