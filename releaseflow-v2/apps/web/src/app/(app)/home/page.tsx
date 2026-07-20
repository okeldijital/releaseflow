'use client';

/**
 * MUX-002.1 — Collaborator Home Workspace
 * Daily operational dashboard (not a static greeting).
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { getOrganization } from '@/lib/organization-repository';
import { useAssignments } from '@/hooks/useAssignment';
import { useReleases } from '@/hooks/useRelease';
import { getActivityByUser, getRecentActivity } from '@/lib/activity-service';
import type { ActivityEventRecord } from '@/lib/activity-service';
import {
  resolveActorIdentityKeys,
  assignmentMatchesIdentity,
} from '@/lib/assignment-identity';
import {
  fetchInbox,
  type UserNotificationRecord,
} from '@/lib/notification-engine-service';
import { loadCommentThreads } from '@/lib/assignment-comments-inbox';
import { EmptyState, LoadingState } from '@releaseflow/ui';
import { ReleaseFlowLogo } from '@/components/branding/releaseflow-logo';
import { AssignmentCard, SectionHeader } from '@/components/mobile/assignment-card';
import type { AssignmentCardModel } from '@/components/mobile/assignment-card';
import { humanizeAssignmentActivity } from '@/lib/assignment-activity-humanize';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';
import { ReleaseCard } from '@/components/release/cards/ReleaseCard';
import { resolveReleaseCardVariant } from '@/lib/release-workspace';
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
const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

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
  unreadComments?: number;
  updatedAt?: unknown;
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
    unreadComments: a.unreadComments,
    updatedAt: a.updatedAt,
  };
}

function SummaryTile({
  value,
  label,
  href,
}: {
  value: number;
  label: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-2xl border border-surface-700/50 bg-surface-900/80 px-3 py-3.5 min-h-[72px] flex flex-col justify-center">
      <p className="text-xl font-semibold text-content-primary tabular-nums">{value}</p>
      <p className="text-[11px] text-content-label mt-0.5 leading-tight">{label}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded-2xl">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function HomePage() {
  const { user } = useAuth();
  const { activeOrgId, orgsLoaded } = useOrgStore();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { releases, loading: releasesLoading } = useReleases();
  const { count: notificationCount } = useNotificationBadge();
  const [orgName, setOrgName] = useState('');
  const [identityKeys, setIdentityKeys] = useState<Set<string>>(new Set());
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [notifications, setNotifications] = useState<UserNotificationRecord[]>([]);
  const [unreadComments, setUnreadComments] = useState(0);
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
      getRecentActivity(activeOrgId, 12).catch(() => [] as ActivityEventRecord[]),
      fetchInbox(user.uid, { pageSize: 12 }).catch(() => ({
        notifications: [] as UserNotificationRecord[],
      })),
      loadCommentThreads({
        organizationId: activeOrgId,
        userId: user.uid,
        collaboratorOnly: true,
      }).catch(() => []),
    ]).then(([userActs, orgActs, inbox, threads]) => {
      // Prefer org activity for "Recent Updates", fall back to user
      const merged = (orgActs.length ? orgActs : userActs).slice(0, 5);
      setActivities(merged);
      const items = inbox.notifications ?? [];
      setNotifications(items.filter((n) => !n.isRead).slice(0, 4));
      setUnreadComments(threads.reduce((s, t) => s + t.unreadCount, 0));
    }).finally(() => setLoadingExtras(false));
  }, [user, activeOrgId]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    void import('@/lib/assignment-events').then(({ onAssignmentsChanged }) => {
      unsub = onAssignmentsChanged(() => {
        if (!user?.uid || !activeOrgId) return;
        void loadCommentThreads({
          organizationId: activeOrgId,
          userId: user.uid,
          collaboratorOnly: true,
        }).then((threads) => {
          setUnreadComments(threads.reduce((s, t) => s + t.unreadCount, 0));
        }).catch(() => { /* ignore */ });
      });
    });
    return () => { unsub?.(); };
  }, [user?.uid, activeOrgId]);

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
      const pr = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
      if (pr !== 0) return pr;
      const ad = toDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bd = toDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });
    return sorted[0] ?? null;
  }, [myAssignments]);

  const dueTodayCount = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return myAssignments.filter((a) => {
      const due = toDate(a.dueDate);
      return due && due <= todayEnd;
    }).length;
  }, [myAssignments]);

  const upcomingReleases = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return (releases as Release[])
      .filter((r) => !['cancelled', 'archived', 'released'].includes(r.status))
      .map((r) => ({
        release: r,
        date: toDate(r.targetReleaseDate) ?? toDate(r.estimatedReleaseDate),
      }))
      .filter((x) => x.date && x.date >= now)
      .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0))
      .slice(0, 5);
  }, [releases]);

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
    <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-3xl px-4 sm:px-5 py-5 sm:py-8 page-transition pb-6">
      {/* BRAND-001 — understated logo above greeting (not a hero) */}
      <div className="mb-3 sm:mb-3.5">
        <ReleaseFlowLogo width={88} className="opacity-95" />
      </div>

      {/* Greeting remains primary visual focus */}
      <header className="mb-5 sm:mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-2xl font-semibold text-content-primary tracking-tight leading-tight">
            {greeting}
            {firstName ? (
              <>
                <br />
                <span className="text-primary-400">{firstName}</span>
              </>
            ) : null}
          </h1>
          {orgName ? (
            <p className="text-sm text-content-secondary mt-1.5 truncate">{orgName}</p>
          ) : null}
        </div>
        <Link
          href="/notifications"
          className="relative shrink-0 h-11 w-11 rounded-full bg-surface-800 flex items-center justify-center text-content-secondary hover:text-content-primary focus-visible:ring-2 focus-visible:ring-primary-500/40"
          aria-label={notificationCount > 0 ? `${notificationCount} notifications` : 'Notifications'}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notificationCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-primary-500 text-[10px] font-bold text-white flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          ) : null}
        </Link>
      </header>

      {/* Today's summary */}
      <section className="mb-6" aria-label="Today's summary">
        <SectionHeader title="Today" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <SummaryTile value={myAssignments.length} label="Assignments" href="/assignments" />
          <SummaryTile value={dueTodayCount} label="Due today" href="/assignments" />
          <SummaryTile value={unreadComments} label="Unread comments" href="/comments" />
          <SummaryTile value={upcomingReleases.length} label="Upcoming releases" href="/releases" />
        </div>
      </section>

      {/* Continue working — one primary card */}
      <section className="mb-7" aria-label="Continue working">
        <SectionHeader title="Continue working" href="/assignments" />
        {continueAssignment ? (
          <AssignmentCard
            assignment={toCard(continueAssignment)}
            variant="featured"
            ctaLabel="Continue Assignment"
          />
        ) : (
          <div className="rounded-2xl border border-surface-700/50 bg-surface-900/60 px-4 py-5">
            <p className="text-sm text-content-secondary">You are all caught up.</p>
          </div>
        )}
      </section>

      {/* Recent updates */}
      <section className="mb-7" aria-label="Recent updates">
        <SectionHeader title="Recent updates" />
        {loadingExtras ? (
          <LoadingState />
        ) : activities.length === 0 && notifications.length === 0 ? (
          <p className="text-sm text-content-label px-1">No recent updates.</p>
        ) : (
          <div className="space-y-0 rounded-2xl border border-surface-700/50 bg-surface-900/40 overflow-hidden">
            {activities.slice(0, 5).map((a, i) => {
              const label = humanizeAssignmentActivity(
                a,
                new Map([[a.actorId, 'Someone']]),
              );
              const date = toDate(a.createdAt);
              return (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-surface-700/40' : ''}`}
                >
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary-500/60 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm text-content-primary leading-snug">{label}</p>
                    {date ? <p className="text-xs text-content-label mt-0.5">{timeAgo(date)}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Upcoming releases — BUG-008B: ReleaseCard only */}
      <section className="mb-7" aria-label="Upcoming releases">
        <SectionHeader title="Upcoming releases" href="/releases" count={upcomingReleases.length} />
        {releasesLoading ? (
          <LoadingState />
        ) : upcomingReleases.length === 0 ? (
          <p className="text-sm text-content-label px-1">No upcoming releases scheduled.</p>
        ) : (
          <ul className="space-y-2" data-release-card-grid data-count={upcomingReleases.length}>
            {upcomingReleases.map(({ release }) => (
              <li key={release.id}>
                <ReleaseCard
                  release={release}
                  view="list"
                  variant={resolveReleaseCardVariant(release)}
                  mode="compact"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick access */}
      <section className="mb-4" aria-label="Quick access">
        <SectionHeader title="Quick access" />
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { href: '/releases', label: 'Releases' },
            { href: '/tracks', label: 'Tracks' },
            { href: '/schedule', label: 'Schedule' },
            { href: '/comments', label: 'Comments' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="
                flex items-center justify-center min-h-[52px] rounded-2xl
                border border-surface-700/50 bg-surface-900/80
                text-sm font-semibold text-content-primary
                hover:border-primary-500/40 active:scale-[0.98] transition-all
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40
              "
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
