'use client';

/**
 * MUX-001 — Assignments list: card-based on mobile for contributors;
 * desktop managers retain management controls.
 */

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAssignments } from '@/hooks/useAssignment';
import { archiveUserAssignment } from '@/lib/assignment-service';
import { useAuth } from '@/contexts/auth-context';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import {
  resolveActorIdentityKeys,
  assignmentMatchesIdentity,
} from '@/lib/assignment-identity';
import {
  Button, EmptyState, LoadingState, Input, ConfirmationDialog,
} from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';
import { AssignmentCard } from '@/components/mobile/assignment-card';

function statusDisplay(s: string): string {
  const map: Record<string, string> = {
    assigned: 'Not Started',
    accepted: 'Not Started',
    in_progress: 'In Progress',
    review: 'In Review',
    completed: 'Completed',
    blocked: 'Blocked',
  };
  return map[s] ?? s.replace(/_/g, ' ');
}

export default function AssignmentsPage() {
  const { activeOrgId } = useOrgStore();
  const { assignments, loading, error, refresh } = useAssignments();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [identityKeys, setIdentityKeys] = useState<Set<string>>(new Set());

  const isCollab = AuthorizationService.isCollaboratorWorkspace();
  const canManage = AuthorizationService.canManageAssignments();

  useEffect(() => {
    if (!user?.uid || !activeOrgId) {
      setIdentityKeys(new Set());
      return;
    }
    void resolveActorIdentityKeys(activeOrgId, user.uid).then(setIdentityKeys);
  }, [user?.uid, activeOrgId]);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (a.status === 'archived' || a.status === 'cancelled' || a.status === 'declined') return false;
      // Collaborators: only own assignments (Person.id or assigneeUserId)
      if (isCollab && !assignmentMatchesIdentity(a, identityKeys)) return false;
      if (
        searchQuery
        && !a.title.toLowerCase().includes(searchQuery.toLowerCase())
        && !a.releaseTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (filterPriority !== 'all' && a.priority !== filterPriority) return false;
      if (filterStatus !== 'all') {
        const display = statusDisplay(a.status);
        if (display !== filterStatus) return false;
      }
      return true;
    });
  }, [assignments, searchQuery, filterPriority, filterStatus, isCollab, identityKeys]);

  async function handleArchive() {
    if (!archiveId) return;
    setActionLoading(true);
    try {
      await archiveUserAssignment(archiveId, user?.uid ?? '');
      toast.success('Assignment archived');
      setArchiveId(null);
      await refresh();
    } catch {
      toast.error('Failed to archive assignment');
    } finally {
      setActionLoading(false);
    }
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-7 py-8 page-transition">
        <EmptyState title="No organization selected" description="Select an organization to view assignments." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg md:max-w-3xl lg:max-w-6xl px-4 sm:px-7 py-6 sm:py-8 page-transition">
      <div className="flex items-center justify-between mb-5 sm:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-display-md font-semibold text-primary-400 tracking-tight">
            {isCollab ? 'My Assignments' : 'Assignments'}
          </h1>
          <p className="mt-1 text-sm text-text-400">
            {isCollab ? 'Work assigned to you.' : 'Manage work assignments for your team.'}
          </p>
        </div>
        {canManage ? (
          <Link href="/assignments/new" className="shrink-0">
            <Button className="min-h-[48px] sm:min-h-0">New</Button>
          </Link>
        ) : null}
      </div>

      {/* Filters: stack on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-[48px] sm:min-h-0"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="min-h-[48px] sm:h-9 flex-1 sm:flex-none px-3 text-sm rounded-xl sm:rounded-md border border-surface-700/60 bg-surface-900 text-surface-100"
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
            className="min-h-[48px] sm:h-9 flex-1 sm:flex-none px-3 text-sm rounded-xl sm:rounded-md border border-surface-700/60 bg-surface-900 text-surface-100"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Completed">Completed</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
          {error}
          <button type="button" className="ml-3 underline" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No results found' : 'No assignments yet'}
          description={
            searchQuery
              ? `No assignments match "${searchQuery}"`
              : isCollab
                ? 'When work is assigned to you, it will appear here.'
                : 'Create your first assignment to begin tracking work.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="relative">
              <AssignmentCard
                assignment={{
                  id: a.id,
                  title: a.title,
                  role: a.role,
                  priority: a.priority,
                  status: a.status,
                  dueDate: a.dueDate,
                  releaseTitle: a.releaseTitle,
                  releaseArtwork: a.releaseArtwork,
                  entityType: a.entityType,
                }}
                ctaLabel="Open Assignment"
              />
              {canManage ? (
                <button
                  type="button"
                  onClick={() => setArchiveId(a.id)}
                  disabled={actionLoading}
                  className="absolute top-3 right-3 text-xs text-text-500 hover:text-danger-400 min-h-[44px] min-w-[44px] px-2 hidden md:inline-flex items-center justify-center"
                >
                  Archive
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={!!archiveId}
        onClose={() => setArchiveId(null)}
        onConfirm={handleArchive}
        title="Archive Assignment"
        message="This will archive the assignment. It can be restored later."
        confirmLabel="Archive"
        loading={actionLoading}
      />
    </div>
  );
}
