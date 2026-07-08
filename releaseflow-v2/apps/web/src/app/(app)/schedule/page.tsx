'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useOrgStore } from '@/stores/org-store';
import { useReleases } from '@/hooks/useRelease';
import { useOrgMilestones } from '@/hooks/useMilestones';
import {
  EmptyState, LoadingState, StatusBadge,
  SegmentedControl, Card, Search,
} from '@releaseflow/ui';
import type { ReleaseRecord } from '@/lib/release-repository';
import { calculateReleaseReadiness, detectConflicts, getScheduleHealth, calculateCapacity } from '@/lib/schedule-intelligence-service';
import { buildReleaseCalendarEvents, downloadIcsCalendar } from '@/lib/calendar-export';

type ViewMode = 'timeline' | 'calendar' | 'gantt' | 'agenda' | 'capacity';

const views: { value: string; label: string }[] = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'gantt', label: 'Gantt' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'capacity', label: 'Capacity' },
];

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value && typeof value === 'object') {
    if ('toDate' in value && typeof value.toDate === 'function') return value.toDate();
    if ('seconds' in value && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
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

function artistName(r: ReleaseRecord): string {
  return (r as unknown as Record<string, unknown>).artist as string
    || (r as unknown as Record<string, unknown>).primaryArtist as string
    || '';
}

function ReleaseCard({ release, onSelect, selected }: {
  release: ReleaseRecord;
  onSelect?: (id: string) => void;
  selected?: boolean;
}) {
  const initial = release.title?.charAt(0)?.toUpperCase() || 'R';
  const date = toDate(release.estimatedReleaseDate) ?? toDate(release.targetReleaseDate);
  return (
    <button
      onClick={() => onSelect?.(release.id)}
      className={`flex items-center gap-4 rounded-xl border px-5 py-4 transition-all duration-150 group text-left w-full ${
        selected
          ? 'border-primary-500/60 bg-primary-500/10 shadow-md'
          : 'border-surface-700/60 bg-surface-900 hover:border-primary-500/40'
      }`}
    >
      <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-primary-500 to-orange-600 flex items-center justify-center shadow-lg">
        <span className="text-xl font-bold text-surface-50/90">{initial}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <p className="font-semibold text-primary-400 truncate">{release.title}</p>
          <StatusBadge status={release.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {artistName(release) && (
            <p className="text-xs text-text-400 truncate">{artistName(release)}</p>
          )}
          {date ? (
            <p className="text-xs text-text-400">{fmt(date)}</p>
          ) : (
            <p className="text-xs text-text-500">No date set</p>
          )}
        </div>
      </div>
    </button>
  );
}

function ReadinessGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-surface-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-semibold text-text-300 w-10 text-right">{score}%</span>
    </div>
  );
}

function FilterBar({ releases, onFilterChange }: {
  releases: ReleaseRecord[];
  onFilterChange: (filters: { status?: string; genre?: string; search?: string }) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  const statuses = useMemo(() => {
    const s = new Set(releases.map((r) => r.status));
    return Array.from(s).sort();
  }, [releases]);

  const genres = useMemo(() => {
    const g = new Set(releases.map((r) => r.genre).filter(Boolean) as string[]);
    return Array.from(g).sort();
  }, [releases]);

  const debouncedSearch = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    debouncedSearch.current = setTimeout(() => {
      onFilterChange({ status: statusFilter, genre: genreFilter, search: val });
    }, 200);
  }, [onFilterChange, statusFilter, genreFilter]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="w-48">
        <Search value={search} onChange={handleSearch} placeholder="Search releases..." />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); onFilterChange({ status: e.target.value, genre: genreFilter, search }); }}
        className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-xs text-text-300"
      >
        <option value="">All Statuses</option>
        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select
        value={genreFilter}
        onChange={(e) => { setGenreFilter(e.target.value); onFilterChange({ status: statusFilter, genre: e.target.value, search }); }}
        className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-xs text-text-300"
      >
        <option value="">All Genres</option>
        {genres.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
    </div>
  );
}

