'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAssignment } from '@/hooks/useAssignment';
import {
  acceptUserAssignment, declineUserAssignment, markAsStarted,
  submitForReviewAssignment, approveUserAssignment,
  requestChangesUserAssignment, rejectUserAssignment,
  blockUserAssignment, unblockUserAssignment,
  reopenUserAssignment, archiveUserAssignment, restoreUserAssignment,
  canManageReview,
} from '@/lib/assignment-service';
import {
  watchAssignment, unwatchAssignment, isWatchingAssignment,
} from '@/lib/assignment-watchers-service';
import { addDeliverableLink, removeDeliverableLink } from '@/lib/deliverable-link-service';
import type { DeliverableLinkProvider } from '@/lib/deliverable-link-service';
import {
  Badge, Button, ConfirmationDialog, Tabs,
  WorkspaceLayout, Skeleton, WorkspaceCard,
  Modal, TextArea,
} from '@releaseflow/ui';
import { ArtworkPlaceholder } from '@/components/release/artwork-display';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { ReleaseContextCard } from '@/components/assignments/release-context-card';
import { DeliverableLinksSection } from '@/components/assignments/deliverable-links-section';
import { ActivityTimeline } from '@/components/assignments/activity-timeline';
import { AssignmentCommentsPanel } from '@/components/assignments/assignment-comments-panel';
import { ReviewPanel } from '@/components/assignments/review-panel';
import { toast } from '@/stores/toast-store';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { useRoleStore } from '@/stores/role-store';
import { resolvePersonNames } from '@/lib/resolve-person-names';

const sColors: Record<string, string> = {
  assigned: 'bg-surface-800 text-text-500',
  accepted: 'bg-surface-800 text-text-500',
  in_progress: 'bg-warning-500/10 text-warning-600',
  review: 'bg-info-500/10 text-info-400',
  completed: 'bg-success-500/10 text-success-600',
  blocked: 'bg-danger-500/10 text-danger-600',
  declined: 'bg-surface-800 text-text-500',
  cancelled: 'bg-surface-800 text-text-500',
  archived: 'bg-surface-800 text-text-500',
};

const priorityColors: Record<string, string> = {
  low: 'bg-surface-800 text-text-500',
  medium: 'bg-primary-500/10 text-primary-400',
  high: 'bg-warning-500/10 text-warning-600',
  urgent: 'bg-danger-500/10 text-danger-600',
};

function sLabel(s: string): string {
  const map: Record<string, string> = {
    assigned: 'Not Started',
    accepted: 'Not Started',
    in_progress: 'In Progress',
    review: 'In Review',
    completed: 'Completed',
    blocked: 'Blocked',
    cancelled: 'Cancelled',
  };
  return map[s] ?? s.replace(/_/g, ' ');
}

