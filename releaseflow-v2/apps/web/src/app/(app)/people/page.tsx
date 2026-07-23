'use client';

/**
 * BUILD-018 — People directory.
 * All person presentation goes through canonical PersonCard.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePeople } from '@/hooks/usePerson';
import { useOrgStore } from '@/stores/org-store';
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
} from '@/lib/person-service';
import { PersonCard } from '@/components/people/PersonCard';
import {
  Button,
  Container,
  EmptyState,
  LoadingState,
  Select,
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
    allPeople,
    personCards,
    allPersonCards,
    loading,
    refresh,
  } = usePeople();

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

  const filtered = useMemo(() => {
    let result = personCards;
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
    personCards,
    platformRoleFilter,
    statusFilter,
    releaseFilter,
    assignments,
    memberships,
    invitations,
    personById,
  ]);

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

      <div className="mb-6 flex items-center gap-3 flex-wrap">
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

      {filtered.length === 0 ? (
        <EmptyState
          title="No collaborators yet"
          description="Invite collaborators to begin working on releases."
          action={{ label: 'Invite Collaborator', onClick: () => {} }}
        />
      ) : (
        <div
          data-person-card-grid
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {filtered.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              size="standard"
              onArchive={handleArchive}
              onRestore={handleRestore}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