function TimelineView({ releases, selectedId, onSelect }: {
  releases: ReleaseRecord[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
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

  if (sorted.length === 0) {
    return <EmptyState title="No releases" description="No releases match your filters." />;
  }

  return (
    <div className="space-y-4">
      {sorted.map((r) => (
        <ReleaseCard key={r.id} release={r} onSelect={onSelect} selected={selectedId === r.id} />
      ))}
    </div>
  );
}

function CalendarView({ releases }: { releases: ReleaseRecord[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [currentMonth]);

  const releaseDateMap = useMemo(() => {
    const map = new Map<string, ReleaseRecord[]>();
    for (const r of releases) {
      const d = toDate(r.estimatedReleaseDate) ?? toDate(r.targetReleaseDate);
      if (d) {
        const key = monthKey(d);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
      }
    }
    return map;
  }, [releases]);

  const currentKey = monthKey(currentMonth);
  const monthReleases = releaseDateMap.get(currentKey) || [];

  const dayReleases = useMemo(() => {
    const map = new Map<number, ReleaseRecord[]>();
    for (const r of monthReleases) {
      const d = toDate(r.estimatedReleaseDate) ?? toDate(r.targetReleaseDate);
      if (d) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(r);
      }
    }
    return map;
  }, [monthReleases]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          className="px-3 py-1.5 text-sm bg-surface-800 border border-surface-700 rounded-lg hover:bg-surface-700 text-text-300">
          &larr; Prev
        </button>
        <h3 className="text-lg font-semibold text-text-200">{monthLabel(currentMonth)}</h3>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          className="px-3 py-1.5 text-sm bg-surface-800 border border-surface-700 rounded-lg hover:bg-surface-700 text-text-300">
          Next &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-surface-700/50 rounded-xl overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-surface-900 px-2 py-1.5 text-xs font-semibold text-text-500 text-center">{d}</div>
        ))}
        {daysInMonth.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="bg-surface-900/50 min-h-[80px]" />;
          const releases = dayReleases.get(day.getDate()) || [];
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div key={day.toISOString()} className={`bg-surface-900 min-h-[80px] p-1.5 ${isToday ? 'ring-1 ring-primary-500/40' : ''}`}>
              <span className={`text-xs font-medium ${isToday ? 'text-primary-400' : 'text-text-500'}`}>{day.getDate()}</span>
              <div className="mt-1 space-y-0.5">
                {releases.slice(0, 3).map((r) => (
                  <Link key={r.id} href={`/releases/${r.id}`}
                    className="block text-[10px] leading-tight truncate rounded px-1 py-0.5 bg-primary-500/10 text-primary-400 hover:bg-primary-500/20">
                    {r.title}
                  </Link>
                ))}
                {releases.length > 3 && (
                  <span className="text-[10px] text-text-500 px-1">+{releases.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GanttView({ releases }: { releases: ReleaseRecord[] }) {
  const sorted = useMemo(() => {
    return [...releases]
      .filter((r) => toDate(r.estimatedReleaseDate) || toDate(r.targetReleaseDate))
      .sort((a, b) => {
        const aDate = toDate(a.estimatedReleaseDate) ?? toDate(a.targetReleaseDate)!;
        const bDate = toDate(b.estimatedReleaseDate) ?? toDate(b.targetReleaseDate)!;
        return aDate.getTime() - bDate.getTime();
      });
  }, [releases]);

  const dateRange = useMemo(() => {
    if (sorted.length === 0) return { start: new Date(), end: new Date() };
    const dates = sorted.map((r) => toDate(r.estimatedReleaseDate) ?? toDate(r.targetReleaseDate)!).filter(Boolean) as Date[];
    const start = new Date(Math.min(...dates.map((d) => d.getTime())));
    const end = new Date(Math.max(...dates.map((d) => d.getTime())));
    start.setMonth(start.getMonth() - 1);
    end.setMonth(end.getMonth() + 1);
    return { start, end };
  }, [sorted]);

  const totalDays = useMemo(() => {
    return Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));
  }, [dateRange]);

  if (sorted.length === 0) {
    return <EmptyState title="No releases" description="No dated releases to show on the Gantt chart." />;
  }

  const months: { label: string; start: Date; days: number }[] = [];
  const cursor = new Date(dateRange.start);
  while (cursor < dateRange.end) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const days = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    months.push({ label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), start: new Date(cursor), days });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  function daysFromStart(d: Date): number {
    return Math.ceil((d.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex border-b border-surface-700/60 mb-2">
          <div className="w-48 shrink-0 px-2 py-1 text-xs font-semibold text-text-500">Release</div>
          <div className="flex flex-1">
            {months.map((m) => (
              <div key={m.label} className="text-center text-[10px] font-semibold text-text-500 py-1"
                style={{ width: `${(m.days / totalDays) * 100}%` }}>
                {m.label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {sorted.map((r) => {
            const d = toDate(r.estimatedReleaseDate) ?? toDate(r.targetReleaseDate)!;
            const pos = daysFromStart(d);
            const width = 3;
            return (
              <Link key={r.id} href={`/releases/${r.id}`}
                className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-800/50 group">
                <div className="w-48 shrink-0 truncate">
                  <p className="text-sm font-medium text-primary-400 truncate">{r.title}</p>
                  <p className="text-[10px] text-text-500">{fmt(d)}</p>
                </div>
                <div className="flex-1 relative h-6">
                  <div className="absolute top-1.5 left-0 right-0 h-1 bg-surface-700 rounded-full" />
                  <div
                    className="absolute top-1 h-3 rounded-full bg-primary-500/60 group-hover:bg-primary-500/80 transition-colors"
                    style={{
                      left: `${(pos / totalDays) * 100}%`,
                      width: `${(width / totalDays) * 100}%`,
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AgendaView({ releases, selectedId, onSelect }: {
  releases: ReleaseRecord[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
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

  const groups = useMemo(() => {
    const g: Record<string, ReleaseRecord[]> = {};
    for (const r of sorted) {
      const d = toDate(r.estimatedReleaseDate) ?? toDate(r.targetReleaseDate);
      const key = d ? monthKey(d) : 'no-date';
      if (!g[key]) g[key] = [];
      g[key].push(r);
    }
    return g;
  }, [sorted]);

  return (
    <div className="space-y-8">
      {Object.entries(groups).map(([key, group]) => {
        if (key === 'no-date') {
          return (
            <div key={key}>
              <h3 className="text-sm font-semibold text-text-500 uppercase tracking-widest mb-4">No Date Set</h3>
              <div className="space-y-3">
                {group.map((r) => <ReleaseCard key={r.id} release={r} onSelect={onSelect} selected={selectedId === r.id} />)}
              </div>
            </div>
          );
        }
        const d = new Date(Number(key.split('-')[0]), Number(key.split('-')[1]));
        return (
          <div key={key}>
            <h3 className="text-sm font-semibold text-text-500 uppercase tracking-widest mb-4">{monthLabel(d)}</h3>
            <div className="space-y-3">
              {group.map((r) => <ReleaseCard key={r.id} release={r} onSelect={onSelect} selected={selectedId === r.id} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CapacityView({ releases, milestones }: { releases: ReleaseRecord[]; milestones: import('@/lib/milestone-repository').MilestoneRecord[] }) {
  const capacity = useMemo(() => calculateCapacity('', releases, milestones, []), [releases, milestones]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...capacity.releasesPerMonth.map((m) => m.count));
  }, [capacity]);

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-500 uppercase tracking-widest mb-4">Releases Per Month</h3>
        <div className="space-y-3">
          {capacity.releasesPerMonth.map((m) => (
            <div key={m.month} className="flex items-center gap-3">
              <span className="w-20 text-xs text-text-400 shrink-0">{m.month}</span>
              <div className="flex-1 h-5 bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500/60 rounded-full transition-all duration-300"
                  style={{ width: `${(m.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-text-400 w-6 text-right">{m.count}</span>
            </div>
          ))}
          {capacity.releasesPerMonth.length === 0 && (
            <p className="text-sm text-text-500">No releases scheduled.</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-xs text-text-500 uppercase tracking-widest mb-1">Workload Score</p>
          <p className="text-2xl font-bold text-text-200">{capacity.workload}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-text-500 uppercase tracking-widest mb-1">Assignment Load</p>
          <p className="text-2xl font-bold text-text-200">{capacity.assignmentLoad}h</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-500 uppercase tracking-widest mb-4">Release Readiness</h3>
        <div className="space-y-4">
          {releases.slice(0, 10).map((r) => {
            const relMilestones = milestones.filter((m) => m.releaseId === r.id);
            const score = calculateReleaseReadiness(r, relMilestones);
            return (
              <div key={r.id} className="flex items-center gap-4">
                <Link href={`/releases/${r.id}`} className="text-sm text-primary-400 hover:underline w-40 truncate">{r.title}</Link>
                <div className="flex-1">
                  <ReadinessGauge score={score.overall} />
                </div>
                <span className="text-xs text-text-500 w-16 text-right">{score.milestones.filter((m) => m.percentage === 100).length}/{score.milestones.length} done</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function TimelineSidebar({ release, onClose }: { release: ReleaseRecord; onClose: () => void }) {
  return (
    <div className="w-80 border-l border-surface-700/60 bg-surface-900/80 overflow-y-auto shrink-0">
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-text-200">Release Details</h3>
          <button onClick={onClose} className="text-text-500 hover:text-text-200 text-lg leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-text-500 uppercase tracking-widest mb-1">Title</p>
            <p className="text-sm font-medium text-text-200">{release.title}</p>
          </div>

          {artistName(release) && (
            <div>
              <p className="text-xs text-text-500 uppercase tracking-widest mb-1">Artist</p>
              <p className="text-sm text-text-200">{artistName(release)}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-text-500 uppercase tracking-widest mb-1">Status</p>
            <StatusBadge status={release.status} />
          </div>

          <div>
            <p className="text-xs text-text-500 uppercase tracking-widest mb-1">Release Date</p>
            <p className="text-sm text-text-200">
              {fmt(toDate(release.estimatedReleaseDate) ?? toDate(release.targetReleaseDate) ?? new Date())}
            </p>
          </div>

          {release.genre && (
            <div>
              <p className="text-xs text-text-500 uppercase tracking-widest mb-1">Genre</p>
              <p className="text-sm text-text-200">{release.genre}</p>
            </div>
          )}

          {release.label && (
            <div>
              <p className="text-xs text-text-500 uppercase tracking-widest mb-1">Label</p>
              <p className="text-sm text-text-200">{release.label}</p>
            </div>
          )}

          <div className="pt-3 border-t border-surface-700/40">
            <Link href={`/releases/${release.id}`}
              className="block w-full text-center text-sm font-medium py-2 rounded-lg bg-primary-500/15 text-primary-400 hover:bg-primary-500/25 transition-colors">
              Open Release Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { activeOrgId } = useOrgStore();
  const { releases, loading, error } = useReleases();
  const { milestones } = useOrgMilestones(activeOrgId ?? undefined);
  const [view, setView] = useState<ViewMode>('timeline');
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | undefined>();
  const [filters, setFilters] = useState<{ status?: string; genre?: string; search?: string }>({});

  const selectedRelease = useMemo(() => {
    if (!selectedReleaseId) return undefined;
    return releases.find((r) => r.id === selectedReleaseId);
  }, [releases, selectedReleaseId]);

  const filtered = useMemo(() => {
    let result = releases;
    if (filters.status) result = result.filter((r) => r.status === filters.status);
    if (filters.genre) result = result.filter((r) => r.genre === filters.genre);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        artistName(r).toLowerCase().includes(q) ||
        (r.label && r.label.toLowerCase().includes(q))
      );
    }
    return result;
  }, [releases, filters]);

  const health = useMemo(() => getScheduleHealth(releases, milestones), [releases, milestones]);
  const conflicts = useMemo(() => detectConflicts(releases), [releases]);

  const handleSelectRelease = useCallback((id: string) => {
    setSelectedReleaseId((prev) => prev === id ? undefined : id);
  }, []);

  const handleIcsExport = useCallback(() => {
    const events = buildReleaseCalendarEvents(releases);
    downloadIcsCalendar(events, 'releaseflow-schedule.ics');
  }, [releases]);

  useEffect(() => {
    if (!selectedReleaseId) return;
    if (!releases.find((r) => r.id === selectedReleaseId)) {
      setSelectedReleaseId(undefined);
    }
  }, [releases, selectedReleaseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState />
      </div>
    );
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <EmptyState
          title="No organisation selected"
          description="Select an organisation from the top bar to view its schedule."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <EmptyState title="Failed to load releases" description={error} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col page-transition">
      {/* Dashboard Widgets */}
      <div className="px-5 sm:px-7 pt-6 pb-4">
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="bg-surface-900 border border-surface-700/60 rounded-xl px-4 py-3">
            <p className="text-xs text-text-500 uppercase tracking-widest">Upcoming</p>
            <p className="text-xl font-bold text-text-200 mt-1">{health.upcomingThisMonth}</p>
            <p className="text-[10px] text-text-500">this month</p>
          </div>
          <div className="bg-surface-900 border border-surface-700/60 rounded-xl px-4 py-3">
            <p className="text-xs text-text-500 uppercase tracking-widest">Completed</p>
            <p className="text-xl font-bold text-text-200 mt-1">{health.completedThisMonth}</p>
            <p className="text-[10px] text-text-500">milestones this month</p>
          </div>
          <div className="bg-surface-900 border border-surface-700/60 rounded-xl px-4 py-3">
            <p className="text-xs text-text-500 uppercase tracking-widest">At Risk</p>
            <p className={`text-xl font-bold mt-1 ${health.atRisk > 0 ? 'text-amber-400' : 'text-text-200'}`}>{health.atRisk}</p>
            <p className="text-[10px] text-text-500">approaching milestones</p>
          </div>
          <div className="bg-surface-900 border border-surface-700/60 rounded-xl px-4 py-3">
            <p className="text-xs text-text-500 uppercase tracking-widest">Overdue</p>
            <p className={`text-xl font-bold mt-1 ${health.overdue > 0 ? 'text-red-400' : 'text-text-200'}`}>{health.overdue}</p>
            <p className="text-[10px] text-text-500">milestones</p>
          </div>
        </div>

        {/* Conflicts Banner */}
        {conflicts.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-amber-400 text-sm font-medium">Conflicts detected:</span>
            <div className="flex gap-3 flex-wrap">
              {conflicts.map((c, i) => (
                <span key={i} className="text-xs text-amber-300">{c.message}</span>
              ))}
            </div>
          </div>
        )}

        {/* Header + Controls */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-display-md font-semibold text-primary-400 tracking-tight">Schedule</p>
            <p className="mt-0.5 text-sm text-text-400">{releases.length} release{releases.length !== 1 ? 's' : ''} &middot; {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={handleIcsExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-surface-800 border border-surface-700 text-text-300 hover:bg-surface-700 transition-colors">
            Export ICS
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-5">
          <FilterBar releases={releases} onFilterChange={setFilters} />
          <SegmentedControl options={views} value={view} onChange={(v) => setView(v as ViewMode)} size="sm" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 pb-8">
          {filtered.length === 0 && releases.length > 0 ? (
            <EmptyState title="No matches" description="No releases match your current filters." />
          ) : view === 'timeline' ? (
            <TimelineView releases={filtered} selectedId={selectedReleaseId} onSelect={handleSelectRelease} />
          ) : view === 'calendar' ? (
            <CalendarView releases={filtered} />
          ) : view === 'gantt' ? (
            <GanttView releases={filtered} />
          ) : view === 'agenda' ? (
            <AgendaView releases={filtered} selectedId={selectedReleaseId} onSelect={handleSelectRelease} />
          ) : (
            <CapacityView releases={filtered} milestones={milestones} />
          )}
        </div>

        {/* Sidebar */}
        {selectedRelease && (
          <TimelineSidebar release={selectedRelease} onClose={() => setSelectedReleaseId(undefined)} />
        )}
      </div>
    </div>
  );
}
