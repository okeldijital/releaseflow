'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePeople } from '@/hooks/usePerson';
import { useOrgStore } from '@/stores/org-store';
import { searchPeople } from '@/lib/people-repository';
import type { PersonRecord } from '@/lib/people-repository';
import { Button, EmptyState, LoadingState, Input, StatusBadge, Badge } from '@releaseflow/ui';

export default function PeoplePage() {
  const { activeOrgId } = useOrgStore();
  const { people, allPeople, loading } = usePeople();
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

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">People</p>
          <p className="mt-1 text-sm text-text-400">Your creative team, collaborators and contributors.</p>
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
          <p className="mt-1 text-sm text-text-400">Your creative team, collaborators and contributors.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/people/new">
            <Button variant="primary" size="sm" className="rounded-xl">Add Person</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by name, email, skills, or department..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
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
                <div>
                  <p className="text-sm font-medium text-primary-400">{p.displayName}</p>
                  <p className="text-xs text-text-400">{p.email}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    {p.primaryRole && p.primaryRole !== '—' ? (
                      <span className="text-xs text-text-500">{p.primaryRole}</span>
                    ) : null}
                    {p.department && (
                      <>
                        <span className="text-xs text-text-500">&middot;</span>
                        <span className="text-xs text-text-500">{p.department}</span>
                      </>
                    )}
                  </div>
                  {p.skills && p.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} label={skill} color="bg-primary-500/10 text-primary-400" size="sm" />
                      ))}
                      {p.skills.length > 3 && (
                        <span className="text-[10px] text-text-500">+{p.skills.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={p.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
