'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgStore } from '@/stores/org-store';
import { useReleases } from '@/hooks/useRelease';
import { useAuth } from '@/contexts/auth-context';
import { getRecentActivity, type ActivityEventRecord } from '@/lib/activity-service';
import {
  resolveActorIdentityKeys,
} from '@/lib/assignment-identity';
import { EmptyState, LoadingState, Button, Badge } from '@releaseflow/ui';
import { ReleaseCard } from '@/components/release/cards/ReleaseCard';
import { AssignmentCard } from '@/components/assignments/cards/AssignmentCard';
import { resolveReleaseCardVariant } from '@/lib/release-workspace';
import {
  loadAssignmentWorkspaceRecords,
  type AssignmentWorkspaceRecord,
} from '@/lib/assignment-workspace-service';
import { buildAssignmentWorkspace } from '@/lib/assignment-workspace';
import { getOrgReadinessSummaries } from '@/lib/release-readiness-service';
import { getTaskDashboardSummary, type TaskDashboardSummary } from '@/lib/task-service';
import type { Release } from '@/app/(app)/types';

function timeAgo(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / (1000 * 60));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value && typeof value === 'object') {
    if ('toDate' in value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    if ('seconds' in value && typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000);
    }
  }
  return null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(user: { displayName?: string | null; email?: string | null } | null | undefined): string {
  if (!user) return '';
  const name = user.displayName?.trim() || user.email?.split('@')[0] || '';
  const firstName = name.split(' ')[0];
  return firstName || '';
}

const TECHNICAL_ACTIONS = new Set([
  'firestore.write',
  'hook.refresh',
  'system.sync',
  'system.recalculate',
  'workflow.generated',
]);

