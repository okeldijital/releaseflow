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
import { EmptyState, LoadingState } from '@releaseflow/ui';

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

  const activeRelease = useMemo(() => {
    if (!releases.length) return null;
    const sorted = [...releases].sort((a, b) => {
      const aTime = (a.updatedAt as { seconds: number })?.seconds ?? 0;
      const bTime = (b.updatedAt as { seconds: number })?.seconds ?? 0;
      return bTime - aTime;
    });
    return sorted[0] ?? null;
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

  if (!activeRelease) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center page-transition">
        <EmptyState title="Welcome to ReleaseFlow" description="Create your first release to begin managing production, legal, distribution and collaboration." action={{ label: 'New Release', onClick: () => router.push('/releases/new') }} />
      </div>
    );
  }

  const release = activeRelease;
  const readinessSections = [
    { key: 'tracks', label: 'Tracks', done: true },
    { key: 'artwork', label: 'Artwork', done: true },
    { key: 'publishing', label: 'Publishing', done: false },
    { key: 'promotion', label: 'Promotion', done: true },
    { key: 'email', label: 'Email', done: false },
    { key: 'distribution', label: 'Distribution', done: false },
    { key: 'quality', label: 'Quality Control', done: false },
  ];
  const doneCount = readinessSections.filter((s) => s.done).length;
  const readinessPct = Math.round((doneCount / readinessSections.length) * 100);
  const releaseTypeLabel = { single: 'Single', ep: 'EP', album: 'Album', compilation: 'Compilation', remix: 'Remix' }[release.releaseType as string] ?? release.releaseType;
