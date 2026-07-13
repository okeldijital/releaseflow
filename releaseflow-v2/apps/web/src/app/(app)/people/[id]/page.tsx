'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePerson } from '@/hooks/usePerson';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';

import {
  archivePerson as serviceArchive, restorePerson as serviceRestore,
} from '@/lib/person-service';
import { getAssignmentsByAssignee, getAssignmentsByEntity } from '@/lib/assignment-repository';
import type { AssignmentRecord } from '@/lib/assignment-repository';
import { getRelease } from '@/lib/release-repository';
import { resendPersonInvitation, cancelInvitation } from '@/lib/invitation-service';
import {
  Avatar, Card, EmptyState, LoadingState, Tabs, Skeleton, StatusBadge,
} from '@releaseflow/ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';

type TabId = 'overview' | 'assignments' | 'activity';

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
  review: 'bg-accent-500/10 text-accent-400',
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
  const [assignedReleases, setAssignedReleases] = useState<{ id: string; title: string; role: string; status: string }[]>([]);
  const [loadingWorkload, setLoadingWorkload] = useState(true);

  const [tab, setTab] = useState<TabId>('overview');

  useEffect(() => {
    let cancelled = false;
    async function loadAssignments() {
      if (!id) return;
      setLoadingAssignments(true);
      try {
        const data = await getAssignmentsByAssignee(id, activeOrgId ?? undefined);
        if (!cancelled) setPersonAssignments(data);
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
    let cancelled = false;
    async function loadWorkload() {
      if (!id || !activeOrgId) return;
      setLoadingWorkload(true);
      try {
        const relAssigns = await getAssignmentsByEntity('release', id);
        if (!cancelled) {
          const uniqueReleaseIds = [...new Set(relAssigns.map((a) => a.entityId))];
          const releaseDetails = await Promise.all(
            uniqueReleaseIds.map(async (rid) => {
              const release = await getRelease(rid);
              const assignment = relAssigns.find(a => a.entityId === rid);
              return {
                id: rid,
                title: release?.title ?? rid,
                role: assignment?.role ?? '',
                status: assignment?.status ?? '',
              };
            })
          );
          setAssignedReleases(releaseDetails);
        }
      } catch {
        if (!cancelled) setAssignedReleases([]);
      } finally {
        if (!cancelled) setLoadingWorkload(false);
      }
    }
    void loadWorkload();
    return () => { cancelled = true; };
  }, [id, activeOrgId]);

  const collaboratorStatus = useMemo(() => {
    if (!person) return 'Active';
    if (person.invitationStatus === 'pending' || person.invitationStatus === 'invited') return 'Pending Invitation';
    if (person.invitationStatus === 'revoked' as string) return 'Revoked';
    if (person.status === 'archived') return 'Inactive';
    return 'Active';
  }, [person]);

  const activeAssignments = useMemo(() => personAssignments.filter((a) => !['completed', 'archived', 'cancelled', 'declined'].includes(a.status)), [personAssignments]);
  const completedAssignments = useMemo(() => personAssignments.filter((a) => a.status === 'completed'), [personAssignments]);

  async function handleArchive() {
    if (!id) return;
    try {
      await serviceArchive(id);
      await refresh();
    } catch {
      // silent
    }
  }

  async function handleRestore() {
    if (!id) return;
    try {
      await serviceRestore(id);
      await refresh();
    } catch {
      // silent
    }
  }

  async function handleResend() {
    if (!id) return;
    try {
      await resendPersonInvitation(id, user?.uid ?? '', activeOrgId ?? '');
      await refresh();
    } catch {
      // silent
    }
  }

  async function handleCancel() {
    if (!id) return;
    try {
      await cancelInvitation(id, user?.uid ?? '', activeOrgId ?? '');
      await refresh();
    } catch {
      // silent
    }
  }

  const actionMenuItems = [
    { id: 'view', label: 'View Profile', onClick: () => {} },
    ...(collaboratorStatus === 'Pending Invitation' ? [
      { id: 'resend', label: 'Resend Invitation', onClick: handleResend },
      { id: 'cancel', label: 'Cancel Invitation', variant: 'danger' as const, onClick: handleCancel },
    ] : []),
    ...(person?.status === 'archived'
      ? [{ id: 'reactivate', label: 'Reactivate', onClick: handleRestore }]
      : [{ id: 'deactivate', label: 'Deactivate', variant: 'danger' as const, onClick: handleArchive }]
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
    return <div className="flex items-center justify-center py-20"><p className="text-text-400">Person not found.</p></div>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'assignments', label: 'Assignments', count: assignmentSummary ? assignmentSummary.current + assignmentSummary.upcoming : undefined },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-6">
        <Link href="/people" className="text-sm text-text-400 hover:text-surface-50 inline-block">&larr; Back to People</Link>
      </div>

      {/* ===== Header ===== */}
      <div className="flex items-start gap-5 mb-8">
        <Avatar name={person.displayName} src={person.avatarUrl ?? undefined} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">{person.displayName}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <span className="text-sm text-text-400">{person.primaryRole || '—'}</span>
                <StatusBadge status={collaboratorStatus.toLowerCase().replace(/ /g, '_')} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-text-500">
                {person.email && <span>Email: <span className="text-surface-100">{person.email}</span></span>}
                {person.createdAt != null && <span>Invited: <span className="text-surface-100">{formatDate(person.createdAt)}</span></span>}
              </div>
            </div>
            <div className="shrink-0">
              <EntityOverflowMenu items={actionMenuItems} aria-label="Person actions" />
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={tab} onChange={(t) => setTab(t as TabId)} variant="underline" className="mb-8" />

      {/* ===== Overview Tab ===== */}
      {tab === 'overview' && (
        <div className="space-y-8">
          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Assigned Releases</h2>
            {loadingWorkload ? (
              <Card><Skeleton className="h-12 w-full" /></Card>
            ) : assignedReleases.length === 0 ? (
              <Card><p className="text-sm text-text-500">No releases assigned to this person.</p></Card>
            ) : (
              <div className="space-y-2">
                {assignedReleases.map((r) => (
                  <Link key={r.id} href={`/releases/${r.id}`} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary-400 truncate">{r.title}</p>
                      <p className="text-xs text-text-500">{r.role || 'Collaborator'}</p>
                    </div>
                    <StatusBadge status={r.status || 'active'} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Assignments</h2>
            {loadingAssignments ? (
              <LoadingState />
            ) : activeAssignments.length === 0 ? (
              <EmptyState title="No active assignments" description="This person has no active assignments." />
            ) : (
              <div className="space-y-2">
                {activeAssignments.map((a) => (
                  <Link key={a.id} href={`/assignments/${a.id}`} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary-400 truncate">{a.title}</p>
                      <p className="text-xs text-text-500 capitalize">{a.entityType} &middot; {a.role}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.dueDate != null && (
                        <span className="text-xs text-text-500">
                          {formatDate(a.dueDate)}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status] ?? ''}`}>{a.status.replace(/_/g, ' ')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Activity</h2>
            {activities.length === 0 ? (
              <EmptyState title="No activity" description="Activity will appear when this person is assigned work or their profile is updated." />
            ) : (
              <div className="space-y-1">
                {activities.slice(0, 20).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 border-l-2 border-surface-700/60 pl-3 py-1">
                    <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
                    <div>
                      <p className="text-sm text-surface-100 capitalize">{a.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-text-500">{a.actorId} &middot; {formatDate(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ===== Assignments Tab ===== */}
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
          ) : (
            <Card className="mb-8">
              <p className="text-sm text-text-500">Loading assignment data...</p>
            </Card>
          )}

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
                    <Link key={a.id} href={`/assignments/${a.id}`} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary-400 truncate">{a.title}</p>
                        <p className="text-xs text-text-500 capitalize">{a.entityType} &middot; {a.role}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {a.dueDate != null && <span className="text-xs text-text-500">{formatDate(a.dueDate)}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status] ?? ''}`}>{a.status.replace(/_/g, ' ')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary-400 mb-3">Assignment History</h3>
              {loadingAssignments ? (
                <LoadingState />
              ) : completedAssignments.length === 0 ? (
                <EmptyState title="No completed assignments" description="Completed assignments will appear here." />
              ) : (
                <div className="space-y-2">
                  {completedAssignments.slice(0, 20).map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 opacity-75">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary-400 truncate">{a.title}</p>
                        <p className="text-xs text-text-500 capitalize">{a.entityType} &middot; {a.role}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-success-500/10 text-success-600`}>Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== Activity Tab ===== */}
      {tab === 'activity' && (
        <section>
          <h2 className="text-base font-semibold text-primary-400 mb-4">Activity</h2>
          {activities.length === 0 ? (
            <EmptyState title="No activity" description="Activity will appear when this person is assigned work or their profile is updated." />
          ) : (
            <div className="space-y-1">
              {activities.slice(0, 20).map((a) => (
                <div key={a.id} className="flex items-start gap-3 border-l-2 border-surface-700/60 pl-3 py-1">
                  <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
                  <div>
                    <p className="text-sm text-surface-100 capitalize">{a.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-text-500">{a.actorId} &middot; {formatDate(a.createdAt)}</p>
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
