'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAssignments } from '@/hooks/useAssignment';
import { archiveUserAssignment } from '@/lib/assignment-service';
import { useAuth } from '@/contexts/auth-context';
import { Button, EmptyState, LoadingState, Input, Badge, StatusBadge, ConfirmationDialog } from '@releaseflow/ui';
import { ArtworkPlaceholder } from '@/components/release/artwork-display';
import { toast } from '@/stores/toast-store';

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
  const { assignments, loading, refresh } = useAssignments();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (a.status === 'archived' || a.status === 'cancelled' || a.status === 'declined') return false;
      if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && !a.releaseTitle?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== 'all' && a.priority !== filterPriority) return false;
      if (filterStatus !== 'all') {
        const display = statusDisplay(a.status);
        if (display !== filterStatus) return false;
      }
      return true;
    });
  }, [assignments, searchQuery, filterPriority, filterStatus]);

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
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Completed">Completed</option>
          <option value="Blocked">Blocked</option>
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
              className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 hover:shadow-sm transition-all duration-150"
            >
              <Link href={`/assignments/${a.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                {a.releaseArtwork?.secureUrl ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-800">
                    <img src={a.releaseArtwork.secureUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : a.releaseTitle ? (
                  <ArtworkPlaceholder title={a.releaseTitle} size="sm" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary-400 truncate">{a.title}</p>
                  <div className="flex items-center gap-2 text-xs text-text-500 mt-0.5">
                    {a.releaseTitle ? <span className="truncate">{a.releaseTitle}</span> : null}
                    {a.trackTitle ? <span>· {a.trackTitle}</span> : null}
                    {!a.releaseTitle && !a.trackTitle ? (
                      <span className="capitalize">{a.entityType}</span>
                    ) : null}
                    <span>· {a.role}</span>
                  </div>
                  {a.assigneeName ? (
                    <p className="text-xs text-text-400 mt-0.5">{a.assigneeName}</p>
                  ) : null}
                  {Boolean(a.dueDate) && (
                    <p className="text-xs text-text-500 mt-0.5">Due: {formatDate(a.dueDate)}</p>
                  )}
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Badge label={a.priority} color={priorityColors[a.priority] ?? ''} />
                <StatusBadge status={statusDisplay(a.status).toLowerCase().replace(/ /g, '_')} />
                <Button size="sm" variant="ghost" onClick={() => setArchiveId(a.id)} disabled={actionLoading}>
                  Remove
                </Button>
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
