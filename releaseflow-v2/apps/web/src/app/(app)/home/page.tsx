'use client';

/**
 * MUX-001 — Collaborator home: assignment-first mobile experience.
 * Surfaces “What do I need to do next?” immediately.
 * No release creation or management actions.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { getOrganization } from '@/lib/organization-repository';
import { useAssignments } from '@/hooks/useAssignment';
import { getActivityByUser } from '@/lib/activity-service';
import type { ActivityEventRecord } from '@/lib/activity-service';
import {
  resolveActorIdentityKeys,
  assignmentMatchesIdentity,
} from '@/lib/assignment-identity';
import {
  fetchInbox,
  type UserNotificationRecord,
} from '@/lib/notification-engine-service';
import { EmptyState, LoadingState } from '@releaseflow/ui';
import { AssignmentCard, SectionHeader } from '@/components/mobile/assignment-card';
import type { AssignmentCardModel } from '@/components/mobile/assignment-card';

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
    if ('toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate();
    }
    if ('seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
      return new Date((value as { seconds: number }).seconds * 1000);
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
  return name.split(' ')[0] || '';
}

const OPEN_STATUSES = new Set(['assigned', 'accepted', 'in_progress', 'review', 'blocked']);

function humaniseActivity(action: string, metadata?: Record<string, unknown>): string {
  const labels: Record<string, string> = {
    'task.created': `Task created: ${(metadata?.title as string) ?? ''}`,
    'task.completed': 'Completed a task',
    'task.assigned': 'You were assigned a task',
    assigned: `Assignment created: ${(metadata?.title as string) ?? ''}`,
    'assignment.created': `Assignment created: ${(metadata?.title as string) ?? ''}`,
    'deliverable.created': 'Deliverable added',
    'deliverable.approved': 'Deliverable approved',
    'comment.added': 'Comment added',
    'approval.requested': 'Approval requested',
  };
  return labels[action] ?? action.replace(/[._]/g, ' ');
}

function toCard(a: {
  id: string;
  title: string;
  role?: string | null;
  priority?: string | null;
  status: string;
  dueDate?: unknown;
  releaseTitle?: string | null;
  releaseArtwork?: { secureUrl?: string | null } | null;
  entityType?: string | null;
}): AssignmentCardModel {
  return {
    id: a.id,
    title: a.title,
    role: a.role,
    priority: a.priority,
    status: a.status,
    dueDate: a.dueDate,
    releaseTitle: a.releaseTitle,
    releaseArtwork: a.releaseArtwork,
    entityType: a.entityType,
  };
}

export default function HomePage() {
  const { user } = useAuth();
  const { activeOrgId, orgsLoaded } = useOrgStore();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const [orgName, setOrgName] = useState('');
  const [identityKeys, setIdentityKeys] = useState<Set<string>>(new Set());
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [notifications, setNotifications] = useState<UserNotificationRecord[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  useEffect(() => {
    if (!activeOrgId) return;
    getOrganization(activeOrgId).then((org) => {
      if (org) setOrgName(org.name);
    });
  }, [activeOrgId]);

  useEffect(() => {
    if (!user?.uid || !activeOrgId) {
      setIdentityKeys(new Set());
      return;
    }
    void resolveActorIdentityKeys(activeOrgId, user.uid).then(setIdentityKeys);
  }, [user?.uid, activeOrgId]);

  useEffect(() => {
    if (!user || !activeOrgId) {
      setLoadingExtras(false);
      return;
    }
    setLoadingExtras(true);
    Promise.all([
      getActivityByUser(user.uid, 12).catch(() => [] as ActivityEventRecord[]),
      fetchInbox(user.uid, { pageSize: 12 }).catch(() => ({
        notifications: [] as UserNotificationRecord[],
      })),
    ]).then(([acts, inbox]) => {
      setActivities(acts.slice(0, 6));
      const items = inbox.notifications ?? [];
      setNotifications(items.filter((n) => !n.isRead).slice(0, 4));
    }).finally(() => setLoadingExtras(false));
  }, [user, activeOrgId]);

  // Live-refresh inbox when assignments change (notifications processed on create)
  useEffect(() => {
    let unsub: (() => void) | undefined;
    void import('@/lib/assignment-events').then(({ onAssignmentsChanged }) => {
      unsub = onAssignmentsChanged(() => {
        if (!user?.uid) return;
        void fetchInbox(user.uid, { pageSize: 12 }).then((inbox) => {
          const items = inbox.notifications ?? [];
          setNotifications(items.filter((n) => !n.isRead).slice(0, 4));
        }).catch(() => { /* ignore */ });
      });
    });
    return () => { unsub?.(); };
  }, [user?.uid]);

  const myAssignments = useMemo(() => {
    return assignments.filter(
      (a) => assignmentMatchesIdentity(a, identityKeys) && OPEN_STATUSES.has(a.status),
    );
  }, [assignments, identityKeys]);

  const continueAssignment = useMemo(() => {
    const active = myAssignments.filter((a) =>
      ['assigned', 'accepted', 'in_progress', 'review'].includes(a.status),
    );
    const sorted = [...active].sort((a, b) => {
      const aTime = (a.updatedAt as { seconds?: number })?.seconds ?? 0;
      const bTime = (b.updatedAt as { seconds?: number })?.seconds ?? 0;
      return bTime - aTime;
    });
    return sorted[0] ?? null;
  }, [myAssignments]);

  const dueToday = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return myAssignments
      .filter((a) => {
        const due = toDate(a.dueDate);
        if (!due) return false;
        return due <= todayEnd;
      })
      .sort((a, b) => {
        const ad = toDate(a.dueDate)?.getTime() ?? 0;
        const bd = toDate(b.dueDate)?.getTime() ?? 0;
        // Overdue first
        if (ad < todayStart.getTime() && bd >= todayStart.getTime()) return -1;
        if (bd < todayStart.getTime() && ad >= todayStart.getTime()) return 1;
        return ad - bd;
      })
      .slice(0, 6);
  }, [myAssignments]);

  const upcoming = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return myAssignments
      .filter((a) => {
        const due = toDate(a.dueDate);
        return due && due > todayEnd;
      })
      .sort((a, b) => (toDate(a.dueDate)?.getTime() ?? 0) - (toDate(b.dueDate)?.getTime() ?? 0))
      .slice(0, 5);
  }, [myAssignments]);

  const waiting = useMemo(() => {
    return myAssignments.filter((a) => a.status === 'review').slice(0, 5);
  }, [myAssignments]);

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(() => getFirstName(user), [user]);

  if (!orgsLoaded || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState />
      </div>
    );
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center page-transition">
        <EmptyState title="Welcome to ReleaseFlow" description="Select an organization to get started." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-3xl px-4 sm:px-5 py-5 sm:py-8 page-transition pb-4">
      {/* Greeting — assignment context only */}
      <header className="mb-6 sm:mb-8">
        <h1 className="text-[22px] sm:text-2xl font-semibold text-surface-50 tracking-tight leading-tight">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        {orgName ? (
          <p className="text-sm text-text-400 mt-1">{orgName}</p>
        ) : null}
        <p className="text-sm text-text-500 mt-2">
          {myAssignments.length === 0
            ? 'You are all caught up.'
            : `${myAssignments.length} open assignment${myAssignments.length === 1 ? '' : 's'}`}
        </p>
      </header>

      {/* Primary: continue / featured */}
      {continueAssignment ? (
        <section className="mb-7">
          <SectionHeader title="Up next" />
          <AssignmentCard
            assignment={toCard(continueAssignment)}
            variant="featured"
            ctaLabel="Continue Assignment"
          />
        </section>
      ) : null}

      {/* Due today (includes overdue) */}
      <section className="mb-7">
        <SectionHeader title="Due today" href="/assignments" count={dueToday.length} />
        {dueToday.length === 0 ? (
          <div className="rounded-2xl border border-surface-700/50 bg-surface-900/60 px-4 py-5">
            <p className="text-sm text-text-400">Nothing due today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dueToday.map((a) => (
              <AssignmentCard key={a.id} assignment={toCard(a)} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section className="mb-7">
        <SectionHeader title="Upcoming" href="/assignments" count={upcoming.length} />
        {upcoming.length === 0 ? (
          <p className="text-sm text-text-500 px-1">No upcoming deadlines.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <AssignmentCard key={a.id} assignment={toCard(a)} />
            ))}
          </div>
        )}
      </section>

      {/* Waiting on review */}
      {waiting.length > 0 ? (
        <section className="mb-7">
          <SectionHeader title="Waiting" count={waiting.length} />
          <div className="space-y-3">
            {waiting.map((a) => (
              <AssignmentCard key={a.id} assignment={toCard(a)} ctaLabel="View Assignment" />
            ))}
          </div>
        </section>
      ) : null}

      {/* Notifications (unread first) */}
      <section className="mb-7">
        <SectionHeader title="Notifications" href="/notifications" count={notifications.length} />
        {loadingExtras ? (
          <LoadingState />
        ) : notifications.length === 0 ? (
          <p className="text-sm text-text-500 px-1">No unread notifications.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href="/notifications"
                className="block rounded-2xl border border-primary-500/25 bg-primary-500/5 px-4 py-3.5 min-h-[56px] active:scale-[0.99] transition-transform"
              >
                <p className="text-sm font-medium text-primary-300 line-clamp-1">{n.title}</p>
                <p className="text-xs text-text-400 mt-0.5 line-clamp-2">{n.message}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section className="mb-4">
        <SectionHeader title="Recent activity" />
        {loadingExtras ? (
          <LoadingState />
        ) : activities.length === 0 ? (
          <p className="text-sm text-text-500 px-1">No recent activity.</p>
        ) : (
          <div className="space-y-3 rounded-2xl border border-surface-700/50 bg-surface-900/40 px-4 py-3">
            {activities.map((a) => {
              const label = humaniseActivity(
                a.action,
                (a.metadata as Record<string, unknown> | undefined) ?? undefined,
              );
              const date = toDate(a.createdAt);
              return (
                <div key={a.id} className="flex items-start gap-3 py-1">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary-500/60 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-surface-100 leading-snug">{label}</p>
                    {date ? <p className="text-xs text-text-600 mt-0.5">{timeAgo(date)}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