function fmtDate(d: unknown): string {
  if (!d) return '';
  if (d && typeof d === 'object' && 'toDate' in d) return (d as { toDate: () => Date }).toDate().toLocaleDateString();
  return String(d);
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { assignment, activities, deliverableLinks, releaseContext, loading, refresh } = useAssignment(id);
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const { role } = useRoleStore();

  const [activeTab, setActiveTab] = useState('workspace');
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changesNotes, setChangesNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [archiveDialog, setArchiveDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [watching, setWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [reviewNames, setReviewNames] = useState<{ reviewer: string | null; requester: string | null }>({
    reviewer: null,
    requester: null,
  });

  const isAssignee = assignment?.assigneeId === user?.uid;
  const isManager = canManageReview(role);

  const act = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    try { await fn(); await refresh(); } catch (e) { toast.error((e as Error).message); } finally { setActionLoading(false); }
  };

  const handleAccept = () => act(() => acceptUserAssignment(id, user?.uid ?? ''));
  const handleStart = () => act(() => markAsStarted(id, user?.uid ?? ''));
  const handleSubmitReview = () => act(() => submitForReviewAssignment(id, user?.uid ?? ''));
  const handleApprove = () => act(() => approveUserAssignment(id, user?.uid ?? '', role));
  const handleReopen = () => act(() => reopenUserAssignment(id, user?.uid ?? ''));
  const handleUnblock = () => act(() => unblockUserAssignment(id, user?.uid ?? ''));

  const loadWatchState = useCallback(async () => {
    if (!user?.uid || !id) return;
    try {
      setWatching(await isWatchingAssignment(id, user.uid));
    } catch {
      setWatching(false);
    }
  }, [id, user?.uid]);

  useEffect(() => { void loadWatchState(); }, [loadWatchState]);

  useEffect(() => {
    if (!assignment) return;
    const ids = [assignment.reviewedBy, assignment.reviewRequestedBy].filter(Boolean) as string[];
    if (ids.length === 0) {
      setReviewNames({ reviewer: null, requester: null });
      return;
    }
    void resolvePersonNames(ids).then((map) => {
      setReviewNames({
        reviewer: assignment.reviewedBy ? map.get(assignment.reviewedBy) ?? null : null,
        requester: assignment.reviewRequestedBy ? map.get(assignment.reviewRequestedBy) ?? null : null,
      });
    });
  }, [assignment]);

  const handleToggleWatch = async () => {
    if (!user?.uid || !activeOrgId) return;
    setWatchLoading(true);
    try {
      if (watching) {
        await unwatchAssignment(id, user.uid, activeOrgId);
        setWatching(false);
        toast.success('Stopped watching');
      } else {
        await watchAssignment(id, user.uid, activeOrgId);
        setWatching(true);
        toast.success('Watching assignment');
      }
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setWatchLoading(false);
    }
  };

  const handleDecline = async () => {
    setActionLoading(true);
    try {
      await declineUserAssignment(id, user?.uid ?? '', declineReason || undefined);
      setShowDeclineModal(false);
      setDeclineReason('');
      await refresh();
      toast.success('Assignment declined');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    setActionLoading(true);
    try {
      await blockUserAssignment(id, user?.uid ?? '', blockReason || undefined);
      setShowBlockModal(false);
      setBlockReason('');
      await refresh();
      toast.success('Assignment blocked');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    setActionLoading(true);
    try {
      await requestChangesUserAssignment(id, user?.uid ?? '', role, changesNotes || undefined);
      setShowChangesModal(false);
      setChangesNotes('');
      await refresh();
      toast.success('Changes requested');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await rejectUserAssignment(id, user?.uid ?? '', role, rejectNotes || undefined);
      setShowRejectModal(false);
      setRejectNotes('');
      await refresh();
      toast.success('Assignment rejected');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      await archiveUserAssignment(id, user?.uid ?? '');
      setArchiveDialog(false);
      await refresh();
      toast.success('Assignment archived');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDeliverableLink = async (fields: { url: string; label: string; provider: DeliverableLinkProvider }) => {
    if (!activeOrgId || !user) return;
    await addDeliverableLink({
      assignmentId: id,
      organizationId: activeOrgId,
      provider: fields.provider,
      url: fields.url,
      label: fields.label,
      createdBy: user.uid,
    });
    await refresh();
  };

  const handleRemoveDeliverableLink = async (linkId: string) => {
    if (!activeOrgId || !user) return;
    await removeDeliverableLink(linkId, id, activeOrgId, user.uid);
    await refresh();
  };

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
        <div className="px-6 py-6">
          <p className="text-display-md font-semibold text-primary-400 mb-4">Assignment not found</p>
          <p className="text-sm text-text-500">This assignment may have been removed.</p>
        </div>
      </WorkspaceLayout>
    );
  }

  const overflowItems = [
    {
      id: 'watch',
      label: watching ? 'Unwatch' : 'Watch',
      onClick: () => void handleToggleWatch(),
    },
    ...(assignment.status === 'archived'
      ? [{ id: 'restore', label: 'Restore', onClick: () => act(() => restoreUserAssignment(id, user?.uid ?? '')) }]
      : [{ id: 'archive', label: 'Archive', onClick: () => setArchiveDialog(true) }]
    ),
    { id: 'delete', label: 'Delete', variant: 'danger' as const, onClick: () => setDeleteDialog(true), separatorBefore: true },
  ];

  const statusLabel = sLabel(assignment.status);
  const canBlock = ['in_progress', 'review'].includes(assignment.status) && isManager;
  const canUnblock = assignment.status === 'blocked' && isManager;

  const contextRailContent = (
    <div className="p-4 space-y-6">
      {releaseContext ? (
        <div>
          <p className="text-xs text-text-400 uppercase tracking-wider mb-2">Release</p>
          <Link href={`/releases/${releaseContext.releaseId}`} className="block">
            {releaseContext.artwork?.secureUrl ? (
              <img
                src={releaseContext.artwork.secureUrl}
                alt={releaseContext.releaseTitle}
                className="w-full aspect-square rounded-xl object-cover mb-2"
              />
            ) : (
              <ArtworkPlaceholder title={releaseContext.releaseTitle} size="lg" />
            )}
          </Link>
          <Link
            href={`/releases/${releaseContext.releaseId}`}
            className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors block truncate"
          >
            {releaseContext.releaseTitle}
          </Link>
          <p className="text-xs text-text-500 mt-0.5">{releaseContext.artistName}</p>
          {releaseContext.trackTitle ? (
            <p className="text-xs text-text-400 mt-0.5">{releaseContext.trackPosition}. {releaseContext.trackTitle}</p>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-3">
        <div>
          <p className="text-xs text-text-400 uppercase tracking-wider mb-1">Status</p>
          <div className="flex items-center gap-2">
            <Badge label={statusLabel} size="md" color={sColors[assignment.status] ?? 'bg-surface-800 text-text-500'} />
            {assignment.status === 'review' ? <span className="text-xs text-info-400">Awaiting approval</span> : null}
          </div>
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
            <p className="text-sm text-surface-100">{fmtDate(assignment.dueDate)}</p>
          </div>
        ) : null}
        <div>
          <Button size="sm" variant="ghost" onClick={() => void handleToggleWatch()} loading={watchLoading} className="w-full">
            {watching ? 'Unwatch' : 'Watch'}
          </Button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'workspace', label: 'Workspace' },
    { id: 'activity', label: 'Activity', count: activities.length },
    { id: 'comments', label: 'Comments' },
  ];

  const actorNames = new Map<string, string>();
  if (assignment.assigneeName) actorNames.set(assignment.assigneeId, assignment.assigneeName);
  if (assignment.assignerName) actorNames.set(assignment.assignerId, assignment.assignerName);
  if (user?.uid && user.displayName) actorNames.set(user.uid, user.displayName);

  return (
    <>
      <WorkspaceLayout contextRail={contextRailContent}>
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/assignments" className="text-sm text-text-400 hover:text-surface-50 inline-block">
              &larr; Back to assignments
            </Link>
            <EntityOverflowMenu items={overflowItems} aria-label="Assignment actions" />
          </div>

          <div className="mb-6">
            <h1 className="text-display-md font-semibold text-primary-400 tracking-tight mb-1">{assignment.title}</h1>
            <div className="flex items-center gap-3 text-sm text-text-500 mb-2">
              <Badge label={statusLabel} size="sm" color={sColors[assignment.status] ?? 'bg-surface-800 text-text-500'} />
              <Badge label={assignment.priority} size="sm" color={priorityColors[assignment.priority] ?? 'bg-surface-800 text-text-500'} />
              <span className="text-text-400">{assignment.role}</span>
              {watching ? (
                <Badge label="Watching" size="sm" color="bg-primary-500/10 text-primary-400" />
              ) : null}
            </div>
            {assignment.description ? (
              <p className="text-sm text-text-400">{assignment.description}</p>
            ) : null}
          </div>

          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'workspace' && (
            <div className="mt-6 space-y-6">
              <WorkspaceCard title="Actions">
                <div className="flex flex-wrap gap-2 mt-2">
                  {assignment.status === 'assigned' && isAssignee && (
                    <>
                      <Button size="sm" onClick={handleAccept} loading={actionLoading}>Accept</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowDeclineModal(true)} loading={actionLoading}>Decline</Button>
                    </>
                  )}
                  {assignment.status === 'accepted' && isAssignee && (
                    <Button size="sm" onClick={handleStart} loading={actionLoading}>Mark as Started</Button>
                  )}
                  {assignment.status === 'in_progress' && isAssignee && (
                    <Button size="sm" onClick={handleSubmitReview} loading={actionLoading}>Submit for Review</Button>
                  )}
                  {assignment.status === 'review' && isManager && (
                    <>
                      <Button size="sm" onClick={handleApprove} loading={actionLoading}>Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowChangesModal(true)} loading={actionLoading}>Request Changes</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowRejectModal(true)} loading={actionLoading}>Reject</Button>
                    </>
                  )}
                  {canBlock && (
                    <Button size="sm" variant="ghost" onClick={() => setShowBlockModal(true)} loading={actionLoading}>Mark Blocked</Button>
                  )}
                  {canUnblock && (
                    <Button size="sm" onClick={handleUnblock} loading={actionLoading}>Unblock</Button>
                  )}
                  {assignment.status === 'completed' && isManager && (
                    <Button size="sm" variant="ghost" onClick={handleReopen} loading={actionLoading}>Reopen</Button>
                  )}
                </div>
              </WorkspaceCard>

              <ReviewPanel
                assignment={{
                  ...assignment,
                  reviewerName: reviewNames.reviewer,
                  requesterName: reviewNames.requester,
                }}
              />

              <ReleaseContextCard context={releaseContext} />

              <DeliverableLinksSection
                links={deliverableLinks}
                onAdd={handleAddDeliverableLink}
                onRemove={handleRemoveDeliverableLink}
              />

              <WorkspaceCard title="Details">
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div>
                    <p className="text-text-400">Due Date</p>
                    <p className="text-surface-100">{assignment.dueDate ? fmtDate(assignment.dueDate) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-text-400">Entity</p>
                    <p className="text-surface-100 capitalize">{assignment.entityType}</p>
                  </div>
                  <div>
                    <p className="text-text-400">Assignee</p>
                    <p className="text-surface-100">{assignment.assigneeName ?? 'Unknown Person'}</p>
                  </div>
                  <div>
                    <p className="text-text-400">Assigner</p>
                    <p className="text-surface-100">{assignment.assignerName ?? 'Unknown Person'}</p>
                  </div>
                  <div>
                    <p className="text-text-400">Est. Hours</p>
                    <p className="text-surface-100">{assignment.estimatedHours ? `${assignment.estimatedHours}h` : '—'}</p>
                  </div>
                  {assignment.actualHours ? (
                    <div>
                      <p className="text-text-400">Actual Hours</p>
                      <p className="text-surface-100">{assignment.actualHours}h</p>
                    </div>
                  ) : null}
                  {assignment.completedAt ? (
                    <div>
                      <p className="text-text-400">Completed At</p>
                      <p className="text-surface-100">{fmtDate(assignment.completedAt)}</p>
                    </div>
                  ) : null}
                </div>
              </WorkspaceCard>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="mt-6">
              <ActivityTimeline activities={activities} actorNames={actorNames} />
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="mt-6">
              <AssignmentCommentsPanel
                assignmentId={id}
                onActivityChange={() => { void refresh(); }}
              />
            </div>
          )}
        </div>
      </WorkspaceLayout>

      <Modal open={showDeclineModal} onClose={() => setShowDeclineModal(false)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-100">Decline Assignment</h2>
          <p className="text-sm text-text-500">Provide a reason for declining this assignment.</p>
          <TextArea
            label="Reason"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Why are you declining?"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowDeclineModal(false)}>Cancel</Button>
            <Button onClick={handleDecline} loading={actionLoading} variant="danger">Decline</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showBlockModal} onClose={() => setShowBlockModal(false)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-100">Block Assignment</h2>
          <p className="text-sm text-text-500">Describe what is blocking progress on this assignment.</p>
          <TextArea
            label="Reason"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="e.g. Waiting for assets from designer"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowBlockModal(false)}>Cancel</Button>
            <Button onClick={handleBlock} loading={actionLoading} variant="danger">Block</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showChangesModal} onClose={() => setShowChangesModal(false)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-100">Request Changes</h2>
          <p className="text-sm text-text-500">Describe what needs to change. The assignment returns to In Progress.</p>
          <TextArea
            label="Notes"
            value={changesNotes}
            onChange={(e) => setChangesNotes(e.target.value)}
            placeholder="What should the collaborator update?"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowChangesModal(false)}>Cancel</Button>
            <Button onClick={handleRequestChanges} loading={actionLoading}>Request Changes</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-100">Reject Assignment</h2>
          <p className="text-sm text-text-500">Rejecting cancels this assignment. This action is recorded in activity.</p>
          <TextArea
            label="Notes"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Why is this being rejected?"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button onClick={handleReject} loading={actionLoading} variant="danger">Reject</Button>
          </div>
        </div>
      </Modal>

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
        onConfirm={() => act(() => archiveUserAssignment(id, user?.uid ?? ''))}
        title="Delete Assignment"
        message="This will archive the assignment."
        confirmLabel="Archive"
        loading={actionLoading}
      />
    </>
  );
}
