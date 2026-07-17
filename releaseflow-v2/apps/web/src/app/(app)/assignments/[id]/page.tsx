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
import {
  resolveActorIdentityKeys,
  assignmentMatchesIdentity,
} from '@/lib/assignment-identity';
import { AuthorizationService } from '@/lib/auth/authorization-service';

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
  // BUG-002 — route param is the Firestore assignment document id only
  const rawId = params.id;
  const id = Array.isArray(rawId) ? (rawId[0] ?? '') : String(rawId ?? '');
  const {
    assignment,
    activities,
    activityActorNames,
    deliverableLinks,
    releaseContext,
    loading,
    error: loadError,
    refresh,
  } = useAssignment(id);
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
  const [identityKeys, setIdentityKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.uid || !activeOrgId) {
      setIdentityKeys(new Set());
      return;
    }
    void resolveActorIdentityKeys(activeOrgId, user.uid).then(setIdentityKeys);
  }, [user?.uid, activeOrgId]);

  const isAssignee = Boolean(
    assignment && user && assignmentMatchesIdentity(assignment, identityKeys),
  );
  const isManager = canManageReview(role) || AuthorizationService.canManageAssignments();

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
        <div className="px-6 py-6">
          <p className="text-sm text-text-500 mb-4">Loading assignment…</p>
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </WorkspaceLayout>
    );
  }

  // BUG-002 — distinguishable error states (never mask auth/org as "not found")
  if (!assignment || loadError) {
    const code = loadError?.code ?? 'not_found';
    const title =
      code === 'not_found' ? 'Assignment not found'
        : code === 'org_mismatch' ? 'Wrong organization'
          : code === 'permission_denied' ? 'Permission denied'
            : code === 'invalid_id' ? 'Invalid assignment'
              : 'Unable to load assignment';
    const description =
      loadError?.message
      ?? (code === 'not_found'
        ? 'This assignment does not exist or has been removed.'
        : 'Something went wrong while loading this assignment.');

    return (
      <WorkspaceLayout>
        <div className="px-6 py-6 max-w-lg">
          <p className="text-display-md font-semibold text-primary-400 mb-2">{title}</p>
          <p className="text-sm text-text-500 mb-4">{description}</p>

          <div className="flex flex-wrap gap-2">
            {(code === 'network' || code === 'unavailable') ? (
              <Button size="sm" variant="primary" onClick={() => void refresh()}>
                Retry
              </Button>
            ) : null}
            <Link
              href="/assignments"
              className="inline-flex items-center h-9 px-3 rounded-lg text-sm font-medium text-primary-400 hover:text-primary-300"
            >
              ← Back to Assignments
            </Link>
          </div>
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

  // UX-001 — theme-token sidebar (no hard-coded light surfaces)
  const contextRailContent = (
    <div className="p-4 space-y-5 bg-layer-2 border-l border-surface-700/50 min-h-full">
      {releaseContext ? (
        <div>
          <p className="text-xs font-medium text-content-label uppercase tracking-wider mb-2">Release</p>
          <Link href={`/releases/${releaseContext.releaseId}`} className="block rounded-xl overflow-hidden focus-visible:ring-2 focus-visible:ring-primary-500/40">
            {releaseContext.artwork?.secureUrl ? (
              <img
                src={releaseContext.artwork.secureUrl}
                alt=""
                className="w-full aspect-square rounded-xl object-cover mb-2 bg-surface-800"
              />
            ) : (
              <ArtworkPlaceholder title={releaseContext.releaseTitle} size="lg" />
            )}
          </Link>
          <Link
            href={`/releases/${releaseContext.releaseId}`}
            className="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors block truncate"
          >
            {releaseContext.releaseTitle}
          </Link>
          {releaseContext.artistName ? (
            <p className="text-xs text-content-secondary mt-0.5">{releaseContext.artistName}</p>
          ) : null}
        </div>
      ) : null}

      <dl className="space-y-3 border-t border-surface-700/40 pt-4">
        <div>
          <dt className="text-xs font-medium text-content-label uppercase tracking-wider mb-1">Status</dt>
          <dd>
            <Badge label={statusLabel} size="md" color={sColors[assignment.status] ?? 'bg-surface-800 text-content-secondary'} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-content-label uppercase tracking-wider mb-1">Priority</dt>
          <dd>
            <Badge
              label={assignment.priority}
              color={priorityColors[assignment.priority] ?? 'bg-surface-800 text-content-secondary'}
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-content-label uppercase tracking-wider mb-1">Assignee</dt>
          <dd className="text-sm text-content-primary">{assignment.assigneeName ?? 'Unknown'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-content-label uppercase tracking-wider mb-1">Assigned by</dt>
          <dd className="text-sm text-content-primary">{assignment.assignerName ?? 'Unknown'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-content-label uppercase tracking-wider mb-1">Contribution role</dt>
          <dd className="text-sm text-content-primary">{assignment.role || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-content-label uppercase tracking-wider mb-1">Due date</dt>
          <dd className="text-sm text-content-primary">{assignment.dueDate ? fmtDate(assignment.dueDate) : '—'}</dd>
        </div>
      </dl>

      <div className="border-t border-surface-700/40 pt-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void handleToggleWatch()}
          loading={watchLoading}
          className="w-full min-h-[44px]"
          aria-pressed={watching}
        >
          {watching ? 'Watching' : 'Watch'}
        </Button>
      </div>
    </div>
  );

  // UX-001 — merge resolved activity names; never fall back to raw ids in UI
  const actorNames = new Map<string, string>(activityActorNames);
  if (assignment.assigneeName) {
    actorNames.set(assignment.assigneeId, assignment.assigneeName);
    if (assignment.assigneeUserId) actorNames.set(assignment.assigneeUserId, assignment.assigneeName);
  }
  if (assignment.assignerName) {
    actorNames.set(assignment.assignerId, assignment.assignerName);
    if (assignment.assignerUserId) actorNames.set(assignment.assignerUserId, assignment.assignerName);
  }
  if (user?.uid && (user.displayName || user.email)) {
    actorNames.set(user.uid, user.displayName || user.email || 'You');
  }

  // MUX-001 sticky mobile action bar primary CTA
  const mobilePrimary = (() => {
    if (!isAssignee && !isManager) return null;
    if (assignment.status === 'assigned' && isAssignee) {
      return { label: 'Accept Assignment', onClick: handleAccept };
    }
    if (assignment.status === 'accepted' && isAssignee) {
      return { label: 'Mark as Started', onClick: handleStart };
    }
    if (assignment.status === 'in_progress' && isAssignee) {
      return { label: 'Request Review', onClick: handleSubmitReview };
    }
    if (assignment.status === 'review' && isManager) {
      return { label: 'Approve', onClick: handleApprove };
    }
    return null;
  })();

  return (
    <>
      <WorkspaceLayout contextRail={contextRailContent}>
        <div className="px-4 sm:px-6 py-5 sm:py-6 pb-28 md:pb-6">
          <div className="flex items-center justify-between mb-4 min-h-[44px]">
            <Link href="/assignments" className="text-sm text-text-400 hover:text-surface-50 inline-flex items-center min-h-[44px]">
              &larr; Back
            </Link>
            <EntityOverflowMenu items={overflowItems} aria-label="Assignment actions" />
          </div>

          {/* UX-001.2 — clear hierarchy: title → release → people → state */}
          <header className="mb-6 space-y-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-content-primary tracking-tight leading-snug">
              {assignment.title}
            </h1>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex gap-2 min-w-0">
                <dt className="text-content-label shrink-0 w-28">Release</dt>
                <dd className="text-content-primary truncate">
                  {releaseContext ? (
                    <Link
                      href={`/releases/${releaseContext.releaseId}`}
                      className="text-primary-400 hover:text-primary-300 font-medium"
                    >
                      {releaseContext.releaseTitle}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div className="flex gap-2 min-w-0">
                <dt className="text-content-label shrink-0 w-28">Assigned to</dt>
                <dd className="text-content-primary truncate">{assignment.assigneeName ?? 'Unknown'}</dd>
              </div>
              <div className="flex gap-2 min-w-0">
                <dt className="text-content-label shrink-0 w-28">Role</dt>
                <dd className="text-content-primary truncate">{assignment.role || '—'}</dd>
              </div>
              <div className="flex gap-2 min-w-0 items-center">
                <dt className="text-content-label shrink-0 w-28">Status</dt>
                <dd>
                  <Badge label={statusLabel} size="sm" color={sColors[assignment.status] ?? 'bg-surface-800 text-content-secondary'} />
                </dd>
              </div>
              <div className="flex gap-2 min-w-0 items-center">
                <dt className="text-content-label shrink-0 w-28">Priority</dt>
                <dd>
                  <Badge
                    label={assignment.priority}
                    size="sm"
                    color={priorityColors[assignment.priority] ?? 'bg-surface-800 text-content-secondary'}
                  />
                </dd>
              </div>
              <div className="flex gap-2 min-w-0">
                <dt className="text-content-label shrink-0 w-28">Due date</dt>
                <dd className="text-content-primary">{assignment.dueDate ? fmtDate(assignment.dueDate) : '—'}</dd>
              </div>
            </dl>
          </header>

          <Tabs
            tabs={[
              { id: 'workspace', label: 'Overview' },
              { id: 'comments', label: 'Comments' },
              { id: 'activity', label: 'History', count: activities.length },
            ]}
            activeTab={activeTab === 'activity' ? 'activity' : activeTab === 'comments' ? 'comments' : 'workspace'}
            onChange={setActiveTab}
          />

          {activeTab === 'workspace' && (
            <div className="mt-6 space-y-6">
              {/* Desktop / tablet actions (hidden on small phones — sticky bar handles them) */}
              <div className="hidden md:block">
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
              </div>

              {/* Mobile overview actions secondary */}
              <div className="md:hidden flex flex-col gap-2">
                {assignment.status === 'assigned' && isAssignee ? (
                  <Button
                    className="min-h-[48px] w-full"
                    variant="ghost"
                    onClick={() => setShowDeclineModal(true)}
                    loading={actionLoading}
                  >
                    Decline
                  </Button>
                ) : null}
                {assignment.status === 'in_progress' && isAssignee ? (
                  <Button
                    className="min-h-[48px] w-full"
                    variant="ghost"
                    onClick={() => setActiveTab('comments')}
                  >
                    Comment
                  </Button>
                ) : null}
              </div>

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

              <WorkspaceCard title="Description">
                {assignment.description ? (
                  <p className="text-sm text-content-secondary leading-relaxed mt-2 whitespace-pre-wrap">
                    {assignment.description}
                  </p>
                ) : (
                  <p className="text-sm text-content-label mt-2">No description has been added.</p>
                )}
              </WorkspaceCard>

              <WorkspaceCard title="Details">
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div>
                    <p className="text-content-label">Due date</p>
                    <p className="text-content-primary">{assignment.dueDate ? fmtDate(assignment.dueDate) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-content-label">Assignee</p>
                    <p className="text-content-primary">{assignment.assigneeName ?? 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-content-label">Assigned by</p>
                    <p className="text-content-primary">{assignment.assignerName ?? 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-content-label">Contribution role</p>
                    <p className="text-content-primary">{assignment.role || '—'}</p>
                  </div>
                  {assignment.completedAt ? (
                    <div>
                      <p className="text-content-label">Completed</p>
                      <p className="text-content-primary">{fmtDate(assignment.completedAt)}</p>
                    </div>
                  ) : null}
                </div>
              </WorkspaceCard>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="mt-6">
              <ActivityTimeline
                activities={activities}
                actorNames={actorNames}
                subjectNames={actorNames}
              />
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

      {/* MUX-001 — sticky mobile action bar (above bottom nav) */}
      {mobilePrimary ? (
        <div
          className="
            md:hidden fixed inset-x-0 z-40
            bottom-[calc(56px+env(safe-area-inset-bottom))]
            border-t border-surface-700/60 bg-surface-950/95 backdrop-blur-md
            px-4 py-3
          "
        >
          <Button
            className="w-full min-h-[48px] text-base font-semibold"
            onClick={mobilePrimary.onClick}
            loading={actionLoading}
          >
            {mobilePrimary.label}
          </Button>
        </div>
      ) : null}

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
