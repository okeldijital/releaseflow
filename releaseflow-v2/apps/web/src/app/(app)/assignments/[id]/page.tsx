'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAssignment } from '@/hooks/useAssignment';
import {
  editAssignment, acceptUserAssignment, declineUserAssignment, completeUserAssignment,
  reopenUserAssignment, archiveUserAssignment, restoreUserAssignment,
} from '@/lib/assignment-service';
import type { AssignmentStatus, AssignmentPriority } from '@/lib/assignment-service';
import {
  Badge, Button, EmptyState, Input, StatusBadge, TextArea, Select, Tabs,
  WorkspaceLayout, Skeleton, ConfirmationDialog, WorkspaceCard,
} from '@releaseflow/ui';
import { OperationalSummary } from '@releaseflow/domain-ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { toast } from '@/stores/toast-store';
import { CommentSection } from '@/components/comments/comment-section';
import { useAuth } from '@/contexts/auth-context';

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

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
];

const priorityColors: Record<string, string> = {
  low: 'bg-surface-800 text-text-500',
  medium: 'bg-primary-500/10 text-primary-400',
  high: 'bg-warning-500/10 text-warning-600',
  urgent: 'bg-danger-500/10 text-danger-600',
};

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function formatDate(d: unknown): string {
  if (!d) return '';
  if (d && typeof d === 'object' && 'toDate' in d) return (d as { toDate: () => Date }).toDate().toLocaleDateString();
  return String(d);
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { assignment, activities, loading, refresh } = useAssignment(id);
  const { user } = useAuth();

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<AssignmentStatus>('draft');
  const [editPriority, setEditPriority] = useState<AssignmentPriority>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editRole, setEditRole] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [archiveDialog, setArchiveDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (assignment) {
      setEditTitle(assignment.title);
      setEditDesc(assignment.description ?? '');
      setEditStatus(assignment.status);
      setEditPriority(assignment.priority);
      setEditDueDate(formatDate(assignment.dueDate));
      setEditRole(assignment.role);
    }
  }, [assignment]);

  const handleSave = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!assignment) return;
    setActionLoading(true);
    try {
      await editAssignment(assignment.id, {
        title: editTitle,
        description: editDesc || null,
        role: editRole,
        priority: editPriority,
        status: editStatus,
      }, user?.uid ?? '');
      toast.success('Assignment updated');
      setEditing(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  }, [assignment, editTitle, editDesc, editRole, editPriority, editStatus, user, refresh]);

  const handleArchive = useCallback(async () => {
    if (!assignment) return;
    setActionLoading(true);
    try {
      await archiveUserAssignment(assignment.id, user?.uid ?? '');
      setArchiveDialog(false);
      await refresh();
      toast.success('Assignment archived');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive');
    } finally {
      setActionLoading(false);
    }
  }, [assignment, user, refresh]);

  const handleDelete = useCallback(async () => {
    if (!assignment) return;
    setActionLoading(true);
    try {
      await archiveUserAssignment(assignment.id, user?.uid ?? '');
      setDeleteDialog(false);
      toast.success('Assignment archived');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive');
    } finally {
      setActionLoading(false);
    }
  }, [assignment, user, refresh]);

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="px-6 py-6"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-4 w-96 mb-8" /><Skeleton className="h-64 w-full" /></div>
      </WorkspaceLayout>
    );
  }

  if (!assignment) {
    return (
      <WorkspaceLayout>
        <div className="px-6 py-6"><EmptyState title="Assignment not found" description="This assignment may have been removed." /></div>
      </WorkspaceLayout>
    );
  }

  const overflowMenuItems = [
    { id: 'edit', label: 'Edit', onClick: () => setEditing(true) },
    ...(assignment.status === 'archived'
      ? [{ id: 'restore', label: 'Restore', onClick: () => restoreUserAssignment(assignment.id, user?.uid ?? '').then(refresh).catch((e) => toast.error(e.message)) }]
      : [{ id: 'archive', label: 'Archive', onClick: () => setArchiveDialog(true) }]
    ),
    { id: 'delete', label: 'Archive', variant: 'danger' as const, onClick: () => setDeleteDialog(true), separatorBefore: true },
  ];

  const contextRailContent = (
    <div className="p-4 space-y-6">
      <div className="space-y-3">
        <div>
          <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Status</p>
          <StatusBadge status={assignment.status} />
        </div>
        <div>
          <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Priority</p>
          <Badge label={assignment.priority} color={priorityColors[assignment.priority] ?? 'bg-surface-800 text-text-500'} />
        </div>
        <div>
          <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Assignee</p>
          <p className="text-sm text-surface-100">{assignment.assigneeName ?? 'Unknown Person'}</p>
        </div>
        <div>
          <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Assigned By</p>
          <p className="text-sm text-surface-100">{assignment.assignerName ?? 'Unknown Person'}</p>
        </div>
        <div>
          <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Role</p>
          <p className="text-sm text-surface-100">{assignment.role}</p>
        </div>
        {assignment.dueDate ? (
          <div>
            <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Due Date</p>
            <p className="text-sm text-surface-100">{formatDate(assignment.dueDate)}</p>
          </div>
        ) : null}
        {assignment.estimatedHours ? (
          <div>
            <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Est. Hours</p>
            <p className="text-sm text-surface-100">{assignment.estimatedHours}h</p>
          </div>
        ) : null}
      </div>
      <OperationalSummary
        healthScore={assignment.status === 'completed' ? 100 : 50}
        currentStage={assignment.status}
        completedStages={0}
        totalStages={1}
        readyItems={assignment.status === 'completed' ? 1 : 0}
        totalItems={1}
        pendingApprovals={0}
        blockers={0}
        daysUntilRelease={0}
      />
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity', count: activities.length },
    { id: 'comments', label: 'Comments' },
  ];

  return (
    <WorkspaceLayout contextRail={contextRailContent}>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/assignments" className="text-sm text-text-400 hover:text-surface-50 inline-block">
            &larr; Back to assignments
          </Link>
          <EntityOverflowMenu items={overflowMenuItems} aria-label="Assignment actions" />
        </div>

        <div className="flex items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <Input label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                <TextArea label="Description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Status" options={statusOptions} value={editStatus} onChange={(v) => setEditStatus(v as AssignmentStatus)} />
                  <Select label="Priority" options={priorityOptions} value={editPriority} onChange={(v) => setEditPriority(v as AssignmentPriority)} />
                </div>
                <Input label="Role" value={editRole} onChange={(e) => setEditRole(e.target.value)} />
                <Input label="Due Date" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                <div className="flex gap-2">
                  <Button type="submit" loading={actionLoading}>Save</Button>
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-display-md font-semibold text-primary-400 tracking-tight mb-1">{assignment.title}</h1>
                <div className="flex items-center gap-3 text-sm text-text-500 mb-2">
                  <Badge label={assignment.status.replace(/_/g, ' ')} color={statusColors[assignment.status] ?? 'bg-surface-800 text-text-500'} />
                  <Badge label={assignment.priority} color={priorityColors[assignment.priority] ?? 'bg-surface-800 text-text-500'} />
                  <span>{assignment.role}</span>
                </div>
                {assignment.description ? <p className="text-sm text-text-400 mb-4">{assignment.description}</p> : null}
                <div className="flex items-center gap-4 text-xs text-text-500">
                  <span>Entity: {assignment.entityType} ({assignment.entityId})</span>
                  {assignment.dueDate ? <span>Due: {formatDate(assignment.dueDate)}</span> : null}
                  {assignment.estimatedHours ? <span>{assignment.estimatedHours}h estimated</span> : null}
                </div>
              </>
            )}
          </div>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview' && (
          <div className="mt-6 space-y-6">
            <WorkspaceCard title="Quick Actions">
              <div className="flex flex-wrap gap-2">
                {assignment.status === 'assigned' && (
                  <>
                    <Button size="sm" onClick={async () => { try { await acceptUserAssignment(assignment.id, user?.uid ?? ''); await refresh(); toast.success('Accepted'); } catch (e) { toast.error((e as Error).message); } }}>Accept</Button>
                    <Button size="sm" variant="ghost" onClick={async () => { try { await declineUserAssignment(assignment.id, user?.uid ?? ''); await refresh(); toast.success('Declined'); } catch (e) { toast.error((e as Error).message); } }}>Decline</Button>
                  </>
                )}
                {['accepted', 'in_progress'].includes(assignment.status) && (
                  <Button size="sm" onClick={async () => { try { await completeUserAssignment(assignment.id, user?.uid ?? ''); await refresh(); toast.success('Completed!'); } catch (e) { toast.error((e as Error).message); } }}>Mark Complete</Button>
                )}
                {assignment.status === 'completed' && (
                  <Button size="sm" variant="ghost" onClick={async () => { try { await reopenUserAssignment(assignment.id, user?.uid ?? ''); await refresh(); toast.success('Reopened'); } catch (e) { toast.error((e as Error).message); } }}>Reopen</Button>
                )}
              </div>
            </WorkspaceCard>
            <WorkspaceCard title="Details">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-text-400">Entity Type</p><p className="text-surface-100 capitalize">{assignment.entityType}</p></div>
                <div><p className="text-text-400">Entity ID</p><p className="text-surface-100">{assignment.entityId}</p></div>
                <div><p className="text-text-400">Assignee</p><p className="text-surface-100">{assignment.assigneeName ?? 'Unknown Person'}</p></div>
                <div><p className="text-text-400">Assigner</p><p className="text-surface-100">{assignment.assignerName ?? 'Unknown Person'}</p></div>
                <div><p className="text-text-400">Role</p><p className="text-surface-100">{assignment.role}</p></div>
                <div><p className="text-text-400">Priority</p><p className="text-surface-100 capitalize">{assignment.priority}</p></div>
                {assignment.dueDate ? <div><p className="text-text-400">Due Date</p><p className="text-surface-100">{formatDate(assignment.dueDate)}</p></div> : null}
                {assignment.estimatedHours ? <div><p className="text-text-400">Est. Hours</p><p className="text-surface-100">{assignment.estimatedHours}h</p></div> : null}
                {assignment.actualHours ? <div><p className="text-text-400">Actual Hours</p><p className="text-surface-100">{assignment.actualHours}h</p></div> : null}
                {assignment.completedAt ? <div><p className="text-text-400">Completed At</p><p className="text-surface-100">{formatDate(assignment.completedAt)}</p></div> : null}
              </div>
            </WorkspaceCard>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="mt-6">
            {activities.length === 0 ? (
              <EmptyState title="No activity yet" description="Activity will appear here as the assignment progresses." />
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-100 capitalize">{act.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-text-500 mt-1">{formatDate(act.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="mt-6">
            <CommentSection entityType="task" entityId={id} title="Comments" />
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={archiveDialog}
        onClose={() => setArchiveDialog(false)}
        onConfirm={handleArchive}
        title="Archive Assignment"
        message="This will archive the assignment. It can be restored later."
        confirmLabel="Archive"
        loading={actionLoading}
      />
      <ConfirmationDialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Archive Assignment"
        message="This will archive the assignment."
        confirmLabel="Archive"
        loading={actionLoading}
      />
    </WorkspaceLayout>
  );
}
