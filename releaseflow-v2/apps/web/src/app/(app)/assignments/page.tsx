'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAssignments } from '@/hooks/useAssignment';
import { completeUserAssignment, archiveUserAssignment, deleteUserAssignment } from '@/lib/assignment-service';
import { Button, EmptyState, LoadingState, Input, Badge, StatusBadge, ConfirmationDialog } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';

const statusColors: Record<string, string> = {
  draft: 'bg-surface-800 text-text-500',
  assigned: 'bg-primary-500/10 text-primary-400',
  accepted: 'bg-info-500/10 text-info-400',
  in_progress: 'bg-warning-500/10 text-warning-600',
  review: 'bg-accent-500/10 text-accent-400',
  completed: 'bg-success-500/10 text-success-600',
  declined: 'bg-danger-500/10 text-danger-600',
  cancelled: 'bg-surface-800 text-text-500',
  archived: 'bg-surface-800 text-text-500',
};

const priorityColors: Record<string, string> = {
  low: 'bg-surface-800 text-text-500',
  medium: 'bg-primary-500/10 text-primary-400',
  high: 'bg-warning-500/10 text-warning-600',
  urgent: 'bg-danger-500/10 text-danger-600',
};

function formatDate(d: unknown): string {
  if (!d) return '';
  if (d && typeof d === 'object' && 'toDate' in d) return (d as { toDate: () => Date }).toDate().toLocaleDateString();
  return String(d);
}

export default function AssignmentsPage() {
  const { activeOrgId } = useOrgStore();
  const { assignments, loading, refresh } = useAssignments();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (a.status === 'archived' || a.status === 'cancelled' || a.status === 'declined') return false;
      if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== 'all' && a.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      return true;
    });
  }, [assignments, searchQuery, filterPriority, filterStatus]);

  async function handleComplete(id: string) {
    setActionLoading(true);
    try {
      await completeUserAssignment(id, 'current-user');
      toast.success('Assignment completed');
      await refresh();
    } catch {
      toast.error('Failed to complete assignment');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleArchive() {
    if (!archiveId) return;
    setActionLoading(true);
    try {
      await archiveUserAssignment(archiveId, 'current-user');
      toast.success('Assignment archived');
      setArchiveId(null);
      await refresh();
    } catch {
      toast.error('Failed to archive assignment');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!archiveId) return;
    setActionLoading(true);
    try {
      await deleteUserAssignment(archiveId, 'current-user');
      toast.success('Assignment removed');
      setArchiveId(null);
      await refresh();
    } catch {
      toast.error('Failed to remove assignment');
    } finally {
      setActionLoading(false);
    }
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-6xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Assignments</p>
          <p className="mt-1 text-sm text-text-400">Manage work assignments for your team.</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to view assignments." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-7 py-8 page-transition">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Assignments</p>
          <p className="mt-1 text-sm text-text-400">Manage work assignments for your team.</p>
        </div>
        <Link href="/assignments/new">
          <Button>New Assignment</Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="w-64">
          <Input placeholder="Search assignments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-surface-700/60 bg-surface-900 text-surface-100"
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
          className="h-9 px-3 text-sm rounded-md border border-surface-700/60 bg-surface-900 text-surface-100"
        >
          <option value="all">All Status</option>
          <option value="assigned">Assigned</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No results found' : 'No assignments yet'}
          description={searchQuery ? `No assignments match "${searchQuery}"` : 'Create your first assignment to begin tracking work.'}
        />
      ) : (
        <div className="space-y-1.5">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3.5 hover:border-primary-200 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex-1 min-w-0">
                <Link href={`/assignments/${a.id}`} className="block">
                  <p className="text-sm font-medium text-primary-400 truncate">{a.title}</p>
                  <p className="text-xs text-text-500 capitalize">{a.entityType} &middot; {a.role}</p>
                   {Boolean(a.dueDate) && <p className="text-xs text-text-500 mt-0.5">Due: {formatDate(a.dueDate)}</p>}
                </Link>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Badge label={a.priority} color={priorityColors[a.priority] ?? ''} />
                <StatusBadge status={a.status} />
                <div className="flex items-center gap-1">
                  {['assigned', 'accepted', 'in_progress', 'review'].includes(a.status) && (
                    <Button size="sm" variant="ghost" onClick={() => handleComplete(a.id)} disabled={actionLoading}>
                      Complete
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setArchiveId(a.id)} disabled={actionLoading}>
                    Remove
                  </Button>
                </div>
              </div>
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