function humaniseActivity(action: string, metadata?: Record<string, unknown>): string {
  if (TECHNICAL_ACTIONS.has(action)) return action.replace(/[._]/g, ' ');
  const labels: Record<string, string> = {
    'release.created': 'Release created',
    'stage.started': `Started stage ${metadata?.stageName ?? ''}`,
    'stage.completed': `Completed stage ${metadata?.stageName ?? ''}`,
    'task.created': `Created task "${metadata?.title ?? ''}"`,
    'task.completed': 'Completed a task',
    'task.assigned': 'Assigned a task',
    'deliverable.created': `Added deliverable "${metadata?.title ?? ''}"`,
    'deliverable.approved': 'Approved a deliverable',
    'deliverable.rejected': 'Rejected a deliverable',
    'deliverable.updated': 'Updated a deliverable',
    'approval.requested': 'Requested an approval',
    'approval.approved': 'Approved',
    'approval.rejected': 'Rejected an approval',
    'comment.added': 'Left a comment',
    'release.status.changed': `Changed status to ${metadata?.newStatus ?? ''}`,
    'campaign.created': 'Created a campaign',
    'release.draft.created': 'Draft created',
    'release.draft.saved': 'Draft saved',
    'release.draft.completed': 'Draft completed',
    'release.lifecycle.changed': `Lifecycle changed to ${metadata?.newLifecycle ?? ''}`,
  };
  return labels[action] ?? action.replace(/[._]/g, ' ');
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeOrgId, orgsLoaded } = useOrgStore();
  const router = useRouter();
  const { releases, loading: releasesLoading } = useReleases();
  const [identityKeys, setIdentityKeys] = useState<Set<string>>(new Set());
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [drafts, setDrafts] = useState<Release[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [myWorkRecords, setMyWorkRecords] = useState<AssignmentWorkspaceRecord[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [taskSummary, setTaskSummary] = useState<TaskDashboardSummary | null>(null);
  const [taskSummaryLoading, setTaskSummaryLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !activeOrgId) {
      setIdentityKeys(new Set());
      return;
    }
    void resolveActorIdentityKeys(activeOrgId, user.uid).then(setIdentityKeys);
  }, [user?.uid, activeOrgId]);

  // BUILD-016 — Dashboard My Work reuses assignment-service + workspace builder
  useEffect(() => {
    if (!activeOrgId || identityKeys.size === 0) {
      setMyWorkRecords([]);
      setAssignmentsLoading(false);
      return;
    }
    setAssignmentsLoading(true);
    void loadAssignmentWorkspaceRecords({
      organizationId: activeOrgId,
      meIdentityKeys: identityKeys,
      sort: 'newest',
    })
      .then((all) => {
        const mine = all.filter((r) => r.isAssignedToMe && !['completed', 'cancelled', 'archived', 'declined'].includes(r.assignment.status));
        const workspace = buildAssignmentWorkspace({ catalogue: mine });
        const needs = workspace.sections.find((s) => s.id === 'needs_attention');
        const due = workspace.sections.find((s) => s.id === 'due_today');
        // Prefer needs attention + due today; fall back to catalogue slice
        const pin = [
          ...(needs?.items ?? []),
          ...(due?.items ?? []).filter((r) => !(needs?.items ?? []).some((n) => n.assignment.id === r.assignment.id)),
        ];
        setMyWorkRecords(pin.length > 0 ? pin.slice(0, 8) : mine.slice(0, 8));
      })
      .catch(() => setMyWorkRecords([]))
      .finally(() => setAssignmentsLoading(false));
  }, [activeOrgId, identityKeys]);

  // BUILD-014 — Tasks widget
  useEffect(() => {
    if (!activeOrgId || !user?.uid) {
      setTaskSummary(null);
      setTaskSummaryLoading(false);
      return;
    }
    setTaskSummaryLoading(true);
    void getTaskDashboardSummary(activeOrgId, user.uid)
      .then(setTaskSummary)
      .catch(() => setTaskSummary(null))
      .finally(() => setTaskSummaryLoading(false));
  }, [activeOrgId, user?.uid]);

  // BUG-009: load drafts via dedicated draft query (lifecycle == draft), not full catalogue filter.
  useEffect(() => {
    if (!user || !activeOrgId) { setDrafts([]); setDraftsLoading(false); return; }
    setDraftsLoading(true);
    void import('@/lib/release-service')
      .then(({ fetchOrganizationDrafts }) => fetchOrganizationDrafts(activeOrgId))
      .then((draftReleases) => {
        setDrafts(draftReleases.slice(0, 5) as Release[]);
      })
      .catch(() => setDrafts([]))
      .finally(() => setDraftsLoading(false));
  }, [user, activeOrgId, releases.length]);

  useEffect(() => {
    if (!user || !activeOrgId) { setLoadingExtras(false); return; }
    getRecentActivity(activeOrgId, 10)
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setLoadingExtras(false));
  }, [user, activeOrgId]);

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(() => getFirstName(user), [user]);

  const [readinessRows, setReadinessRows] = useState<
    Awaited<ReturnType<typeof getOrgReadinessSummaries>>
  >([]);

  useEffect(() => {
    if (!activeOrgId) return;
    let cancelled = false;
    void getOrgReadinessSummaries(activeOrgId).then((rows) => {
      if (!cancelled) setReadinessRows(rows);
    }).catch(() => {
      if (!cancelled) setReadinessRows([]);
    });
    return () => { cancelled = true; };
  }, [activeOrgId, releases.length]);

  const readinessStats = useMemo(() => {
    const ready = readinessRows.filter((r) => r.recommendation === 'ready').length;
    const atRisk = readinessRows.filter((r) => r.recommendation === 'needs_attention').length;
    const blocked = readinessRows.filter((r) => r.recommendation === 'not_ready' || r.blockers.length > 0).length;
    const thisWeek = readinessRows.filter((r) => {
      const d = r.countdown.days;
      return d !== null && d >= 0 && d <= 7;
    }).length;
    return [
      { count: ready, label: 'Releases Ready', filter: 'ready' as const },
      { count: atRisk, label: 'At Risk', filter: 'needs_attention' as const },
      { count: blocked, label: 'Blocked Releases', filter: 'not_ready' as const },
      { count: thisWeek, label: 'Releases This Week', filter: 'week' as const },
    ];
  }, [readinessRows]);

  const stats = useMemo(() => {
    const active = releases.filter((r) => r.lifecycle === 'active');
    const planning = active.filter((r) => r.status === 'planning').length;
    const recording = active.filter((r) => r.status === 'in_production').length;
    const ready = active.filter((r) => r.status === 'ready_for_distribution').length;
    const released = active.filter((r) => r.status === 'released').length;
    return [
      { count: planning, label: 'Planning' },
      { count: recording, label: 'Recording' },
      { count: ready, label: 'Ready' },
      { count: released, label: 'Released' },
    ];
  }, [releases]);

  const upcomingReleases = useMemo(() => {
    return [...releases]
      .filter((r) => r.lifecycle === 'active' && r.status !== 'released' && r.status !== 'cancelled' && r.status !== 'archived')
      .sort((a, b) => {
        const aDate = toDate(a.estimatedReleaseDate || a.targetReleaseDate);
        const bDate = toDate(b.estimatedReleaseDate || b.targetReleaseDate);
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return aDate.getTime() - bDate.getTime();
      })
      .slice(0, 5);
  }, [releases]);

  if (!orgsLoaded || releasesLoading) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center page-transition">
        <EmptyState title="Welcome to ReleaseFlow" description="Create your first release to begin managing production, legal, distribution and collaboration." action={{ label: 'New Release', onClick: () => router.push('/onboarding/company') }} />
      </div>
    );
  }

  // BUG-009B: do not hide the Draft widget when the only releases are drafts.
  // Empty catalogue still shows draft section below (or empty-state with draft path).
  if (releases.length === 0 && drafts.length === 0 && !draftsLoading) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center page-transition">
        <EmptyState title="Welcome to ReleaseFlow" description="Create your first release to begin managing production, legal, distribution and collaboration." action={{ label: 'New Release', onClick: () => router.push('/releases/new') }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-10 page-transition">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-surface-50 tracking-tight">
          {greeting}{firstName ? `, ${firstName}` : ''}.
        </h1>
        <p className="text-body text-text-400 mt-1">What would you like to work on today?</p>
        <div className="mt-4">
          <Button size="md" onClick={() => router.push('/releases/new')}>+ New Release</Button>
        </div>
      </div>

      {draftsLoading ? (
        <div className="mb-10"><LoadingState /></div>
      ) : drafts.length > 0 ? (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-text-500 uppercase tracking-widest">Draft Releases</p>
            <Link href="/releases?lifecycle=draft" className="text-xs text-primary-400 hover:text-primary-300 font-medium">View All Drafts</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {drafts.map((d) => (
              <ReleaseCard
                key={d.id}
                release={d}
                size="compact"
                variant="draft"
                onDeleted={(releaseId) => {
                  setDrafts((prev) => prev.filter((x) => x.id !== releaseId));
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-10">
          <p className="text-xs font-semibold text-text-500 uppercase tracking-widest mb-4">Draft Releases</p>
          <div className="rounded-2xl border border-surface-700/60 bg-surface-900 p-8 text-center">
            <p className="text-sm text-text-400">No draft releases. Start creating a release to continue working later.</p>
          </div>
        </div>
      )}

      <div className="mb-10">
        <p className="text-xs font-semibold text-text-500 uppercase tracking-widest mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/releases/new" className="block rounded-xl border border-surface-700/60 bg-surface-900 p-4 text-center hover:border-primary-500/40 transition-all duration-150">
            <p className="text-sm font-medium text-primary-400">+ New Release</p>
          </Link>
          <Link href="/tracks" className="block rounded-xl border border-surface-700/60 bg-surface-900 p-4 text-center hover:border-primary-500/40 transition-all duration-150">
            <p className="text-sm font-medium text-surface-100">Tracks</p>
          </Link>
          <Link href="/people" className="block rounded-xl border border-surface-700/60 bg-surface-900 p-4 text-center hover:border-primary-500/40 transition-all duration-150">
            <p className="text-sm font-medium text-surface-100">People</p>
          </Link>
          <Link href="/schedule" className="block rounded-xl border border-surface-700/60 bg-surface-900 p-4 text-center hover:border-primary-500/40 transition-all duration-150">
            <p className="text-sm font-medium text-surface-100">Schedule</p>
          </Link>
        </div>
      </div>

      {/* BUILD-014 — Tasks summary */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-text-500 uppercase tracking-widest">Tasks</p>
          <Link href="/tasks" className="text-xs text-primary-400 hover:text-primary-300 font-medium">
            View All
          </Link>
        </div>
        {taskSummaryLoading ? (
          <LoadingState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Assigned to Me', count: taskSummary?.assignedToMe ?? 0, href: '/tasks?filter=assigned_to_me' },
              { label: 'Created by Me', count: taskSummary?.createdByMe ?? 0, href: '/tasks?filter=created_by_me' },
              { label: 'Overdue', count: taskSummary?.overdue ?? 0, href: '/tasks?filter=overdue' },
              { label: 'Due Today', count: taskSummary?.dueToday ?? 0, href: '/tasks?filter=due_today' },
              { label: 'Upcoming', count: taskSummary?.upcoming ?? 0, href: '/tasks?filter=this_week' },
            ].map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="rounded-xl border border-surface-700/60 bg-surface-900 p-4 hover:border-primary-500/40 transition-colors"
              >
                <p className="text-2xl font-bold text-surface-50">{s.count}</p>
                <p className="text-xs text-text-500 mt-1">{s.label}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-surface-700/60 bg-surface-900 p-4">
              <p className="text-2xl font-bold text-surface-50">{s.count}</p>
              <p className="text-xs text-text-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CE-009 — Release readiness summary */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-primary-400 mb-4">Release Readiness</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {readinessStats.map((s) => (
            <div key={s.label} className="rounded-xl border border-surface-700/60 bg-surface-900 p-4">
              <p className="text-2xl font-bold text-surface-50">{s.count}</p>
              <p className="text-xs text-text-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        {readinessRows.length > 0 ? (
          <div className="space-y-2">
            {readinessRows.slice(0, 6).map((r) => (
              <Link
                key={r.releaseId}
                href={`/releases/${r.releaseId}/readiness`}
                className="flex items-center justify-between gap-3 rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-primary-500/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-100 truncate">{r.title}</p>
                  <p className="text-xs text-text-500 mt-0.5">
                    Score {r.readinessScore}
                    {r.overdueAssignments > 0 ? ` · ${r.overdueAssignments} overdue` : ''}
                    {r.blockers.length > 0 ? ` · ${r.blockers.length} blockers` : ''}
                  </p>
                </div>
                <Badge
                  label={
                    r.recommendation === 'ready'
                      ? 'Ready'
                      : r.recommendation === 'needs_attention'
                        ? 'At risk'
                        : 'Not ready'
                  }
                  size="sm"
                  color={
                    r.recommendation === 'ready'
                      ? 'bg-success-500/15 text-success-600'
                      : r.recommendation === 'needs_attention'
                        ? 'bg-warning-500/15 text-warning-600'
                        : 'bg-danger-500/15 text-danger-500'
                  }
                />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-500">Computing readiness…</p>
        )}
      </div>

      <div className="mb-10">
        <h2 className="text-sm font-semibold text-primary-400 mb-4">Upcoming Releases</h2>
        {upcomingReleases.length === 0 ? (
          <p className="text-sm text-text-500">No upcoming releases.</p>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-release-card-grid
            data-count={upcomingReleases.length}
          >
            {upcomingReleases.map((r) => (
              <ReleaseCard
                key={r.id}
                release={r}
                size="standard"
                variant={resolveReleaseCardVariant(r)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-primary-400">My Work</h2>
            <Link href="/assignments" className="text-xs text-primary-400 hover:text-primary-300 font-medium">
              Open workspace
            </Link>
          </div>
          {assignmentsLoading ? <LoadingState /> : myWorkRecords.length === 0 ? (
            <p className="text-sm text-text-500">No assignments require your attention.<br/>You&apos;re all caught up.</p>
          ) : (
            <div className="space-y-2" data-assignment-card-grid data-count={myWorkRecords.length}>
              {myWorkRecords.map((r) => (
                <AssignmentCard key={r.assignment.id} record={r} mode="compact" />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-primary-400 mb-4">Recent Activity</h2>
          {loadingExtras ? <LoadingState /> : activities.length === 0 ? (
            <p className="text-sm text-text-500">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((a) => {
                const label = humaniseActivity(a.action, (a.metadata as Record<string, unknown> | undefined) ?? undefined);
                const date = toDate(a.createdAt);
                return (
                  <div key={a.id} className="flex items-start gap-3">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-primary-500/60 shrink-0" />
                    <div>
                      <p className="text-sm text-surface-100">{label}</p>
                      {date && <p className="text-xs text-text-600 mt-1">{timeAgo(date)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
