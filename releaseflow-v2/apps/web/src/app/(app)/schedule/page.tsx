'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useOrgStore } from '@/stores/org-store';
import { useReleases } from '@/hooks/useRelease';
import { EmptyState, LoadingState, StatusBadge } from '@releaseflow/ui';

type ViewMode = 'agenda' | 'month' | 'week' | 'timeline';

const views: { key: ViewMode; label: string }[] = [
  { key: 'agenda', label: 'Agenda' },
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'timeline', label: 'Timeline' },
];

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

function fmt(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isSameWeek(a: Date, b: Date): boolean {
  const start = new Date(a);
  start.setDate(a.getDate() - a.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return b >= start && b <= end;
}

function ReleaseCard({ release }: { release: { id: string; title: string; status: string; estimatedReleaseDate?: unknown; targetReleaseDate?: unknown } }) {
  const initial = release.title?.charAt(0)?.toUpperCase() || 'R';
  const date = toDate(release.estimatedReleaseDate) ?? toDate(release.targetReleaseDate);
  return (
    <Link
      href={`/releases/${release.id}`}
      className="flex items-center gap-4 rounded-xl border border-surface-700/60 bg-surface-900 px-5 py-4 hover:border-primary-500/40 transition-all duration-150 group"
    >
      <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-primary-500 to-orange-600 flex items-center justify-center shadow-lg">
        <span className="text-xl font-bold text-white/90">{initial}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <p className="font-semibold text-surface-50 truncate group-hover:text-primary-400 transition-colors">{release.title}</p>
          <StatusBadge status={release.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {date ? (
            <p className="text-xs text-text-400">{fmt(date)}</p>
          ) : (
            <p className="text-xs text-text-500">No date set</p>
          )}
          <span className="text-xs text-text-500">&mdash;</span>
        </div>
      </div>
    </Link>
  );
}

export default function SchedulePage() {
  const { activeOrgId } = useOrgStore();
  const { releases, loading, error } = useReleases();
  const [view, setView] = useState<ViewMode>('agenda');

  const sorted = useMemo(() => {
    return [...releases].sort((a, b) => {
      const aDate = toDate(a.estimatedReleaseDate) ?? toDate(a.targetReleaseDate);
      const bDate = toDate(b.estimatedReleaseDate) ?? toDate(b.targetReleaseDate);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate.getTime() - bDate.getTime();
    });
  }, [releases]);

  const agendaGroups = useMemo(() => {
    const groups: Record<string, typeof sorted> = {};
    for (const r of sorted) {
      const d = toDate(r.estimatedReleaseDate) ?? toDate(r.targetReleaseDate);
      const key = d ? monthKey(d) : 'no-date';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return groups;
  }, [sorted]);

  const now = new Date();
  const weekReleases = useMemo(() => {
    return sorted.filter((r) => {
      const d = toDate(r.estimatedReleaseDate) ?? toDate(r.targetReleaseDate);
      return d && isSameWeek(now, d);
    });
  }, [sorted, now]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[1.75rem] font-semibold text-surface-50 tracking-tight">Schedule</p>
          <p className="mt-1 text-sm text-text-400">View your release timeline across different perspectives.</p>
          {releases.length > 0 ? (
            <p className="mt-0.5 text-sm text-text-400">{releases.length} release{releases.length !== 1 ? 's' : ''}</p>
          ) : null}
        </div>
      </div>

      {/* Segmented Control */}
      <div className="flex items-center gap-1 rounded-lg border border-surface-700/60 bg-surface-900 p-1 mb-8 w-fit">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
              view === v.key
                ? 'bg-primary-500/15 text-primary-400 shadow-sm'
                : 'text-text-400 hover:text-surface-50'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {!activeOrgId ? (
        <EmptyState
          title="No organisation selected"
          description="Select an organisation from the top bar to view its schedule."
        />
      ) : error ? (
        <EmptyState title="Failed to load releases" description={error} />
      ) : releases.length === 0 ? (
        <EmptyState
          title="No releases yet"
          description="Create your first release to see it on the schedule."
        />
      ) : view === 'agenda' ? (
        <div className="space-y-8">
          {Object.entries(agendaGroups).map(([key, group]) => {
            if (key === 'no-date') {
              return (
                <div key={key}>
                  <h3 className="text-sm font-semibold text-text-500 uppercase tracking-widest mb-4">No Date Set</h3>
                  <div className="space-y-3">
                    {group.map((r) => <ReleaseCard key={r.id} release={r} />)}
                  </div>
                </div>
              );
            }
            const d = new Date(Number(key.split('-')[0]), Number(key.split('-')[1]));
            return (
              <div key={key}>
                <h3 className="text-sm font-semibold text-text-500 uppercase tracking-widest mb-4">{monthLabel(d)}</h3>
                <div className="space-y-3">
                  {group.map((r) => <ReleaseCard key={r.id} release={r} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : view === 'month' ? (
        <div className="space-y-8">
          {Object.entries(agendaGroups).filter(([k]) => k !== 'no-date').map(([key, group]) => {
            const d = new Date(Number(key.split('-')[0]), Number(key.split('-')[1]));
            return (
              <div key={key}>
                <h3 className="text-sm font-semibold text-text-500 uppercase tracking-widest mb-4">{monthLabel(d)}</h3>
                <div className="space-y-3">
                  {group.map((r) => <ReleaseCard key={r.id} release={r} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : view === 'week' ? (
        <div>
          <h3 className="text-sm font-semibold text-text-500 uppercase tracking-widest mb-4">Week of {fmt(now)}</h3>
          {weekReleases.length === 0 ? (
            <p className="text-sm text-text-500">No releases scheduled for this week.</p>
          ) : (
            <div className="space-y-3">
              {weekReleases.map((r) => <ReleaseCard key={r.id} release={r} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-surface-700/60" />
          <div className="space-y-6">
            {sorted.map((r) => {
              const d = toDate(r.estimatedReleaseDate) ?? toDate(r.targetReleaseDate);
              const initial = r.title?.charAt(0)?.toUpperCase() || 'R';
              return (
                <Link
                  key={r.id}
                  href={`/releases/${r.id}`}
                  className="relative flex items-start gap-5 group"
                >
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 shrink-0 rounded-full border-2 border-primary-500 bg-surface-900">
                    <span className="text-[10px] font-bold text-primary-400">{initial}</span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="font-semibold text-surface-50 truncate group-hover:text-primary-400 transition-colors">{r.title}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    {d ? (
                      <p className="text-xs text-text-400 mt-0.5">{fmt(d)}</p>
                    ) : (
                      <p className="text-xs text-text-500 mt-0.5">No date set</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
