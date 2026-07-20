'use client';

/**
 * EPIC-207 — Assignment Workspace 2.0
 *
 * Primary operational workspace: What should I work on right now?
 * Pipeline: Repository → Service → Workspace Builder → Section → AssignmentCard
 */

import Link from 'next/link';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import {
  resolveActorIdentityKeys,
  assignmentMatchesIdentity,
} from '@/lib/assignment-identity';
import {
  Button, EmptyState, LoadingState, Input,
} from '@releaseflow/ui';
import { useDebounce } from '@/hooks/useDebounce';
import {
  loadAssignmentWorkspaceRecords,
  filterWorkspaceRecords,
  type AssignmentWorkspaceRecord,
} from '@/lib/assignment-workspace-service';
import {
  buildAssignmentWorkspace,
  type AssignmentWorkspaceSection,
} from '@/lib/assignment-workspace';
import { AssignmentCard, type AssignmentCardMode } from '@/components/assignments/cards/AssignmentCard';
import { getRecentActivity } from '@/lib/activity-service';

type ViewMode = 'grid' | 'list';

function CollapsibleSection({
  title,
  count,
  defaultOpen,
  children,
  viewAllHref,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  viewAllHref?: string;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <section className="mb-8" data-section={title}>
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 group"
        >
          <svg className={`h-4 w-4 text-text-400 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-sm font-semibold text-text-500 uppercase tracking-widest">{title}</h2>
          <span className="text-xs text-text-400 bg-surface-100 px-2 py-0.5 rounded-full">{count}</span>
        </button>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-xs font-medium text-primary-500 hover:text-primary-400">
            View All
          </Link>
        ) : null}
      </div>
      {open && <div className="animate-fade-in">{children}</div>}
    </section>
  );
}

function AssignmentCardGrid({
  records,
  view,
  mode = 'compact',
}: {
  records: AssignmentWorkspaceRecord[];
  view: ViewMode;
  mode?: AssignmentCardMode;
}) {
  if (view === 'list' || mode === 'table' || mode === 'table-row') {
    return (
      <div
        className="rounded-xl border border-surface-200 bg-layer-2 overflow-hidden divide-y divide-surface-100"
        data-assignment-card-grid
        data-count={records.length}
      >
        {records.map((r) => (
          <AssignmentCard key={r.assignment.id} record={r} mode="table" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      data-assignment-card-grid
      data-count={records.length}
    >
      {records.map((r) => (
        <AssignmentCard key={r.assignment.id} record={r} mode={mode} />
      ))}
    </div>
  );
}

export default function AssignmentsPage() {
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();
  const isCollab = AuthorizationService.isCollaboratorWorkspace();
  const canManage = AuthorizationService.canManageAssignments();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [view, setView] = useState<ViewMode>('grid');
  const [identityKeys, setIdentityKeys] = useState<Set<string>>(new Set());
  const [records, setRecords] = useState<AssignmentWorkspaceRecord[]>([]);
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !activeOrgId) {
      setIdentityKeys(new Set());
      return;
    }
    void resolveActorIdentityKeys(activeOrgId, user.uid).then(setIdentityKeys);
  }, [user?.uid, activeOrgId]);

  const load = useCallback(async () => {
    if (!activeOrgId) {
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await loadAssignmentWorkspaceRecords({
        organizationId: activeOrgId,
        meIdentityKeys: identityKeys,
        sort: 'newest',
      });
      setRecords(data);

      // BUILD-009 — activity-driven recently updated (best-effort)
      try {
        const acts = await getRecentActivity(activeOrgId, 40);
        const ids: string[] = [];
        for (const ev of acts) {
          // Activity stream uses entityType "task" for assignments
          if (ev.entityType === 'task' && ev.entityId && !ids.includes(ev.entityId)) {
            ids.push(ev.entityId);
          }
        }
        setActivityIds(ids);
      } catch {
        setActivityIds([]);
      }
    } catch (err) {
      console.error('[AssignmentWorkspace] load failed', err);
      setError('Failed to load assignments.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, identityKeys]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredCatalogue = useMemo(() => {
    let base = records;
    if (isCollab) {
      base = base.filter((r) => assignmentMatchesIdentity(r.assignment, identityKeys));
    }
    return filterWorkspaceRecords(base, {
      search: debouncedSearch,
      status: filterStatus !== 'all' ? [filterStatus] : undefined,
      priority: filterPriority !== 'all' ? [filterPriority] : undefined,
    });
  }, [records, isCollab, identityKeys, debouncedSearch, filterStatus, filterPriority]);

  const workspace = useMemo(
    () =>
      buildAssignmentWorkspace({
        catalogue: filteredCatalogue,
        activityUpdatedIds: activityIds,
      }),
    [filteredCatalogue, activityIds],
  );

  const sectionById = useMemo(() => {
    const map = new Map<string, AssignmentWorkspaceSection>();
    for (const s of workspace.sections) map.set(s.id, s);
    return map;
  }, [workspace.sections]);

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-7 py-8 page-transition">
        <EmptyState title="No organization selected" description="Select an organization to view assignments." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState />
      </div>
    );
  }

  const needsAttention = sectionById.get('needs_attention');
  const dueToday = sectionById.get('due_today');
  const awaitingReview = sectionById.get('awaiting_review');
  const recentlyUpdated = sectionById.get('recently_updated');
  const allSection = sectionById.get('all');

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-7 py-6 sm:py-8 page-transition">
      <div className="flex items-center justify-between mb-5 sm:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-display-md font-semibold text-primary-400 tracking-tight">
            {isCollab ? 'My Work' : 'Assignments'}
          </h1>
          <p className="mt-1 text-sm text-text-400">
            {filteredCatalogue.length} of {records.length} assignment
            {records.length !== 1 ? 's' : ''}
            {isCollab ? ' — what should I work on right now?' : ' — team operational workspace'}
          </p>
        </div>
        {canManage ? (
          <Link href="/assignments/new" className="shrink-0">
            <Button className="min-h-[48px] sm:min-h-0">New</Button>
          </Link>
        ) : null}
      </div>

      {/* Search + Filters + View */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Search title, release, track, owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[48px] sm:min-h-0"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="min-h-[48px] sm:h-9 px-3 text-sm rounded-xl border border-surface-200 bg-layer-2 text-text-600"
            aria-label="Filter by priority"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="min-h-[48px] sm:h-9 px-3 text-sm rounded-xl border border-surface-200 bg-layer-2 text-text-600"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
          <div className="flex rounded-xl border border-surface-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`p-2 ${view === 'grid' ? 'bg-primary-500/10 text-primary-400' : 'text-text-400'}`}
              aria-label="Grid view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`p-2 ${view === 'list' ? 'bg-primary-500/10 text-primary-400' : 'text-text-400'}`}
              aria-label="List view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
          {error}
          <button type="button" className="ml-3 underline" onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}

      {filteredCatalogue.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? 'No results found' : 'No assignments yet'}
          description={
            debouncedSearch
              ? `No assignments match "${debouncedSearch}"`
              : isCollab
                ? 'When work is assigned to you, it will appear here.'
                : 'Create your first assignment to begin tracking work.'
          }
          action={
            canManage && !debouncedSearch
              ? { label: 'New Assignment', onClick: () => { window.location.href = '/assignments/new'; } }
              : undefined
          }
        />
      ) : (
        <div data-workspace-sections={workspace.sections.length} data-catalogue-count={filteredCatalogue.length}>
          <CollapsibleSection
            title="Needs Attention"
            count={needsAttention?.items.length ?? 0}
            defaultOpen
            viewAllHref="/assignments"
          >
            {(needsAttention?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-text-500 py-4">Nothing needs attention right now.</p>
            ) : (
              <AssignmentCardGrid records={needsAttention?.items ?? []} view={view} mode="workspace" />
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Due Today" count={dueToday?.items.length ?? 0} defaultOpen>
            {(dueToday?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-text-500 py-4">No assignments due today.</p>
            ) : (
              <AssignmentCardGrid records={dueToday?.items ?? []} view={view} mode="compact" />
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Awaiting Review" count={awaitingReview?.items.length ?? 0} defaultOpen>
            {(awaitingReview?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-text-500 py-4">No reviews pending.</p>
            ) : (
              <AssignmentCardGrid records={awaitingReview?.items ?? []} view={view} mode="compact" />
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Recently Updated" count={recentlyUpdated?.items.length ?? 0} defaultOpen>
            {(recentlyUpdated?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-text-500 py-4">No recent activity.</p>
            ) : (
              <AssignmentCardGrid records={recentlyUpdated?.items ?? []} view={view} mode="compact" />
            )}
          </CollapsibleSection>

          <CollapsibleSection title="All Assignments" count={allSection?.items.length ?? 0} defaultOpen>
            <AssignmentCardGrid
              records={allSection?.items ?? []}
              view={view}
              mode={view === 'list' ? 'table' : 'workspace'}
            />
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}
