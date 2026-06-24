'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getRightsHolders } from '@/lib/rights-service';
import type { RightsHolder } from '../types';

const typeLabels: Record<string, string> = {
  artist: 'Artist',
  publisher: 'Publisher',
  label: 'Label',
  pro: 'PRO',
  distributor: 'Distributor',
};

export default function RightsHoldersPage() {
  const [holders, setHolders] = useState<RightsHolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRightsHolders().then(setHolders).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Rights Holders</h1>
        <Link href="/rights-holders/new" className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">Add Holder</Link>
      </div>

      {holders.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <p className="text-zinc-500 mb-1">No rights holders yet.</p>
          <Link href="/rights-holders/new" className="text-sm text-zinc-900 dark:text-zinc-100 underline underline-offset-4">Add your first rights holder</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {holders.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{h.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-500">{typeLabels[h.type] ?? h.type}</span>
                  {h.territory ? <span className="text-xs text-zinc-400">{h.territory}</span> : null}
                </div>
              </div>
              {h.contact ? <span className="text-xs text-zinc-400">{h.contact}</span> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
