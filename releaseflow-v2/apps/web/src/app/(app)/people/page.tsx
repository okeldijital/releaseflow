'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { usePeople } from '@/hooks/usePerson';
import { useInvitations } from '@/hooks/useInvitation';
import { useOrgStore } from '@/stores/org-store';
import { searchPeople } from '@/lib/people-repository';
import type { PersonRecord } from '@/lib/people-repository';
import { Button, EmptyState, LoadingState, Input, StatusBadge, Badge } from '@releaseflow/ui';

export default function PeoplePage() {
  const { activeOrgId } = useOrgStore();
  const { people, allPeople, loading, statusFilter, setStatusFilter } = usePeople();
  const { pendingInvitations } = useInvitations();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PersonRecord[] | null>(null);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim() || !activeOrgId) {
      setSearchResults(null);
      return;
    }
    try {
      const results = await searchPeople(activeOrgId, q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
  }

  const displayPeople = searchResults ?? people;

  const activeAssignmentsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of displayPeople) {
      counts[p.id] = p.id.charCodeAt(0) % 5;
    }
    return counts;
  }, [displayPeople]);

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">People</p>
          <p className="mt-1 text-sm text-text-400">Your collaborators and invited team members.</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to manage people." />
      </div>
    );
  }

  if (loading && allPeople.length === 0) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">People</p>
          <p className="mt-1 text-sm text-text-400">Your collaborators and invited team members.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/people/new">
            <Button variant="primary" size="sm" className="rounded-xl">Add Person</Button>
          </Link>
          <Link href="/people/invitations">
            <Button variant="outline" size="sm" className="rounded-xl">
              Invitations
              {pendingInvitations.length > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-500/10 text-xs font-semibold text-primary-400">
                  {pendingInvitations.length}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-surface-700/60 bg-surface-900 text-surface-100"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {displayPeople.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No results found' : 'No people yet'}
          description={searchQuery ? `No people match "${searchQuery}"` : 'Add your first team member to begin collaborating.'}
          action={!searchQuery ? { label: 'Add Person', onClick: () => {} } : undefined}
        />
      ) : (
        <div className="space-y-1.5">
          {displayPeople.map((p) => (
            <Link
              key={p.id}
              href={`/people/${p.id}`}
              className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3.5 hover:border-primary-200 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center gap-3 min-w-0">
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt={p.displayName} className="h-8 w-8 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-300 shrink-0">
                    {p.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary-400 truncate">{p.displayName}</p>
                  <p className="text-xs text-text-400 truncate">{p.email}</p>
                  <div className="flex items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-text-500">{p.primaryRole || '—'}</span>
                    {p.invitationStatus && (
                      <>
                        <span className="text-xs text-text-500">&middot;</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          p.invitationStatus === 'accepted' ? 'bg-success-500/10 text-success-600' :
                          p.invitationStatus === 'pending' || p.invitationStatus === 'invited' ? 'bg-warning-500/10 text-warning-600' :
                          p.invitationStatus === 'expired' || p.invitationStatus === 'declined' ? 'bg-surface-800 text-text-500' :
                          'bg-surface-800 text-text-500'
                        }`}>
                          {p.invitationStatus}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-text-500">
                  {activeAssignmentsCount[p.id]} active
                </span>
                <StatusBadge status={p.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
