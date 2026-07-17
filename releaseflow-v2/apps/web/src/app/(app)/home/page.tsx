'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { getOrganization } from '@/lib/organization-repository';
import { useAssignments } from '@/hooks/useAssignment';
import { getActivityByUser } from '@/lib/activity-service';
import type { ActivityEventRecord } from '@/lib/activity-service';
import { EmptyState, LoadingState, StatusBadge } from '@releaseflow/ui';

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

const ASSIGNMENT_RELATED_ACTIONS = new Set([
  'task.created',
  'task.completed',
  'task.assigned',
  'task.reassigned',
  'task.unassigned',
  'deliverable.created',
  'deliverable.updated',
  'deliverable.approved',
  'deliverable.rejected',
  'approval.requested',
  'approval.approved',
  'approval.rejected',
  'comment.added',
]);

function humaniseActivity(action: string, metadata?: Record<string, unknown>): string {
  const labels: Record<string, string> = {
    'task.created': `Task created: ${(metadata?.title as string) ?? ''}`,
    'task.completed': 'Completed a task',
    'task.assigned': 'You were assigned a task',
    'deliverable.created': 'Deliverable added',
    'deliverable.approved': 'Deliverable approved',
    'deliverable.rejected': 'Deliverable rejected',
    'deliverable.updated': 'Deliverable updated',
    'approval.requested': 'Approval requested',
    'approval.approved': 'Approved',
    'approval.rejected': 'Rejected',
    'comment.added': 'Comment added',
  };
  return labels[action] ?? action.replace(/[._]/g, ' ');
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
    case 'critical': return 'bg-danger-500/15 text-danger-400';
    case 'high': return 'bg-warning-500/15 text-warning-400';
    case 'medium': return 'bg-primary-500/10 text-primary-400';
    default: return 'bg-surface-800 text-text-400';
  }
}

