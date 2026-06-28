'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchRightsHolders } from '@/lib/rights-service';
import type { RightsHolder } from '../types';
import { Button, Card, EmptyState, LoadingState } from '@releaseflow/ui';

const typeLabels: Record<string, string> = {
  artist: 'Artist',
  publisher: 'Publisher',
  label: 'Label',
  pro: 'PRO',
  distributor: 'Distributor',
};

export default function RightsHoldersPage() {
  const router = useRouter();
  const [holders, setHolders] = useState<RightsHolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRightsHolders().then((data) => setHolders(data as unknown as RightsHolder[])).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-900 dark:text-surface-50">Rights Holders</h1>
        <Link href="/rights-holders/new"><Button variant="primary">Add Holder</Button></Link>
      </div>

      {holders.length === 0 ? (
        <EmptyState
          title="No rights holders yet."
          description="Add your first rights holder"
          action={{ label: 'Add rights holder', onClick: () => router.push('/rights-holders/new') }}
        />
      ) : (
        <div className="space-y-2">
          {holders.map((h) => (
            <Card key={h.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-900 dark:text-surface-50">{h.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-500">{typeLabels[h.type] ?? h.type}</span>
                    {h.territory ? <span className="text-xs text-text-400">{h.territory}</span> : null}
                  </div>
                </div>
                {h.contact ? <span className="text-xs text-text-400">{h.contact}</span> : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
