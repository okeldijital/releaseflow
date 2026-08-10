'use client';

/**
 * BUILD-220B — Shared Releases module presentation.
 *
 * One implementation for:
 *   /releases | /releases/draft | /releases/active | /releases/archived | /releases/schedule
 *
 * Path → lifecycle context → existing hooks / ReleaseCard / toolbar.
 * No second ReleaseCard, no ReleaseTabs, no domain redesign.
 */

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import {
  useReleases,
  useNeedsAttentionReleases,
  useContinueWorking,
  useUpcomingReleases,
  useRecentlyUpdated,
} from '@/hooks/useRelease';
import {
  Button,
  EmptyState,
  LoadingState,
  ModulePage,
  PageTabs,
} from '@releaseflow/ui';
import { ReleaseCard, type ReleaseCardSize } from '@/components/release/cards/ReleaseCard';
import { RELEASE_STATUS_CONFIG, RELEASE_TYPE_LABELS } from '@/components/release/status/release-status-config';
import type { Release } from '@/app/(app)/types';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import {
  buildReleaseWorkspace,
  resolveReleaseCardVariant,
} from '@/lib/release-workspace';
import { RELEASE_PAGE_TABS } from '@/lib/navigation';
import ScheduleView from '@/app/(app)/schedule/schedule-view';

export type ReleasesLifecycleTab =
  | 'all'
  | 'draft'
  | 'active'
  | 'archived'
  | 'schedule';

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

const READINESS_OPTIONS = [
  { value: 'ready', label: 'Ready' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'at_risk', label: 'At Risk' },
];

const TAB_EMPTY: Record<
  Exclude<ReleasesLifecycleTab, 'schedule' | 'all'>,
  { title: string; description: string }
> = {
  draft: {
    title: 'No draft releases yet',
    description: 'Drafts appear here while releases are still being planned.',
  },
  active: {
    title: 'No active releases',
    description: 'Active releases in production or distribution will show here.',
  },
  archived: {
    title: 'No archived releases',
    description: 'Archived releases will appear in this view.',
  },
};

