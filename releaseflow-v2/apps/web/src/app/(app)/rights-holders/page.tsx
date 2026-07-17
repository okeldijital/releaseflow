'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRightsHolders } from '@/hooks/useRights';
import { Button, EmptyState, LoadingState, Table } from '@releaseflow/ui';

const typeLabels: Record<string, string> = {
  artist: 'Artist', publisher: 'Publisher', label: 'Label', pro: 'PRO', distributor: 'Distributor',
};

const columns = [
  { key: 'name', header: 'Name', render: (_: unknown, row: { name: string; type: string }) => (
    <div>
      <div className="font-semibold text-text-700 text-sm">{row.name}</div>
      <div className="text-xs text-text-500">{typeLabels[row.type] ?? row.type}</div>
    </div>
  )},
  { key: 'territory', header: 'Territory', render: (_: unknown, row: { territory?: string | null }) => (
    <span className="text-sm text-text-500">{row.territory ?? '—'}</span>
  )},
  { key: 'contact', header: 'Contact', render: (_: unknown, row: { contact?: string | null }) => (
    <span className="text-sm text-text-500">{row.contact ?? '—'}</span>
  )},
];

export default function RightsHoldersPage() {
  const router = useRouter();
  const { holders, loading } = useRightsHolders();

  if (loading) return <div className="flex items-center justify-center py-32"><LoadingState /></div>;

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">Rights Holders</h1>
          <p className="text-sm text-text-500 mt-1">
            {holders.length === 0 ? 'No rights holders yet.' : `${holders.length} rights holder${holders.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/rights-holders/new">
          <Button variant="primary" size="md">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Holder
          </Button>
        </Link>
      </div>

      {holders.length === 0 ? (
        <EmptyState title="No rights holders" description="Add publishers, labels, PROs, or distributors to manage ownership and splits." action={{ label: 'Add rights holder', onClick: () => router.push('/rights-holders/new') }} />
      ) : (
        <Table columns={columns as never} data={holders as never} />
      )}
    </div>
  );
}
