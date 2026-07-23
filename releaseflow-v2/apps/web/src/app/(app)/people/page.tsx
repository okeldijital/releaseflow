'use client';

/**
 * BUILD-018 — People directory.
 * All person presentation goes through canonical PersonCard.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePeople } from '@/hooks/usePerson';
import { useOrgStore } from '@/stores/org-store';
import { searchPeople } from '@/lib/people-repository';
import type { PersonRecord } from '@/lib/people-repository';
import { fetchAssignments } from '@/lib/assignment-service';
import type { AssignmentRecord } from '@/lib/assignment-service';
import { getReleasesByOrganization } from '@/lib/release-repository';
import type { ReleaseRecord } from '@/lib/release-repository';
import { getMembershipsByOrg } from '@/lib/organization-repository';
import type { MembershipRecord } from '@/lib/organization-repository';
import { fetchInvitationsByOrg } from '@/lib/invitation-service';
import type { InvitationRecord } from '@/lib/invitation-service';
import { resolvePersonSecurity, platformRoleLabel } from '@/lib/people-platform';
import type { PlatformRole } from '@/lib/invitation-service';
import {
  archivePerson,
  restorePerson,
  toPersonCardModels,
} from '@/lib/person-service';
import type { PersonCardModel } from '@/lib/person-card-model';
import { PersonCard } from '@/components/people/PersonCard';
import {
  Button,
  Container,
  EmptyState,
  LoadingState,
  Select,
  Search,
} from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';
import { PLATFORM_ROLE_OPTIONS } from '@/lib/platform-roles';

type CollaboratorStatus = 'Active' | 'Inactive' | 'Pending Invitation' | 'Revoked';

function getCollaboratorStatus(person: PersonRecord): CollaboratorStatus {
  if (person.invitationStatus === 'pending' || person.invitationStatus === 'invited') {
    return 'Pending Invitation';
  }
  if ((person.invitationStatus as string | null) === 'revoked') return 'Revoked';
  if (person.status === 'archived') return 'Inactive';
  return 'Active';
}

export default function PeoplePage() {
  const { activeOrgId } = useOrgStore();
  const {
    people,
    allPeople,
    personCards,
    allPersonCards,
    loading,
    refresh,
  } = usePeople();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchCardModels, setSearchCardModels] = useState<PersonCardModel[] | null>(null);
  const [platformRoleFilter, setPlatformRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [releaseFilter, setReleaseFilter] = useState('all');
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);

  useEffect(() => {
    if (!activeOrgId) return;
    Promise.all([
      fetchAssignments(activeOrgId, { includeArchived: true }).catch(
        () => [] as AssignmentRecord[],
      ),
      getReleasesByOrganization(activeOrgId).catch(() => [] as ReleaseRecord[]),
      getMembershipsByOrg(activeOrgId).catch(() => [] as MembershipRecord[]),
      fetchInvitationsByOrg(activeOrgId).catch(() => [] as InvitationRecord[]),
    ]).then(([a, r, m, inv]) => {
      setAssignments(a);
      setReleases(r);
      setMemberships(m);
      setInvitations(inv);
    });
  }, [activeOrgId]);

  const releaseOptions = useMemo(
    () => releases.map((r) => ({ value: r.id, label: r.title })),
    [releases],
  );

  const personById = useMemo(() => {
    const map = new Map<string, PersonRecord>();
    for (const p of allPeople) map.set(p.id, p);
    return map;
  }, [allPeople]);

  const displayCards = searchCardModels ?? personCards;
  const isSearch = Boolean(searchQuery.trim() && searchCardModels);

  const filtered = useMemo(() => {
    let result = displayCards;
    if (searchQuery.trim() && !searchCardModels) {
      const q = searchQuery.toLowerCase();
      result = result.filter((card) => {
        const person = personById.get(card.id);
        if (!person) {
          return (
            card.displayName.toLowerCase().includes(q)
            || card.email.toLowerCase().includes(q)
            || card.subtitle.toLowerCase().includes(q)
          );
        }
        const sec = resolvePersonSecurity(person, memberships, invitations);
        return (
          card.displayName.toLowerCase().includes(q)
          || card.email.toLowerCase().includes(q)
          || sec.platformRoleLabel.toLowerCase().includes(q)
          || card.subtitle.toLowerCase().includes(q)
        );
      });
    }
    if (platformRoleFilter !== 'all') {
      result = result.filter((card) => {
        const person = personById.get(card.id);
        if (!person) return false;
        const sec = resolvePersonSecurity(person, memberships, invitations);
        return sec.platformRole === platformRoleFilter;
      });
    }
    if (statusFilter !== 'all') {
      result = result.filter((card) => {
        const person = personById.get(card.id);
        if (!person) return card.status === statusFilter.toLowerCase();
        return getCollaboratorStatus(person) === statusFilter;
      });
    }
    if (releaseFilter !== 'all') {
      result = result.filter((card) =>
        assignments.some(
          (a) =>
            a.assigneeId === card.id
            && a.entityType === 'release'
            && a.entityId === releaseFilter,
        ),
      );
    }
    return result;
  }, [
    displayCards,
    searchQuery,
    searchCardModels,
    platformRoleFilter,
    statusFilter,
    releaseFilter,
    assignments,
    memberships,
    invitations,
    personById,
  ]);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim() || !activeOrgId) {
      setSearchCardModels(null);
      return;
    }
    try {
      const results = await searchPeople(activeOrgId, q);
      setSearchCardModels(
        await toPersonCardModels(activeOrgId, results, {
          includeCounts: true,
        }),
      );
    } catch {
      setSearchCardModels([]);
    }
  }

  const handleArchive = useCallback(
    async (personId: string) => {
      try {
        await archivePerson(personId);
        toast.success('Person archived.');
        await refresh();
      } catch {
        toast.error('Unable to archive person.');
      }
    },
    [refresh],
  );

  const handleRestore = useCallback(
    async (personId: string) => {
      try {
        await restorePerson(personId);
        toast.success('Person restored.');
        await refresh();
      } catch {
        toast.error('Unable to restore person.');
      }
    },
    [refresh],
  );

  if (!activeOrgId) {
    return (
      <Container size="wide" className="py-8 page-transition">
        <div className="mb-8">
          <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">
            People
          </h1>
          <p className="mt-1 text-sm text-text-400">
            Your collaborators and invited team members.
          </p>
        </div>
        <EmptyState
          title="No organization selected"
          description="Select an organization to manage people."
        />
      </Container>
    );
  }

  if (loading && allPersonCards.length === 0) {
    return (
      <Container size="wide" className="py-8 page-transition">
        <div className="flex items-center justify-center py-32">
          <LoadingState />
        </div>
      </Container>
    );
  }

  return (
    <Container size="wide" className="py-8 page-transition">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">
            People
          </h1>
          <p className="mt-1 text-sm text-text-400">
            Organization members and their platform access roles.
          </p>
        </div>
        <Link href="/people/invitations">
          <Button variant="primary" size="sm" className="rounded-xl">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
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
              placeholder="Search by name, email, or role..."
            />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            label="Platform Role"
            options={[
              { value: 'all', label: 'All Roles' },
              ...PLATFORM_ROLE_OPTIONS.map((r) => ({
                value: r,
                label: platformRoleLabel(r as PlatformRole),
              })),
            ]}
            value={platformRoleFilter}
            onChange={setPlatformRoleFilter}
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
          description={
            searchQuery
              ? `No collaborators match "${searchQuery}"`
              : 'Invite collaborators to begin working on releases.'
          }
          action={
            !searchQuery
              ? { label: 'Invite Collaborator', onClick: () => {} }
              : undefined
          }
        />
      ) : (
        <div
          data-person-card-grid
          data-person-search-results={isSearch ? 'true' : undefined}
          className={
            isSearch
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
              : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
          }
        >
          {filtered.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              size={isSearch ? 'compact' : 'standard'}
              onArchive={handleArchive}
              onRestore={handleRestore}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