function filterReleases(
  releases: Release[],
  search: string,
  statuses: string[],
  types: string[],
  lifecycles: string[],
  readiness: string[],
): Release[] {
  return releases.filter((r) => {
    if (search) {
      const term = search.toLowerCase();
      const haystack = [r.title, r.upc ?? '', r.catalogNumber ?? ''].join(' ').toLowerCase();
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
      const rd = (r.wizardData as Record<string, unknown> | null | undefined)?.readiness as
        | string
        | undefined;
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
      return sorted.sort(
        (a, b) => getDateValue(b.targetReleaseDate) - getDateValue(a.targetReleaseDate),
      );
    case 'alpha':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'status':
      return sorted.sort((a, b) => {
        const aOrder =
          a.lifecycle === 'draft' ? 0 : a.lifecycle === 'active' ? 1 : a.lifecycle === 'archived' ? 5 : 7;
        const bOrder =
          b.lifecycle === 'draft' ? 0 : b.lifecycle === 'active' ? 1 : b.lifecycle === 'archived' ? 5 : 7;
        return aOrder - bOrder;
      });
    default:
      return sorted;
  }
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

function CollapsibleSection({
  title,
  count,
  defaultOpen,
  children,
  error: sectionError,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
  error?: string | null;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <section className="mb-8" data-section={title}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 mb-4 group"
      >
        <svg
          className={`h-4 w-4 text-text-400 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <h2 className="text-sm font-semibold text-text-500 uppercase tracking-widest">{title}</h2>
        <span className="text-xs text-text-400 bg-surface-100 px-2 py-0.5 rounded-full">{count}</span>
        {sectionError && <span className="text-xs text-danger-500 ml-2">Failed to load</span>}
      </button>
      {open && <div className="animate-fade-in">{children}</div>}
    </section>
  );
}

function ReleaseCardGrid({
  releases,
  view,
  size = 'standard',
}: {
  releases: Release[];
  view: ViewMode;
  size?: ReleaseCardSize;
}) {
  const gridClass =
    view === 'list'
      ? 'grid grid-cols-1 gap-4 max-w-md'
      : size === 'compact'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
        : size === 'large'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

  return (
    <div
      className={gridClass}
      data-release-card-grid
      data-count={releases.length}
      data-size={size}
    >
      {releases.map((release) => (
        <ReleaseCard
          key={release.id}
          release={release}
          size={size}
          variant={resolveReleaseCardVariant(release)}
        />
      ))}
    </div>
  );
}

function lifecycleFromTab(tab: ReleasesLifecycleTab): string[] {
  if (tab === 'draft') return ['draft'];
  if (tab === 'active') return ['active'];
  if (tab === 'archived') return ['archived'];
  return [];
}

export interface ReleasesModuleProps {
  /** Path-driven module tab (BUILD-220B). */
  tab: ReleasesLifecycleTab;
}

export function ReleasesModule({ tab }: ReleasesModuleProps) {
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const pathname = usePathname() || '/releases';
  const { releases, loading, error, refresh } = useReleases();
  const canCreate = AuthorizationService.canCreateRelease();
  const isCollab = AuthorizationService.isCollaboratorWorkspace();

  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('rf-releases-view') as ViewMode) || 'grid';
    }
    return 'grid';
  });
  const [sort, setSort] = useState<string>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterReadiness, setFilterReadiness] = useState<string[]>([]);

  const needsAttention = useNeedsAttentionReleases();
  const continueWorking = useContinueWorking();
  const upcomingReleases = useUpcomingReleases(30);
  const recentlyUpdated = useRecentlyUpdated(10);

  useEffect(() => {
    localStorage.setItem('rf-releases-view', view);
  }, [view]);

  const tabLifecycles = lifecycleFromTab(tab);

  const filteredAll = useMemo(() => {
    const searched = filterReleases(
      releases as Release[],
      '',
      filterStatus,
      filterType,
      tabLifecycles,
      filterReadiness,
    );
    return sortReleases(searched, sort);
  }, [releases, filterStatus, filterType, tabLifecycles, filterReadiness, sort]);

  const workspaceSections = useMemo(
    () =>
      buildReleaseWorkspace({
        catalogue: filteredAll,
        needsAttention: needsAttention.data,
        continueWorking: continueWorking.data,
        upcoming: upcomingReleases.data,
        recentlyUpdated: recentlyUpdated.data,
      }),
    [
      filteredAll,
      needsAttention.data,
      continueWorking.data,
      upcomingReleases.data,
      recentlyUpdated.data,
    ],
  );

  const hasActiveFilters =
    filterStatus.length > 0 || filterType.length > 0 || filterReadiness.length > 0;

  function clearFilters() {
    setFilterStatus([]);
    setFilterType([]);
    setFilterReadiness([]);
  }

  function toggleFilter(arr: string[], value: string): string[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">Releases</h1>
        <p className="mt-1 text-sm text-text-400">
          {tab === 'schedule'
            ? isCollab
              ? 'Release-related schedule and calendar.'
              : 'Schedule assignments and milestones for releases.'
            : releases.length > 0
              ? `${filteredAll.length} of ${releases.length} release${releases.length !== 1 ? 's' : ''}`
              : isCollab
                ? 'Browse every release across your label.'
                : 'Manage every release from planning to distribution.'}
        </p>
      </div>
      {tab !== 'schedule' && activeOrgId && canCreate ? (
        <div className="flex items-center gap-3">
          <Link href="/releases/new">
            <Button variant="primary" size="md" className="rounded-xl">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Release
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );

  const tabs = (
    <PageTabs
      tabs={RELEASE_PAGE_TABS}
      pathname={pathname}
      onNavigate={(href) => router.push(href)}
      aria-label="Releases sections"
    />
  );

  // Schedule tab: reuse existing schedule view (no second system)
  // Distinct from Calendar → Releases (/calendar/releases)
  if (tab === 'schedule') {
    return (
      <div className="page-transition" data-releases-tab="schedule">
        <div className="mx-auto max-w-7xl px-5 sm:px-7 pt-8">
          <ModulePage header={header} tabs={tabs} />
        </div>
        <ScheduleView surface="full" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition" data-releases-tab={tab}>
        <ModulePage header={header} tabs={tabs}>
          <div className="flex items-center justify-center py-24">
            <LoadingState />
          </div>
        </ModulePage>
      </div>
    );
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition" data-releases-tab={tab}>
        <ModulePage header={header} tabs={tabs}>
          <EmptyState
            title="No organisation selected"
            description="Select an organisation from the top bar to view its releases."
            action={{ label: 'Manage Organisations', onClick: () => router.push('/organizations') }}
          />
        </ModulePage>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition" data-releases-tab={tab}>
        <ModulePage header={header} tabs={tabs}>
          <EmptyState
            title="Failed to load releases"
            description={error}
            action={{ label: 'Retry', onClick: refresh }}
          />
        </ModulePage>
      </div>
    );
  }

  const toolbar = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 rounded-xl border border-surface-200 bg-layer-2 px-3 text-sm text-text-600 focus:border-primary-500/60 focus:outline-none"
          aria-label="Sort releases"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-10 px-3 rounded-xl border transition-colors ${
            hasActiveFilters
              ? 'border-primary-500/60 bg-primary-500/10 text-primary-400'
              : 'border-surface-200 text-text-400 hover:text-text-600'
          }`}
          aria-label="Toggle filters"
          aria-expanded={showFilters}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </button>
        <div className="flex rounded-xl border border-surface-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`p-2 ${view === 'grid' ? 'bg-primary-500/10 text-primary-400' : 'text-text-400 hover:text-text-600'}`}
            aria-label="Grid view"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
          </button>
          <button
            type="button"
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

      {showFilters && (
        <div className="mt-3 p-4 rounded-xl border border-surface-200 bg-layer-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-400 uppercase tracking-wider">Filters</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-primary-500 hover:text-primary-400 font-medium"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-6">
            {/* Lifecycle is owned by PageTabs — not duplicated here */}
            <div className="space-y-1.5">
              <span className="text-xs text-text-500 font-medium">Status</span>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
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
                    type="button"
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
                    type="button"
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
    </>
  );

  // Empty catalogue (no releases at all)
  if (releases.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition" data-releases-tab={tab}>
        <ModulePage header={header} tabs={tabs} toolbar={toolbar}>
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
        </ModulePage>
      </div>
    );
  }

  // Lifecycle tab empty state
  if (tab !== 'all' && filteredAll.length === 0) {
    const empty = TAB_EMPTY[tab];
    return (
      <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition" data-releases-tab={tab}>
        <ModulePage header={header} tabs={tabs} toolbar={toolbar}>
          <EmptyState
            title={empty.title}
            description={empty.description}
            action={
              canCreate && tab === 'draft'
                ? { label: 'Create Release', onClick: () => router.push('/releases/new') }
                : undefined
            }
            className="py-16"
          />
        </ModulePage>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-7 py-8 page-transition" data-releases-tab={tab}>
      <ModulePage header={header} tabs={tabs} toolbar={toolbar}>
        {tab === 'all' ? (
          <div
            className="space-y-2"
            data-workspace-sections={workspaceSections.length}
            data-catalogue-count={filteredAll.length}
          >
            <CollapsibleSection
              title="Needs Attention"
              count={needsAttention.data.length}
              defaultOpen
              error={needsAttention.error}
            >
              {needsAttention.loading ? (
                <SectionSkeleton />
              ) : needsAttention.data.length === 0 ? (
                <p className="text-sm text-text-500 py-4">No releases need attention right now.</p>
              ) : (
                <ReleaseCardGrid
                  releases={needsAttention.data.slice(0, 5) as Release[]}
                  view={view}
                  size="compact"
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Continue Working"
              count={continueWorking.data.length}
              defaultOpen
              error={continueWorking.error}
            >
              {continueWorking.loading ? (
                <SectionSkeleton />
              ) : continueWorking.data.length === 0 ? (
                <p className="text-sm text-text-500 py-4">
                  No active work. Start a new release or resume a draft.
                </p>
              ) : (
                <ReleaseCardGrid
                  releases={continueWorking.data as Release[]}
                  view={view}
                  size="standard"
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Upcoming Releases"
              count={upcomingReleases.data.length}
              defaultOpen
              error={upcomingReleases.error}
            >
              {upcomingReleases.loading ? (
                <SectionSkeleton />
              ) : upcomingReleases.data.length === 0 ? (
                <p className="text-sm text-text-500 py-4">No upcoming releases.</p>
              ) : (
                <ReleaseCardGrid
                  releases={upcomingReleases.data as Release[]}
                  view={view}
                  size="standard"
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Recently Updated"
              count={recentlyUpdated.data.length}
              defaultOpen
              error={recentlyUpdated.error}
            >
              {recentlyUpdated.loading ? (
                <SectionSkeleton />
              ) : recentlyUpdated.data.length === 0 ? (
                <p className="text-sm text-text-500 py-4">No recently updated releases.</p>
              ) : (
                <ReleaseCardGrid
                  releases={recentlyUpdated.data as Release[]}
                  view={view}
                  size="compact"
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection title="All Releases" count={filteredAll.length} defaultOpen>
              {filteredAll.length === 0 ? (
                <p className="text-sm text-text-500 py-4">No releases match your filters.</p>
              ) : (
                <ReleaseCardGrid releases={filteredAll} view={view} size="standard" />
              )}
            </CollapsibleSection>
          </div>
        ) : (
          <div data-catalogue-count={filteredAll.length} data-lifecycle={tab}>
            {filteredAll.length === 0 ? (
              <p className="text-sm text-text-500 py-4">No releases match your filters.</p>
            ) : (
              <ReleaseCardGrid releases={filteredAll} view={view} size="standard" />
            )}
          </div>
        )}
      </ModulePage>
    </div>
  );
}
