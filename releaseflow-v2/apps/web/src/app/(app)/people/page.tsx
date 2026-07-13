'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePeople } from '@/hooks/usePerson';
import { useOrgStore } from '@/stores/org-store';
import { searchPeople } from '@/lib/people-repository';
import type { PersonRecord } from '@/lib/people-repository';
import { listAssignments } from '@/lib/assignment-repository';
import { getReleasesByOrganization } from '@/lib/release-repository';
import type { AssignmentRecord } from '@/lib/assignment-repository';
import type { ReleaseRecord } from '@/lib/release-repository';
import {
  Button, Container, EmptyState, LoadingState, Select, Avatar, StatusBadge,
} from '@releaseflow/ui';
import { Search } from '@releaseflow/ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';

type CollaboratorStatus = 'Active' | 'Inactive' | 'Pending Invitation' | 'Revoked';

function getCollaboratorStatus(person: PersonRecord): CollaboratorStatus {
  if (person.invitationStatus === 'pending' || person.invitationStatus === 'invited') return 'Pending Invitation';
  if ((person.invitationStatus as string | null) === 'revoked') return 'Revoked';
  if (person.status === 'archived') return 'Inactive';
  return 'Active';
}

function getActiveAssignmentCount(personId: string, assignments: AssignmentRecord[]): number {
  return assignments.filter(a =>
    a.assigneeId === personId &&
    !['completed', 'archived', 'cancelled', 'declined'].includes(a.status)
  ).length;
}

function getReleaseCount(personId: string, assignments: AssignmentRecord[]): number {
  const releaseIds = new Set(
    assignments
      .filter(a => a.assigneeId === personId && a.entityType === 'release')
      .map(a => a.entityId)
  );
  return releaseIds.size;
}

export default function PeoplePage() {
  const { activeOrgId } = useOrgStore();
  const { people, allPeople, loading } = usePeople();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PersonRecord[] | null>(null);
  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [releaseFilter, setReleaseFilter] = useState('all');
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);

  useEffect(() => {
    if (!activeOrgId) return;
    setLoadingData(true);
    Promise.all([
      listAssignments(activeOrgId, { includeArchived: true }).catch(() => [] as AssignmentRecord[]),
      getReleasesByOrganization(activeOrgId).catch(() => [] as ReleaseRecord[]),
    ]).then(([a, r]) => {
      setAssignments(a);
      setReleases(r);
    });
  }, [activeOrgId]);

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    for (const p of allPeople) {
      if (p.primaryRole && p.primaryRole !== '—') set.add(p.primaryRole);
    }
    return Array.from(set).sort();
  }, [allPeople]);

  const releaseOptions = useMemo(() => releases.map(r => ({ value: r.id, label: r.title })), [releases]);

  const displayPeople = searchResults ?? people;

  const filtered = useMemo(() => {
    let result = displayPeople;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.displayName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
    }
    if (disciplineFilter !== 'all') {
      result = result.filter(p => p.primaryRole === disciplineFilter);
    }
    if (releaseFilter !== 'all') {
      result = result.filter(p => assignments.some(a => a.assigneeId === p.id && a.entityType === 'release' && a.entityId === releaseFilter));
    }
    return result;
  }, [displayPeople, searchQuery, disciplineFilter, releaseFilter, assignments]);

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

  if (!activeOrgId) {
    return (
      <Container size="wide" className="py-8 page-transition">
        <div className="mb-8">
          <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">People</h1>
          <p className="mt-1 text-sm text-text-400">Your collaborators and invited team members.</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to manage people." />
      </Container>
    );
  }

  if (loading && allPeople.length === 0) {
    return (
      <Container size="wide" className="py-8 page-transition">
        <div className="flex items-center justify-center py-32"><LoadingState /></div>
      </Container>
    );
  }

  return (
    <Container size="wide" className="py-8 page-transition">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">People</h1>
          <p className="mt-1 text-sm text-text-400">Your collaborators and invited team members.</p>
        </div>
        <Link href="/people/invitations">
          <Button variant="primary" size="sm" className="rounded-xl">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Collaborator
          </Button>
        </Link>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Search
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name or email..."
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select
            label="Discipline"
            options={[{ value: 'all', label: 'All Disciplines' }, ...disciplines.map(d => ({ value: d, label: d }))]}
            value={disciplineFilter}
            onChange={setDisciplineFilter}
            className="w-48"
          />
          <Select
            label="Status"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'Pending Invitation', label: 'Pending Invitation' },
              { value: 'Revoked', label: 'Revoked' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-48"
          />
          <Select
            label="Release"
            options={[{ value: 'all', label: 'All Releases' }, ...releaseOptions]}
            value={releaseFilter}
            onChange={setReleaseFilter}
            className="w-48"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No results found' : 'No collaborators yet'}
          description={searchQuery ? `No collaborators match "${searchQuery}"` : 'Invite collaborators to begin working on releases.'}
          action={!searchQuery ? { label: 'Invite Collaborator', onClick: () => {} } : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((person) => {
            const status = getCollaboratorStatus(person);
            const activeCount = getActiveAssignmentCount(person.id, assignments);
            const releaseCount = getReleaseCount(person.id, assignments);
            const menuItems = [
              { id: 'view', label: 'View Profile', onClick: () => { window.location.href = `/people/${person.id}`; } },
              ...(status === 'Pending Invitation' ? [
                { id: 'resend', label: 'Resend Invitation', onClick: () => {} },
                { id: 'cancel', label: 'Cancel Invitation', variant: 'danger' as const, onClick: () => {} },
              ] : []),
              ...(person.status === 'archived'
                ? [{ id: 'reactivate', label: 'Reactivate', onClick: () => {} }]
                : [{ id: 'deactivate', label: 'Deactivate', variant: 'danger' as const, onClick: () => {} }]
              ),
            ];

            return (
              <div key={person.id} className="flex items-center gap-4 rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors">
                <Avatar name={person.displayName} src={person.avatarUrl ?? undefined} size="md" />
                <div className="flex-1 min-w-0">
                  <Link href={`/people/${person.id}`} className="text-sm font-medium text-primary-400 hover:text-primary-500 truncate block">
                    {person.displayName}
                  </Link>
                  <p className="text-xs text-text-500 truncate">{person.primaryRole || '—'}</p>
                </div>
                <StatusBadge status={status.toLowerCase().replace(/ /g, '_')} />
                <div className="w-28 text-center">
                  {activeCount > 0 ? (
                    <Link href={`/assignments?person=${person.id}`} className="text-sm text-primary-400 hover:text-primary-500 font-medium">
                      {activeCount} Active
                    </Link>
                  ) : (
                    <span className="text-sm text-text-500">0 Active</span>
                  )}
                </div>
                <div className="w-28 text-center">
                  {releaseCount > 0 ? (
                    <Link href={`/people/${person.id}/releases`} className="text-sm text-primary-400 hover:text-primary-500 font-medium">
                      {releaseCount} Release{releaseCount !== 1 ? 's' : ''}
                    </Link>
                  ) : (
                    <span className="text-sm text-text-500">0 Releases</span>
                  )}
                </div>
                <div className="shrink-0">
                  <EntityOverflowMenu items={menuItems} aria-label={`Actions for ${person.displayName}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
