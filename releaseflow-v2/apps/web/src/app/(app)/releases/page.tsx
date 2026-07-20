'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { useReleases } from '@/hooks/useRelease';
import { useNeedsAttentionReleases, useContinueWorking, useUpcomingReleases, useRecentlyUpdated } from '@/hooks/useRelease';
import { Button, EmptyState, Input, StatusBadge, Badge } from '@releaseflow/ui';
import { ReleaseCard, type ReleaseCardVariant } from '@/components/release/cards/ReleaseCard';
import { RELEASE_STATUS_CONFIG, RELEASE_TYPE_LABELS } from '@/components/release/status/release-status-config';
import type { Release } from '@/app/(app)/types';
import { useDebounce } from '@/hooks/useDebounce';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import { fmtDate } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'releaseDate', label: 'Release Date' },
  { value: 'alpha', label: 'Alphabetical' },
  { value: 'status', label: 'Status' },
] as const;

const STATUS_OPTIONS = Object.entries(RELEASE_STATUS_CONFIG).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

const TYPE_OPTIONS = Object.entries(RELEASE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const LIFECYCLE_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'released', label: 'Released' },
  { value: 'archived', label: 'Archived' },
  { value: 'expired', label: 'Expired' },
];

const READINESS_OPTIONS = [
  { value: 'ready', label: 'Ready' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'at_risk', label: 'At Risk' },
];

function filterReleases(releases: Release[], search: string, statuses: string[], types: string[], lifecycles: string[], readiness: string[]): Release[] {
  return releases.filter((r) => {
    if (search) {
      const term = search.toLowerCase();
      const haystack = [
        r.title,
        r.upc ?? '',
        r.catalogNumber ?? '',
      ].join(' ').toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (statuses.length > 0 && !statuses.includes(r.status)) return false;
    if (types.length > 0 && !types.includes(r.releaseType)) return false;
    if (lifecycles.length > 0) {
      const matchesLifecycle = lifecycles.some((lc) => {
        if (lc === 'draft') return r.lifecycle === 'draft';
        if (lc === 'active') return r.lifecycle === 'active';
        if (lc === 'archived') return r.lifecycle === 'archived';
        if (lc === 'expired') return r.lifecycle === 'expired';
        if (lc === 'released') return r.status === 'released';
        return false;
      });
      if (!matchesLifecycle) return false;
    }
    if (readiness.length > 0) {
      const rd = (r.wizardData as Record<string, unknown> | null | undefined)?.readiness as string | undefined;
      if (!rd || !readiness.includes(rd)) return false;
    }
    return true;
  });
}

function getDateValue(date: unknown): number {
  if (!date) return 0;
  if (typeof date === 'object' && date !== null) {
    const d = date as { seconds?: number; toDate?: () => Date };
    if (typeof d.toDate === 'function') return d.toDate().getTime();
    if (typeof d.seconds === 'number') return new Date(d.seconds * 1000).getTime();
  }
  if (typeof date === 'string' || typeof date === 'number') return new Date(date).getTime();
  return 0;
}

function sortReleases(releases: Release[], sort: string): Release[] {
  const sorted = [...releases];
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => getDateValue(b.createdAt) - getDateValue(a.createdAt));
    case 'oldest':
      return sorted.sort((a, b) => getDateValue(a.createdAt) - getDateValue(b.createdAt));
    case 'releaseDate':
      return sorted.sort((a, b) => getDateValue(b.targetReleaseDate) - getDateValue(a.targetReleaseDate));
    case 'alpha':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'status':
      return sorted.sort((a, b) => {
        const aOrder = a.lifecycle === 'draft' ? 0 : a.lifecycle === 'active' ? 1 : a.lifecycle === 'archived' ? 5 : 7;
        const bOrder = b.lifecycle === 'draft' ? 0 : b.lifecycle === 'active' ? 1 : b.lifecycle === 'archived' ? 5 : 7;
        return aOrder - bOrder;
      });
    default:
      return sorted;
  }
}

