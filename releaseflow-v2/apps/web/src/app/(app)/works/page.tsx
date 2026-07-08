'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useWorks } from '@/hooks/useWork';
import { useOrgStore } from '@/stores/org-store';
import { searchWorks } from '@/lib/work-repository';
import type { WorkRecord } from '@/lib/work-repository';
import { Button, EmptyState, LoadingState, Input, StatusBadge, Badge } from '@releaseflow/ui';

export default function WorksPage() {
  const { activeOrgId } = useOrgStore();
  const { works, allWorks, loading } = useWorks();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WorkRecord[] | null>(null);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim() || !activeOrgId) {
      setSearchResults(null);
      return;
    }
    try {
      const results = await searchWorks(activeOrgId, q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
  }

  const displayWorks = searchResults ?? works;

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Works</p>
          <p className="mt-1 text-sm text-text-400">Musical compositions and publishing catalogue.</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to manage works." />
      </div>
    );
  }

  if (loading && allWorks.length === 0) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Works</p>
          <p className="mt-1 text-sm text-text-400">Musical compositions and publishing catalogue.</p>
        </div>
        <Link href="/works/new">
          <Button variant="primary" size="sm" className="rounded-xl">Add Work</Button>
        </Link>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by title, ISWC, or alternative title..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {displayWorks.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No results found' : 'No works yet'}
          description={searchQuery ? `No works match "${searchQuery}"` : 'Add your first composition to build your publishing catalogue.'}
        />
      ) : (
        <div className="space-y-1.5">
          {displayWorks.map((w) => (
            <Link
              key={w.id}
              href={`/works/${w.id}`}
              className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3.5 hover:border-primary-200 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary-400 truncate">{w.title}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    {w.iswc && <span className="text-xs text-text-500">{w.iswc}</span>}
                    {w.pro && <><span className="text-xs text-text-500">&middot;</span><span className="text-xs text-text-500">{w.pro}</span></>}
                    {w.genre && <><span className="text-xs text-text-500">&middot;</span><span className="text-xs text-text-500">{w.genre}</span></>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {w.registrationStatus !== 'unregistered' && (
                  <Badge label={w.registrationStatus.replace(/_/g, ' ')} color={
                    w.registrationStatus === 'registered' ? 'bg-success-500/10 text-success-600' :
                    w.registrationStatus === 'pending' ? 'bg-warning-500/10 text-warning-600' :
                    'bg-surface-800 text-text-500'
                  } size="sm" />
                )}
                <StatusBadge status={w.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