const artistName = (release as unknown as Record<string, unknown>).primaryArtist as string || (release as unknown as Record<string, unknown>).artist as string || '—';
const label = (release as unknown as Record<string, unknown>).label as string || '—';
const genre = (release as unknown as Record<string, unknown>).genre as string || '—';
const language = (release as unknown as Record<string, unknown>).language as string || '—';
  const catalogueNumber = (release as unknown as Record<string, unknown>).catalogueNumber as string || '—';
  const targetDate = release.targetReleaseDate ? new Date(release.targetReleaseDate as string).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set';

  const activeReleases = releases.length;
  const dueThisWeek = releases.filter((r) => {
    if (!r.targetReleaseDate) return false;
    const d = new Date(r.targetReleaseDate as string);
    const now = new Date();
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    return d >= now && d <= weekEnd;
  }).length;
  const completedThisMonth = releases.filter((r) => r.status === 'released').length;

  const initial = release.title?.charAt(0)?.toUpperCase() || 'R';
  const priorityStyles: Record<string, string> = { low: 'bg-surface-800 text-text-400', medium: 'bg-info-500/15 text-info-400', high: 'bg-warning-500/15 text-warning-400', critical: 'bg-danger-500/15 text-danger-400' };

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-10 page-transition">
      {/* Current Release Hero */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-text-500 uppercase tracking-widest mb-4">Current Release</p>
        <Link href={`/releases/${release.id}`} className="block rounded-2xl border border-surface-700/60 bg-surface-900 hover:border-surface-600 transition-all duration-200 overflow-hidden group">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-48 shrink-0 flex items-center justify-center p-8 bg-gradient-to-br from-primary-500/20 to-primary-500/5">
              {/* Placeholder artwork */}
              <div className="h-32 w-32 rounded-xl bg-gradient-to-br from-primary-500 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="text-5xl font-bold text-surface-50/90">{initial}</span>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col sm:flex-row gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-xl font-semibold text-primary-400 tracking-tight">{release.title}</p>
                <p className="text-sm text-text-400 mt-0.5">{releaseTypeLabel} · {artistName}</p>
                <p className="text-xs text-text-500 mt-1">{label}</p>
                <div className="mt-4 space-y-1">
                  <div className="flex items-center gap-2"><span className="text-xs text-text-500 w-28 shrink-0">Release Date</span><span className="text-xs text-surface-200">{targetDate}</span></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-text-500 w-28 shrink-0">Genre</span><span className="text-xs text-surface-200">{genre}</span></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-text-500 w-28 shrink-0">Language</span><span className="text-xs text-surface-200">{language}</span></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-text-500 w-28 shrink-0">Cat. Number</span><span className="text-xs text-surface-200">{catalogueNumber}</span></div>
                </div>
                <div className="mt-5">
                  <span className="text-sm font-medium text-primary-400 group-hover:text-primary-300 transition-colors">View Release →</span>
                </div>
              </div>
              <div className="sm:w-48 shrink-0 border-l border-surface-700/60 pl-6 flex flex-col justify-center">
                <p className="text-3xl font-bold text-surface-50">{readinessPct}%</p>
                <div className="mt-2 h-2 rounded-full bg-surface-800 overflow-hidden">
                  <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${readinessPct}%` }} />
                </div>
                <p className="text-xs text-text-500 mt-1.5">{doneCount} / {readinessSections.length} sections complete</p>
                <div className="mt-3 space-y-1">
                  {readinessSections.map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <span className="text-xs">{s.done ? '✓' : '⚠'}</span>
                      <span className={`text-xs ${s.done ? 'text-surface-200' : 'text-text-500'}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-4">
          <p className="text-2xl font-bold text-surface-50">{releases.length}</p>
          <p className="text-xs text-text-500 mt-1">Total Releases</p>
        </div>
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-4">
          <p className="text-2xl font-bold text-surface-50">{activeReleases}</p>
          <p className="text-xs text-text-500 mt-1">Active Releases</p>
        </div>
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-4">
          <p className="text-2xl font-bold text-surface-50">{dueThisWeek}</p>
          <p className="text-xs text-text-500 mt-1">Due This Week</p>
        </div>
        <div className="rounded-xl border border-surface-700/60 bg-surface-900 p-4">
          <p className="text-2xl font-bold text-surface-50">{completedThisMonth}</p>
          <p className="text-xs text-text-500 mt-1">Completed This Month</p>
        </div>
      </div>

      {/* Upcoming Releases */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-primary-400 mb-4">Upcoming Releases</h2>
        {releases.length === 0 ? (
          <p className="text-sm text-text-500">No releases yet.</p>
        ) : (
          <div className="space-y-2">
            {[...releases]
              .filter((r) => r.status !== 'released' && r.status !== 'cancelled' && r.status !== 'archived')
              .sort((a, b) => {
                const aDate = toDate(a.estimatedReleaseDate || a.targetReleaseDate);
                const bDate = toDate(b.estimatedReleaseDate || b.targetReleaseDate);
                if (!aDate && !bDate) return 0;
                if (!aDate) return 1;
                if (!bDate) return -1;
                return aDate.getTime() - bDate.getTime();
              })
              .slice(0, 5)
              .map((r) => {
                const date = toDate(r.estimatedReleaseDate || r.targetReleaseDate);
                const initial = r.title?.charAt(0)?.toUpperCase() || 'R';
                return (
                  <Link
                    key={r.id}
                    href={`/releases/${r.id}`}
                    className="flex items-center gap-3 rounded-xl border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-primary-500/40 transition-all duration-150 group"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-primary-500 to-orange-600 flex items-center justify-center shadow">
                      <span className="text-sm font-bold text-surface-50/90">{initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary-400 truncate">{r.title}</p>
                      <p className="text-xs text-text-500 mt-0.5 capitalize">{r.releaseType}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-text-400">{date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                      <p className="text-caption text-text-500 mt-0.5 capitalize">{r.status.replace(/_/g, ' ')}</p>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>

      {/* Two-column: Activity + Tasks */}
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-primary-400 mb-4">Recent Activity</h2>
          {loadingExtras ? <LoadingState /> : activities.length === 0 ? (
            <p className="text-sm text-text-500">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-primary-500/60 shrink-0" />
                  <div>
                    <p className="text-sm text-surface-100 capitalize">{a.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-text-600 mt-1">{timeAgo((a.createdAt as { toDate: () => Date }).toDate?.() ?? new Date())}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-primary-400 mb-4">My Tasks</h2>
          {loadingExtras ? <LoadingState /> : tasks.length === 0 ? (
            <p className="text-sm text-text-500">No tasks assigned to you.</p>
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
      </div>
    </div>
  );
}
