'use client';

/**
 * DOM-001 — Person profile separates:
 *   Platform Role (security via membership) from
 *   Contribution Roles (via assignments only).
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePerson } from '@/hooks/usePerson';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import {
  archivePerson as serviceArchive, restorePerson as serviceRestore,
} from '@/lib/person-service';
import { fetchAssignmentsByAssignee } from '@/lib/assignment-service';
import type { AssignmentRecord } from '@/lib/assignment-service';
import { getRelease } from '@/lib/release-repository';
import { resendPersonInvitation, cancelInvitation } from '@/lib/invitation-service';
import {
  getMembershipsByOrg,
  updateMembershipRole,
  removeMembership,
  getOrganization,
} from '@/lib/organization-repository';
import type { MembershipRecord } from '@/lib/organization-repository';
import { fetchInvitationsByOrg } from '@/lib/invitation-service';
import type { InvitationRecord } from '@/lib/invitation-service';
import {
  resolvePersonSecurity,
  groupContributionRolesByRelease,
  platformRoleLabel,
} from '@/lib/people-platform';
import {
  PLATFORM_ROLE_OPTIONS,
  platformRoleToSystemRole,
  systemRoleToPlatformRole,
} from '@/lib/platform-roles';
import type { PlatformRole } from '@/lib/invitation-service';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import {
  Avatar, Card, EmptyState, LoadingState, Tabs, Skeleton, StatusBadge, Button,
} from '@releaseflow/ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { toast } from '@/stores/toast-store';
import { usePersonIdentity } from '@/hooks/useIdentity';
import type { PersonRecord } from '@/lib/people-repository';

type TabId = 'overview' | 'assignments' | 'activity';

function PersonHeaderAvatar({ person }: { person: PersonRecord }) {
  const identity = usePersonIdentity(person);
  return (
    <Avatar
      name={identity?.displayName || person.displayName}
      src={identity?.avatarUrl}
      size="xl"
    />
  );
}

function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    const obj = value as { seconds?: number; toDate?(): Date };
    if (typeof obj.seconds === 'number') return new Date(obj.seconds * 1000).toLocaleDateString();
    if (typeof obj.toDate === 'function') return obj.toDate().toLocaleDateString();
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  } catch {
    return '';
  }
}

const statusColors: Record<string, string> = {
  draft: 'bg-surface-800 text-text-500',
  assigned: 'bg-primary-500/10 text-primary-400',
  accepted: 'bg-info-500/10 text-info-400',
  in_progress: 'bg-warning-500/10 text-warning-600',
  review: 'bg-primary-500/10 text-primary-400',
  completed: 'bg-success-500/10 text-success-600',
  declined: 'bg-danger-500/10 text-danger-600',
  cancelled: 'bg-surface-800 text-text-500',
  archived: 'bg-surface-800 text-text-500',
};

export default function PersonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();

  const {
    person, activities, assignmentSummary, loading, refresh,
  } = usePerson(id);

  const [personAssignments, setPersonAssignments] = useState<AssignmentRecord[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [releaseTitles, setReleaseTitles] = useState<Map<string, string>>(new Map());
  const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [orgName, setOrgName] = useState('');
  const [tab, setTab] = useState<TabId>('overview');
  const [changingRole, setChangingRole] = useState(false);
  const [securityBusy, setSecurityBusy] = useState(false);

  const canManageSecurity = AuthorizationService.canManageUsers()
    || AuthorizationService.canViewAdministration();

  useEffect(() => {
    let cancelled = false;
    async function loadAssignments() {
      if (!id) return;
      setLoadingAssignments(true);
      try {
        const data = await fetchAssignmentsByAssignee(id, activeOrgId ?? undefined);
        if (cancelled) return;
        setPersonAssignments(data);
        const releaseIds = [...new Set(
          data.filter((a) => a.entityType === 'release').map((a) => a.entityId),
        )];
        const titles = new Map<string, string>();
        await Promise.all(
          releaseIds.map(async (rid) => {
            const release = await getRelease(rid);
            if (release?.title) titles.set(rid, release.title);
          }),
        );
        if (!cancelled) setReleaseTitles(titles);
      } catch {
        if (!cancelled) setPersonAssignments([]);
      } finally {
        if (!cancelled) setLoadingAssignments(false);
      }
    }
    void loadAssignments();
    return () => { cancelled = true; };
  }, [id, activeOrgId]);

  useEffect(() => {
    if (!activeOrgId) return;
    Promise.all([
      getMembershipsByOrg(activeOrgId).catch(() => [] as MembershipRecord[]),
      fetchInvitationsByOrg(activeOrgId).catch(() => [] as InvitationRecord[]),
      getOrganization(activeOrgId).catch(() => null),
    ]).then(([m, inv, org]) => {
      setMemberships(m);
      setInvitations(inv);
      setOrgName(org?.name ?? '');
    });
  }, [activeOrgId]);

  const security = useMemo(() => {
    if (!person) return null;
    return resolvePersonSecurity(person, memberships, invitations);
  }, [person, memberships, invitations]);

  const releaseContributions = useMemo(
    () => groupContributionRolesByRelease(personAssignments, releaseTitles),
    [personAssignments, releaseTitles],
  );

  const collaboratorStatus = useMemo(() => {
    if (!person) return 'Active';
    if (person.invitationStatus === 'pending' || person.invitationStatus === 'invited') return 'Pending Invitation';
    if (person.invitationStatus === 'revoked' as string) return 'Revoked';
    if (person.status === 'archived') return 'Inactive';
    return 'Active';
  }, [person]);

  const activeAssignments = useMemo(
    () => personAssignments.filter((a) => !['completed', 'archived', 'cancelled', 'declined'].includes(a.status)),
    [personAssignments],
  );
  const completedAssignments = useMemo(
    () => personAssignments.filter((a) => a.status === 'completed'),
    [personAssignments],
  );

  async function handleArchive() {
    if (!id) return;
    try {
      await serviceArchive(id);
      await refresh();
      toast.success('Member deactivated');
    } catch {
      toast.error('Could not deactivate member');
    }
  }

  async function handleRestore() {
    if (!id) return;
    try {
      await serviceRestore(id);
      await refresh();
      toast.success('Member reactivated');
    } catch {
      toast.error('Could not reactivate member');
    }
  }

  async function handleResend() {
    if (!id || !security?.pendingInvitation) return;
    try {
      await resendPersonInvitation(
        security.pendingInvitation.id,
        user?.uid ?? '',
        activeOrgId ?? '',
      );
      await refresh();
      toast.success('Invitation resent');
    } catch {
      toast.error('Could not resend invitation');
    }
  }

  async function handleCancel() {
    if (!id || !security?.pendingInvitation) return;
    try {
      await cancelInvitation(
        security.pendingInvitation.id,
        user?.uid ?? '',
        activeOrgId ?? '',
      );
      await refresh();
      toast.success('Invitation cancelled');
    } catch {
      toast.error('Could not cancel invitation');
    }
  }

  async function handleChangePlatformRole(next: PlatformRole) {
    if (!security?.membership || !canManageSecurity) return;
    setSecurityBusy(true);
    try {
      const systemRole = platformRoleToSystemRole(next);
      await updateMembershipRole(security.membership.id, systemRole);
      const refreshed = await getMembershipsByOrg(activeOrgId!);
      setMemberships(refreshed);
      toast.success(`Platform role updated to ${platformRoleLabel(next)}`);
      setChangingRole(false);
    } catch {
      toast.error('Could not update platform role');
    } finally {
      setSecurityBusy(false);
    }
  }

  async function handleRemoveMember() {
    if (!security?.membership || !canManageSecurity) return;
    if (!confirm('Remove this member from the organization? This does not delete their account.')) return;
    setSecurityBusy(true);
    try {
      await removeMembership(security.membership.id);
      if (person) await serviceArchive(person.id);
      toast.success('Member removed');
      await refresh();
      const refreshed = await getMembershipsByOrg(activeOrgId!);
      setMemberships(refreshed);
    } catch {
      toast.error('Could not remove member');
    } finally {
      setSecurityBusy(false);
    }
  }

  const actionMenuItems = [
    ...(collaboratorStatus === 'Pending Invitation' ? [
      { id: 'resend', label: 'Resend Invitation', onClick: handleResend },
      { id: 'cancel', label: 'Cancel Invitation', variant: 'danger' as const, onClick: handleCancel },
    ] : []),
    ...(person?.status === 'archived'
      ? [{ id: 'reactivate', label: 'Activate Account', onClick: handleRestore }]
      : [{ id: 'deactivate', label: 'Deactivate Account', variant: 'danger' as const, onClick: handleArchive }]
    ),
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="flex items-center justify-center py-32"><LoadingState /></div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-400">Person not found.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    {
      id: 'assignments',
      label: 'Assignments',
      count: assignmentSummary
        ? assignmentSummary.current + assignmentSummary.upcoming
        : undefined,
    },
    { id: 'activity', label: 'Activity' },
  ];

  const currentPlatform = security?.platformRole
    ?? (security?.membership ? systemRoleToPlatformRole(security.membership.roleId) : null);

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-6">
        <Link href="/people" className="text-sm text-text-400 hover:text-surface-50 inline-block">
          &larr; Back to People
        </Link>
      </div>

      {/* ===== Header: identity + platform role only ===== */}
      <div className="flex items-start gap-5 mb-8">
        <PersonHeaderAvatar person={person} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">
                {person.displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <span className="text-sm font-medium text-text-300">
                  {security?.platformRoleLabel ?? '—'}
                </span>
                <StatusBadge status={collaboratorStatus.toLowerCase().replace(/ /g, '_')} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-500">
                {person.email && (
                  <span>
                    Email: <span className="text-surface-100">{person.email}</span>
                  </span>
                )}
                {orgName && (
                  <span>
                    Organization: <span className="text-surface-100">{orgName}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <EntityOverflowMenu items={actionMenuItems} aria-label="Person actions" />
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={tab} onChange={(t) => setTab(t as TabId)} variant="underline" className="mb-8" />

      {tab === 'overview' && (
        <div className="space-y-8">
          {/* Security & Access */}
          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Security &amp; Access</h2>
            <Card className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-text-500 uppercase tracking-wider mb-1">Platform Role</p>
                  <p className="font-medium text-surface-100">{security?.platformRoleLabel ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-500 uppercase tracking-wider mb-1">Status</p>
                  <p className="font-medium text-surface-100 capitalize">
                    {security?.membershipStatus === 'none'
                      ? collaboratorStatus
                      : security?.membershipStatus ?? collaboratorStatus}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-500 uppercase tracking-wider mb-1">Organization Membership</p>
                  <p className="font-medium text-surface-100">
                    {security?.membership ? 'Member' : security?.pendingInvitation ? 'Invited' : 'Directory only'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-500 uppercase tracking-wider mb-1">Invitation Status</p>
                  <p className="font-medium text-surface-100 capitalize">
                    {person.invitationStatus?.replace(/_/g, ' ') || (security?.membership ? 'accepted' : '—')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-500 uppercase tracking-wider mb-1">Member Since</p>
                  <p className="font-medium text-surface-100">
                    {formatDate(security?.memberSince) || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-500 uppercase tracking-wider mb-1">Organization</p>
                  <p className="font-medium text-surface-100">{orgName || '—'}</p>
                </div>
              </div>

              {canManageSecurity && security?.membership && (
                <div className="border-t border-surface-200/60 pt-4 space-y-3">
                  <p className="text-xs font-medium text-text-500 uppercase tracking-wider">
                    Administrator Controls
                  </p>
                  {changingRole ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {PLATFORM_ROLE_OPTIONS.map((r) => (
                        <Button
                          key={r}
                          size="sm"
                          variant={currentPlatform === r ? 'primary' : 'secondary'}
                          disabled={securityBusy}
                          onClick={() => void handleChangePlatformRole(r)}
                        >
                          {platformRoleLabel(r)}
                        </Button>
                      ))}
                      <Button size="sm" variant="ghost" onClick={() => setChangingRole(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setChangingRole(true)}>
                        Change Platform Role
                      </Button>
                      {person.status === 'archived' ? (
                        <Button size="sm" variant="secondary" onClick={() => void handleRestore()}>
                          Activate Account
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => void handleArchive()}>
                          Deactivate Account
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-danger-500"
                        disabled={securityBusy}
                        onClick={() => void handleRemoveMember()}
                      >
                        Remove Member
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </section>

          {/* Release Contributions — from assignments only */}
          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Release Contributions</h2>
            <p className="text-xs text-text-500 mb-3">
              Contribution roles are assigned per release. They do not define this person&apos;s platform access.
            </p>
            {loadingAssignments ? (
              <Card><Skeleton className="h-12 w-full" /></Card>
            ) : releaseContributions.length === 0 ? (
              <Card>
                <p className="text-sm text-text-500">
                  No release contribution roles yet. Assign work with a contribution role to show them here.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {releaseContributions.map((rc) => (
                  <Link
                    key={rc.releaseId}
                    href={`/releases/${rc.releaseId}`}
                    className="block rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors"
                  >
                    <p className="text-sm font-medium text-primary-400">{rc.releaseTitle}</p>
                    <ul className="mt-1 space-y-0.5">
                      {rc.contributionRoles.map((role) => (
                        <li key={role} className="text-xs text-text-500">
                          • {role}
                        </li>
                      ))}
                    </ul>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Assignments preview */}
          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Active Assignments</h2>
            {loadingAssignments ? (
              <LoadingState />
            ) : activeAssignments.length === 0 ? (
              <EmptyState title="No active assignments" description="This person has no active assignments." />
            ) : (
              <div className="space-y-2">
                {activeAssignments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/assignments/${a.id}`}
                    className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary-400 truncate">{a.title}</p>
                      <p className="text-xs text-text-500 capitalize">
                        {a.entityType} &middot; {a.role || '—'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status] ?? ''}`}>
                      {a.status.replace(/_/g, ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'assignments' && (
        <section>
          <h2 className="text-base font-semibold text-primary-400 mb-4">Assignments</h2>
          {assignmentSummary ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Card>
                <p className="text-xs text-text-400">Current</p>
                <p className="text-display-sm font-semibold text-primary-400">{assignmentSummary.current}</p>
              </Card>
              <Card>
                <p className="text-xs text-text-400">Upcoming</p>
                <p className="text-display-sm font-semibold text-warning-600">{assignmentSummary.upcoming}</p>
              </Card>
              <Card>
                <p className="text-xs text-text-400">Completed</p>
                <p className="text-display-sm font-semibold text-success-600">{assignmentSummary.completed}</p>
              </Card>
              <Card>
                <p className="text-xs text-text-400">Overdue</p>
                <p className="text-display-sm font-semibold text-danger-600">{assignmentSummary.overdue}</p>
              </Card>
            </div>
          ) : null}

          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-primary-400 mb-3">Current Assignments</h3>
              {loadingAssignments ? (
                <LoadingState />
              ) : activeAssignments.length === 0 ? (
                <EmptyState title="No active assignments" description="This person has no active assignments." />
              ) : (
                <div className="space-y-2">
                  {activeAssignments.map((a) => (
                    <Link
                      key={a.id}
                      href={`/assignments/${a.id}`}
                      className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary-400 truncate">{a.title}</p>
                        <p className="text-xs text-text-500 capitalize">
                          {a.entityType} &middot; Contribution Role: {a.role || '—'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status] ?? ''}`}>
                        {a.status.replace(/_/g, ' ')}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary-400 mb-3">Assignment History</h3>
              {completedAssignments.length === 0 ? (
                <EmptyState title="No completed assignments" description="Completed assignments will appear here." />
              ) : (
                <div className="space-y-2">
                  {completedAssignments.slice(0, 20).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 opacity-75"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary-400 truncate">{a.title}</p>
                        <p className="text-xs text-text-500 capitalize">
                          {a.entityType} &middot; {a.role || '—'}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success-500/10 text-success-600">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'activity' && (
        <section>
          <h2 className="text-base font-semibold text-primary-400 mb-4">Activity</h2>
          {activities.length === 0 ? (
            <EmptyState
              title="No activity"
              description="Activity will appear when this person is assigned work or their profile is updated."
            />
          ) : (
            <div className="space-y-1">
              {activities.slice(0, 20).map((a) => (
                <div key={a.id} className="flex items-start gap-3 border-l-2 border-surface-700/60 pl-3 py-1">
                  <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
                  <div>
                    <p className="text-sm text-surface-100 capitalize">{a.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-text-500">
                      {a.actorId} &middot; {formatDate(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