function getCountdown(targetDate: unknown): string {
  const ts = getDateValue(targetDate);
  if (!ts) return '';
  const diff = ts - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-xl bg-surface-100" />
      ))}
    </div>
  );
}

export default function ReleasesPage() {
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const { releases, error, refresh } = useReleases();
  const canCreate = AuthorizationService.canCreateRelease();
  const isCollab = AuthorizationService.isCollaboratorWorkspace();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('rf-releases-view') as ViewMode) || 'grid';
    return 'grid';
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterLifecycle, setFilterLifecycle] = useState<string[]>([]);
  const [filterReadiness, setFilterReadiness] = useState<string[]>([]);

  const needsAttention = useNeedsAttentionReleases();
  const continueWorking = useContinueWorking();
  const upcomingReleases = useUpcomingReleases(30);
  const recentlyUpdated = useRecentlyUpdated(10);

  useEffect(() => {
    localStorage.setItem('rf-releases-view', view);
  }, [view]);

  const filteredAll = useMemo(() => {
    const searched = filterReleases(releases, debouncedSearch, filterStatus, filterType, filterLifecycle, filterReadiness);
    return sortReleases(searched, 'newest');
  }, [releases, debouncedSearch, filterStatus, filterType, filterLifecycle, filterReadiness]);

  const hasActiveFilters = debouncedSearch || filterStatus.length > 0 || filterType.length > 0 || filterLifecycle.length > 0 || filterReadiness.length > 0;

  function clearFilters() {
    setSearch('');
    setFilterStatus([]);
    setFilterType([]);
    setFilterLifecycle([]);
    setFilterReadiness([]);
  }

  function toggleFilter(arr: string[], value: string): string[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition">
        <EmptyState
          title="No organisation selected"
          description="Select an organisation from the top bar to view its releases."
          action={{ label: 'Manage Organisations', onClick: () => router.push('/organizations') }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition">
        <EmptyState title="Failed to load releases" description={error} action={{ label: 'Retry', onClick: refresh }} />
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition">
        <EmptyState
          title="Your catalogue is empty"
          description={
            canCreate
              ? 'Create your first release to begin managing production, legal, distribution and collaboration.'
              : 'No releases have been published to your organisation yet.'
          }
          action={
            canCreate
              ? { label: 'Create Release', onClick: () => router.push('/releases/new') }
              : undefined
          }
          className="py-20"
        />
      </div>
    );
  }

  const CollapsibleSection = ({ title, count, defaultOpen, children, error: sectionError }: { title: string; count: number; defaultOpen?: boolean; children: React.ReactNode; error?: string | null }) => {
    const [open, setOpen] = useState(defaultOpen ?? false);
    return (
      <section className="mb-8">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 mb-4 group"
        >
          <svg className={`h-4 w-4 text-text-400 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-sm font-semibold text-text-500 uppercase tracking-widest">{title}</h2>
          <span className="text-xs text-text-400 bg-surface-100 px-2 py-0.5 rounded-full">{count}</span>
          {sectionError && <span className="text-xs text-danger-500 ml-2">Failed to load</span>}
        </button>
        {open && <div className="animate-fade-in">{children}</div>}
      </section>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">Releases</h1>
          <p className="mt-1 text-sm text-text-400">
            {releases.length > 0
              ? `${filteredAll.length} of ${releases.length} release${releases.length !== 1 ? 's' : ''}`
              : isCollab
                ? 'Browse every release across your label.'
                : 'Manage every release from planning to distribution.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeOrgId && canCreate && (
            <Link href="/releases/new">
              <Button variant="primary" size="md" className="rounded-xl">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Release
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search + Sort + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search releases..."
            className="w-full"
            leftIcon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value="newest"
            disabled
            className="h-10 rounded-xl border border-surface-200 bg-layer-2 px-3 text-sm text-text-600 focus:border-primary-500/60 focus:outline-none opacity-60"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 px-3 rounded-xl border transition-colors ${
              hasActiveFilters
                ? 'border-primary-500/60 bg-primary-500/10 text-primary-400'
                : 'border-surface-200 text-text-400 hover:text-text-600'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <div className="flex rounded-xl border border-surface-200 overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`p-2 ${view === 'grid' ? 'bg-primary-500/10 text-primary-400' : 'text-text-400 hover:text-text-600'}`}
              aria-label="Grid view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 ${view === 'list' ? 'bg-primary-500/10 text-primary-400' : 'text-text-400 hover:text-text-600'}`}
              aria-label="List view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="mb-6 p-4 rounded-xl border border-surface-200 bg-layer-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-400 uppercase tracking-wider">Filters</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-primary-500 hover:text-primary-400 font-medium">Clear all</button>
            )}
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-1.5">
              <span className="text-xs text-text-500 font-medium">Lifecycle</span>
              <div className="flex flex-wrap gap-1.5">
                {LIFECYCLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterLifecycle((p) => toggleFilter(p, opt.value))}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      filterLifecycle.includes(opt.value)
                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                        : 'bg-surface-100 text-text-500 border border-transparent hover:border-surface-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-text-500 font-medium">Status</span>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus((p) => toggleFilter(p, opt.value))}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      filterStatus.includes(opt.value)
                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                        : 'bg-surface-100 text-text-500 border border-transparent hover:border-surface-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-text-500 font-medium">Type</span>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterType((p) => toggleFilter(p, opt.value))}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      filterType.includes(opt.value)
                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                        : 'bg-surface-100 text-text-500 border border-transparent hover:border-surface-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-text-500 font-medium">Readiness</span>
              <div className="flex flex-wrap gap-1.5">
                {READINESS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterReadiness((p) => toggleFilter(p, opt.value))}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      filterReadiness.includes(opt.value)
                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                        : 'bg-surface-100 text-text-500 border border-transparent hover:border-surface-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Sections */}
      <div className="space-y-2">
        {/* Needs Attention */}
        <CollapsibleSection title="Needs Attention" count={needsAttention.data.length} defaultOpen>
          {needsAttention.loading ? (
            <SectionSkeleton />
          ) : needsAttention.data.length === 0 ? (
            <p className="text-sm text-text-500 py-4">No releases need attention right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {needsAttention.data.slice(0, 5).map((release) => (
                <ReleaseCard key={release.id} release={release} view="grid" variant={release.lifecycle as ReleaseCardVariant} mode="compact" />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Continue Working */}
        <CollapsibleSection title="Continue Working" count={continueWorking.data.length} defaultOpen>
          {continueWorking.loading ? (
            <SectionSkeleton />
          ) : continueWorking.data.length === 0 ? (
            <p className="text-sm text-text-500 py-4">No active work. Start a new release or resume a draft.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {continueWorking.data.map((release) => (
                <ReleaseCard key={release.id} release={release} view="grid" variant={release.lifecycle === 'draft' ? 'draft' : 'active'} mode="workspace" />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Upcoming Releases */}
        <CollapsibleSection title="Upcoming Releases" count={upcomingReleases.data.length} defaultOpen>
          {upcomingReleases.loading ? (
            <SectionSkeleton />
          ) : upcomingReleases.data.length === 0 ? (
            <p className="text-sm text-text-500 py-4">No upcoming releases.</p>
          ) : (
            <div className="space-y-2">
              {upcomingReleases.data.map((release) => {
                const countdown = getCountdown(release.targetReleaseDate);
                const isDraft = release.lifecycle === 'draft';
                return (
                  <Link
                    key={release.id}
                    href={`/releases/${release.id}`}
                    className="flex items-center gap-4 rounded-xl border border-surface-200 bg-layer-2 p-3 hover:border-primary-500/40 transition-colors group"
                  >
                    <ArtworkDisplay artwork={release.artwork} releaseTitle={release.title} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary-400 truncate group-hover:text-primary-300 transition-colors">{release.title}</p>
                      <p className="text-xs text-text-500 mt-0.5 capitalize">{release.releaseType.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {release.targetReleaseDate ? (
                        <>
                          <p className="text-xs font-medium text-text-600">{fmtDate(release.targetReleaseDate)}</p>
                          <p className={`text-xs mt-0.5 ${countdown === 'Overdue' ? 'text-danger-500' : countdown === 'Today' ? 'text-warning-600' : 'text-text-500'}`}>
                            {countdown}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-text-500">No date set</p>
                      )}
                      {isDraft ? (
                        <Badge label={`Draft`} color="bg-surface-100 text-text-500" size="sm" />
                      ) : (
                        <StatusBadge status={release.status} />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CollapsibleSection>

        {/* Recently Updated */}
        <CollapsibleSection title="Recently Updated" count={recentlyUpdated.data.length} defaultOpen>
          {recentlyUpdated.loading ? (
            <SectionSkeleton />
          ) : recentlyUpdated.data.length === 0 ? (
            <p className="text-sm text-text-500 py-4">No recently updated releases.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentlyUpdated.data.map((release) => (
                <ReleaseCard key={release.id} release={release} view="grid" variant={release.lifecycle === 'draft' ? 'draft' : release.lifecycle === 'archived' ? 'archived' : release.lifecycle === 'expired' ? 'archived' : release.status === 'released' ? 'released' : 'active'} mode="compact" />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* All Releases */}
        <CollapsibleSection title="All Releases" count={filteredAll.length} defaultOpen>
          {filteredAll.length === 0 ? (
            <p className="text-sm text-text-500 py-4">No releases match your filters.</p>
          ) : (
            <div className="rounded-xl border border-surface-200 bg-layer-2 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-surface-50 border-b border-surface-200 text-xs font-semibold text-text-500 uppercase tracking-wider">
                <div className="col-span-1">Artwork</div>
                <div className="col-span-4">Release</div>
                <div className="col-span-2">Lifecycle</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-2">Updated</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              {filteredAll.map((release) => {
                const statusMeta = RELEASE_STATUS_CONFIG[release.status];
                return (
                  <div key={release.id} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-surface-50/80 transition-colors border-b border-surface-100 last:border-b-0 items-center">
                    <div className="col-span-1">
                      <ArtworkDisplay artwork={release.artwork} releaseTitle={release.title} size="sm" />
                    </div>
                    <div className="col-span-4 min-w-0">
                      <Link href={`/releases/${release.id}`} className="text-sm font-medium text-primary-400 truncate hover:text-primary-300 block">
                        {release.title}
                      </Link>
                      <span className="text-xs text-text-500 capitalize">{release.releaseType.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-medium text-text-600 capitalize">{release.lifecycle.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="col-span-2">
                      {statusMeta ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      ) : (
                        <span className="text-xs text-text-500 capitalize">{release.status.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs text-text-500">{release.targetReleaseDate ? fmtDate(release.targetReleaseDate) : '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-text-500">{fmtDate(release.updatedAt)}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <Link href={`/releases/${release.id}`} className="text-xs text-primary-500 hover:text-primary-400 font-medium">
                        Open
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}

function ArtworkDisplay({ artwork, releaseTitle, size }: { artwork: { secureUrl: string } | null | undefined; releaseTitle: string; size: string }) {
  if (artwork?.secureUrl) {
    return (
      <img
        src={artwork.secureUrl}
        alt={releaseTitle}
        className={`rounded-md object-cover ${size === 'sm' ? 'w-10 h-10' : 'w-12 h-12'}`}
      />
    );
  }
  return (
    <div className={`rounded-md bg-surface-200 flex items-center justify-center ${size === 'sm' ? 'w-10 h-10' : 'w-12 h-12'}`}>
      <span className="text-xs text-text-500 font-medium">{releaseTitle.charAt(0).toUpperCase()}</span>
    </div>
  );
}
