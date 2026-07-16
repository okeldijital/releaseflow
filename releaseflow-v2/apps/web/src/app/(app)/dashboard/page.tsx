'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgStore } from '@/stores/org-store';
import { useReleases } from '@/hooks/useRelease';
import { useAuth } from '@/contexts/auth-context';
import { getTasksByAssignee } from '@/lib/task-service';
import { getRecentActivity, type ActivityEventRecord } from '@/lib/activity-service';
import type { Task } from '@/app/(app)/types';
import { EmptyState, LoadingState, Button, StatusBadge } from '@releaseflow/ui';
import { ArtworkDisplay } from '@/components/release/artwork-display';

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
  };
  return labels[action] ?? action.replace(/[._]/g, ' ');
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeOrgId, orgsLoaded } = useOrgStore();
  const router = useRouter();
  const { releases, loading: releasesLoading } = useReleases();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  useEffect(() => {
    if (!user || !activeOrgId) { setLoadingExtras(false); return; }
    Promise.all([
      getTasksByAssignee(user.uid).then((d) => d.filter((t) => t.status !== 'done')),
      getRecentActivity(activeOrgId, 10),
    ]).then(([t, a]) => { setTasks(t); setActivities(a); }).finally(() => setLoadingExtras(false));
  }, [user, activeOrgId]);

  const continueRelease = useMemo(() => {
    const unfinished = releases.filter((r) => !['released', 'cancelled', 'archived'].includes(r.status));
    if (unfinished.length === 0) return null;

    const sortedByRecent = [...unfinished].sort((a, b) => {
      const aTime = (a.updatedAt as { seconds: number })?.seconds ?? 0;
      const bTime = (b.updatedAt as { seconds: number })?.seconds ?? 0;
      return bTime - aTime;
    });

    const mostRecent = sortedByRecent[0];
    if (mostRecent && mostRecent.status !== 'planning') return mostRecent;

    const planning = sortedByRecent.find((r) => r.status === 'planning');
    if (planning) return planning;

    const activeStatuses = ['draft', 'in_production', 'on_hold', 'ready_for_distribution'];
    const active = sortedByRecent.find((r) => activeStatuses.includes(r.status));
    return active ?? mostRecent ?? null;
  }, [releases]);

  const nextStep = useMemo(() => {
    if (!continueRelease) return null;
    if (!continueRelease.artwork) return 'Upload artwork';
    return 'Review release';
  }, [continueRelease]);

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(() => getFirstName(user), [user]);

  const stats = useMemo(() => {
    const planning = releases.filter((r) => r.status === 'draft' || r.status === 'planning').length;
    const recording = releases.filter((r) => r.status === 'in_production').length;
    const ready = releases.filter((r) => r.status === 'ready_for_distribution').length;
    const released = releases.filter((r) => r.status === 'released').length;
    return [
      { count: planning, label: 'Planning' },
      { count: recording, label: 'Recording' },
      { count: ready, label: 'Ready' },
      { count: released, label: 'Released' },
    ];
  }, [releases]);

  const upcomingReleases = useMemo(() => {
    return [...releases]
      .filter((r) => r.status !== 'released' && r.status !== 'cancelled' && r.status !== 'archived')
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

  const priorityStyles: Record<string, string> = {
    low: 'bg-surface-800 text-text-400',
    medium: 'bg-info-500/15 text-info-400',
    high: 'bg-warning-500/15 text-warning-400',
    critical: 'bg-danger-500/15 text-danger-400',
  };

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

  if (releases.length === 0) {
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

      {continueRelease && (
        <div className="mb-10">
          <p className="text-xs font-semibold text-text-500 uppercase tracking-widest mb-4">Continue Working</p>
          <Link href={`/releases/${continueRelease.id}`} className="block rounded-2xl border border-surface-700/60 bg-surface-900 hover:border-surface-600 transition-all duration-200 overflow-hidden group">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-48 shrink-0 flex items-center justify-center p-8 bg-surface-800/50">
                <ArtworkDisplay
                  artwork={continueRelease.artwork ?? null}
                  releaseTitle={continueRelease.title}
                  size="lg"
                  className="h-32 w-32 shadow-lg"
                />
              </div>
              <div className="flex-1 p-6 flex flex-col sm:flex-row gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-semibold text-primary-400 tracking-tight">{continueRelease.title}</p>
                  <p className="text-sm text-text-400 mt-0.5 capitalize">{continueRelease.releaseType.replace(/_/g, ' ')}</p>
                  <div className="mt-4 space-y-1">
                    <p className="text-xs text-text-500">Last edited {timeAgo(toDate(continueRelease.updatedAt) ?? new Date())}</p>
                  </div>
                  <div className="mt-5">
                    <span className="text-sm font-medium text-primary-400 group-hover:text-primary-300 transition-colors">Continue Release →</span>
                  </div>
                </div>
                <div className="sm:w-48 shrink-0 border-l border-surface-700/60 pl-6 flex flex-col justify-center">
                  {nextStep && (
                    <>
                      <p className="text-xs font-semibold text-text-500 uppercase tracking-wider mb-2">Next step</p>
                      <p className="text-sm text-surface-200">{nextStep}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
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

      <div className="mb-10">
        <h2 className="text-sm font-semibold text-primary-400 mb-4">Upcoming Releases</h2>
        {upcomingReleases.length === 0 ? (
          <p className="text-sm text-text-500">No upcoming releases.</p>
        ) : (
          <div className="space-y-2">
            {upcomingReleases.map((r) => {
              const date = toDate(r.estimatedReleaseDate || r.targetReleaseDate);
              return (
                <Link
                  key={r.id}
                  href={`/releases/${r.id}`}
                  className="flex items-center gap-3 rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-primary-500/40 transition-all duration-150 group"
                >
                  <ArtworkDisplay
                    artwork={r.artwork ?? null}
                    releaseTitle={r.title}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-400 truncate group-hover:text-primary-300 transition-colors">{r.title}</p>
                    <p className="text-xs text-text-500 mt-0.5 capitalize">{r.releaseType.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-text-400">{date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-primary-400 mb-4">Waiting for You</h2>
          {loadingExtras ? <LoadingState /> : tasks.length === 0 ? (
            <p className="text-sm text-text-500">No work requires your attention.<br/>You&apos;re all caught up.</p>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 8).map((t) => {
                const dueDate = toDate(t.dueDate);
                return (
                  <Link key={t.id} href={`/releases/${t.releaseId}`} className="block rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-primary-500/40 transition-all duration-150">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-surface-100 truncate">{t.title}</p>
                      <span className={`text-caption font-medium px-2 py-0.5 rounded-full ${priorityStyles[t.priority] ?? 'bg-surface-800 text-text-400'}`}>{t.priority}</span>
                    </div>
                    {dueDate && <p className="text-xs text-text-500 mt-1">Due {timeAgo(dueDate)}</p>}
                  </Link>
                );
              })}
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