export default function HomePage() {
  const { user } = useAuth();
  const { activeOrgId, orgsLoaded } = useOrgStore();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const [orgName, setOrgName] = useState<string>('');
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  useEffect(() => {
    if (!activeOrgId) return;
    getOrganization(activeOrgId).then((org) => {
      if (org) setOrgName(org.name);
    });
  }, [activeOrgId]);

  useEffect(() => {
    if (!user || !activeOrgId) { setLoadingExtras(false); return; }
    getActivityByUser(user.uid, 20).then((data) => {
      setActivities(data.filter((a) => ASSIGNMENT_RELATED_ACTIONS.has(a.action)));
    }).finally(() => setLoadingExtras(false));
  }, [user, activeOrgId]);

  const myAssignments = useMemo(() => {
    return assignments.filter((a) => a.assigneeId === user?.uid && !['completed', 'cancelled', 'archived', 'declined'].includes(a.status));
  }, [assignments, user?.uid]);

  const continueAssignment = useMemo(() => {
    const active = myAssignments.filter((a) => ['assigned', 'accepted', 'in_progress', 'review'].includes(a.status));
    const sorted = [...active].sort((a, b) => {
      const aTime = (a.updatedAt as { seconds: number })?.seconds ?? 0;
      const bTime = (b.updatedAt as { seconds: number })?.seconds ?? 0;
      return bTime - aTime;
    });
    return sorted[0] ?? null;
  }, [myAssignments]);

  const todaysAssignments = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return myAssignments
      .filter((a) => {
        const due = toDate(a.dueDate);
        return due && due <= todayEnd;
      })
      .slice(0, 5);
  }, [myAssignments]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return myAssignments
      .filter((a) => {
        const due = toDate(a.dueDate);
        return due && due > now;
      })
      .sort((a, b) => {
        const aDate = toDate(a.dueDate)?.getTime() ?? 0;
        const bDate = toDate(b.dueDate)?.getTime() ?? 0;
        return aDate - bDate;
      })
      .slice(0, 5);
  }, [myAssignments]);

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(() => getFirstName(user), [user]);

  if (!orgsLoaded || assignmentsLoading) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center page-transition">
        <EmptyState title="Welcome to ReleaseFlow" description="Select an organization to get started." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 page-transition">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-surface-50 tracking-tight">
          {greeting}{firstName ? `, ${firstName}` : ''}.
        </h1>
        {orgName && (
          <p className="text-sm text-text-400 mt-1">{orgName}</p>
        )}
      </div>

      {/* Continue Working */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-text-500 uppercase tracking-widest mb-3">Continue Working</h2>
        {continueAssignment ? (
          <Link
            href={`/assignments/${continueAssignment.id}`}
            className="block rounded-xl border border-surface-700/60 bg-surface-900 hover:border-primary-500/40 transition-all duration-200 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-base sm:text-lg font-semibold text-primary-400 truncate">
                  {continueAssignment.title}
                </p>
                <p className="text-sm text-text-400 mt-1">
                  {continueAssignment.entityType === 'release' ? 'Release' : continueAssignment.entityType}
                  {continueAssignment.entityId ? ` #${continueAssignment.entityId.slice(0, 8)}` : ''}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  {continueAssignment.dueDate ? (
                    <span className="text-xs text-text-500">
                      Due {toDate(continueAssignment.dueDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? '—'}
                    </span>
                  ) : null}
                  <StatusBadge status={continueAssignment.status} />
                </div>
              </div>
              <span className="shrink-0 text-sm font-medium text-primary-400 mt-1">Continue &rarr;</span>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-5">
            <p className="text-sm text-text-400">No active work.</p>
          </div>
        )}
      </div>

      {/* Today's Assignments */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-text-500 uppercase tracking-widest">Today&apos;s Assignments</h2>
          {myAssignments.length > 5 && (
            <Link href="/assignments" className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">
              View All
            </Link>
          )}
        </div>
        {todaysAssignments.length === 0 ? (
          <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-5">
            <p className="text-sm text-text-400">No assignments due today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysAssignments.map((a) => (
              <Link
                key={a.id}
                href={`/assignments/${a.id}`}
                className="flex items-center gap-3 rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-primary-500/40 transition-all duration-150"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-100 truncate">{a.title}</p>
                  <p className="text-xs text-text-500 mt-0.5">
                    {a.entityType === 'release' ? 'Release' : a.entityType}
                    {a.entityId ? ` #${a.entityId.slice(0, 8)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-caption font-medium px-2 py-0.5 rounded-full ${priorityColor(a.priority)}`}>
                    {a.priority}
                  </span>
                  {a.dueDate ? (
                    <span className="text-xs text-text-500">
                      {toDate(a.dueDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? ''}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Two-column layout for Upcoming + Recent Activity */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Upcoming */}
        <div>
          <h2 className="text-xs font-semibold text-text-500 uppercase tracking-widest mb-3">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-text-400">No upcoming deadlines.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => {
                const due = toDate(a.dueDate);
                const isSoon = due && due.getTime() < Date.now() + 3 * 24 * 60 * 60 * 1000;
                return (
                  <Link
                    key={a.id}
                    href={`/assignments/${a.id}`}
                    className={`block rounded-xl border bg-surface-900 px-4 py-3 hover:border-primary-500/40 transition-all duration-150 ${
                      isSoon ? 'border-warning-500/40' : 'border-surface-700/60'
                    }`}
                  >
                    <p className="text-sm font-medium text-surface-100 truncate">{a.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {due && (
                        <span className={`text-xs ${isSoon ? 'text-warning-400' : 'text-text-500'}`}>
                          {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      <StatusBadge status={a.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xs font-semibold text-text-500 uppercase tracking-widest mb-3">Recent Activity</h2>
          {loadingExtras ? (
            <LoadingState />
          ) : activities.length === 0 ? (
            <p className="text-sm text-text-400">No recent activity.</p>
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
