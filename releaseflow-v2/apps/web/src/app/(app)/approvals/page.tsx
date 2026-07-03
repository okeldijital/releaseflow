'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  getPendingRequestsByApprover,
  approveRequest,
  rejectRequest,
  approveWithNote,
  requestChanges,
} from '@/lib/approval-service';
import { getUserInbox } from '@/lib/notification-center-service';
import { Card, Badge, StatusBadge, Button, EmptyState, Skeleton, Modal } from '@releaseflow/ui';
import { fmtDate } from '@/lib/utils';
import { getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { ApprovalRequest, Deliverable, LifecycleState } from '../types';

interface EnrichedRequest extends ApprovalRequest {
  deliverable?: Deliverable;
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<EnrichedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ requestId: string; action: 'changes' | 'approve_note' } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [inboxCounts, setInboxCounts] = useState({ pendingApprovals: 0 });

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    async function load() {
      const db = getDb();
      if (!db) { setLoading(false); return; }

      const [pending, inbox] = await Promise.all([
        getPendingRequestsByApprover(uid),
        getUserInbox(uid).catch(() => null),
      ]);

      const enriched = await Promise.all(
        pending.map(async (r) => {
          try {
            if (r.deliverableId) {
              const snap = await getDoc(doc(db, 'deliverables', r.deliverableId));
              if (snap.exists()) return { ...r, deliverable: { id: snap.id, ...snap.data() } as Deliverable };
            }
          } catch { /* ignore */ }
          return { ...r };
        }),
      );

      setRequests(
        enriched.sort((a, b) => {
          const ad = (a.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() ?? 0;
          const bd = (b.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() ?? 0;
          return bd - ad;
        }),
      );
      setInboxCounts({ pendingApprovals: inbox?.pendingApprovals ?? enriched.length });
      setLoading(false);
    }
    load();
  }, [user]);

  const pendingMyReview = requests.filter((r) => r.status === 'pending');
  const awaitingResponse = requests.filter((r) => r.requesterId === user?.uid && r.status === 'pending');
  const completed = requests.filter((r) => r.status === 'approved' || r.status === 'rejected');

  async function handleApprove(requestId: string) {
    await approveRequest(requestId, user?.uid ?? '', '');
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }

  async function handleReject(requestId: string) {
    await rejectRequest(requestId, user?.uid ?? '', '');
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }

  async function handleApproveWithNote() {
    if (!actionModal || actionModal.action !== 'approve_note') return;
    await approveWithNote(actionModal.requestId, user?.uid ?? '', noteText || undefined);
    setRequests((prev) => prev.filter((r) => r.id !== actionModal.requestId));
    setActionModal(null);
    setNoteText('');
  }

  async function handleRequestChanges() {
    if (!actionModal || actionModal.action !== 'changes') return;
    await requestChanges(actionModal.requestId, user?.uid ?? '', noteText || undefined);
    setRequests((prev) => prev.filter((r) => r.id !== actionModal.requestId));
    setActionModal(null);
    setNoteText('');
  }

  function lifecycleBadge(lifecycleState?: LifecycleState) {
    if (!lifecycleState) return <StatusBadge status="pending" />;
    return <StatusBadge status={lifecycleState} />;
  }

  if (loading) return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="grid gap-4 grid-cols-3 mb-6">
        <Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" />
      </div>
      <Skeleton variant="card" className="h-64" />
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-2xl font-bold text-text-900">Approvals</p>
          <p className="text-sm text-text-500 mt-1">{inboxCounts.pendingApprovals} pending review{pendingMyReview.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-3 mb-6">
        <MetricSummaryCard label="Pending My Review" count={pendingMyReview.length} color="bg-warning-50 text-warning-600" darkColor="dark:bg-warning-500/15 dark:text-warning-400" />
        <MetricSummaryCard label="Awaiting Response" count={awaitingResponse.length} color="bg-info-50 text-info-600" darkColor="dark:bg-info-500/15 dark:text-info-400" />
        <MetricSummaryCard label="Completed" count={completed.length} color="bg-success-50 text-success-600" darkColor="dark:bg-success-500/15 dark:text-success-400" />
      </div>

      <div className="space-y-8">
        <ApprovalSection
          title="Pending My Review"
          requests={pendingMyReview}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestChanges={(id) => { setActionModal({ requestId: id, action: 'changes' }); setNoteText(''); }}
          onApproveWithNote={(id) => { setActionModal({ requestId: id, action: 'approve_note' }); setNoteText(''); }}
          lifecycleBadge={lifecycleBadge}
          emptyTitle="No pending approvals"
          emptyDescription="Approvals will appear when someone requests your review."
        />

        <ApprovalSection
          title="Awaiting Response"
          requests={awaitingResponse}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestChanges={(id) => { setActionModal({ requestId: id, action: 'changes' }); setNoteText(''); }}
          onApproveWithNote={(id) => { setActionModal({ requestId: id, action: 'approve_note' }); setNoteText(''); }}
          lifecycleBadge={lifecycleBadge}
          emptyTitle="No requests awaiting response"
          emptyDescription="Your approval requests are still pending review."
        />

        <ApprovalSection
          title="Completed"
          requests={completed}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestChanges={() => {}}
          onApproveWithNote={() => {}}
          lifecycleBadge={lifecycleBadge}
          emptyTitle="No completed approvals"
          emptyDescription="Completed approvals will appear here."
          hideActions
        />
      </div>

      {actionModal ? (
        <Modal open onClose={() => setActionModal(null)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-text-900 mb-2">
              {actionModal.action === 'changes' ? 'Request Changes' : 'Approve with Note'}
            </h3>
            <p className="text-sm text-text-500 mb-4">
              {actionModal.action === 'changes'
                ? 'Describe what changes are needed.'
                : 'Add an optional note with your approval.'}
            </p>
            <textarea
              className="w-full rounded-lg border border-surface-200 bg-white dark:bg-surface-900 px-3 py-2 text-sm text-text-900 placeholder:text-text-400 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
              placeholder="Add a note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="tertiary" size="sm" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button
                variant={actionModal.action === 'changes' ? 'danger' : 'primary'}
                size="sm"
                onClick={actionModal.action === 'changes' ? handleRequestChanges : handleApproveWithNote}
              >
                {actionModal.action === 'changes' ? 'Request Changes' : 'Approve'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function MetricSummaryCard({
  label,
  count,
  color,
  darkColor,
}: {
  label: string;
  count: number;
  color: string;
  darkColor: string;
}) {
  return (
    <Card padding="sm">
      <p className="text-xs text-text-500">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${color} ${darkColor}`}>{count}</p>
    </Card>
  );
}

function ApprovalSection({
  title,
  requests,
  expandedId,
  onToggle,
  onApprove,
  onReject,
  onRequestChanges,
  onApproveWithNote,
  lifecycleBadge,
  emptyTitle,
  emptyDescription,
  hideActions,
}: {
  title: string;
  requests: EnrichedRequest[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRequestChanges: (id: string) => void;
  onApproveWithNote: (id: string) => void;
  lifecycleBadge: (state?: LifecycleState) => React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  hideActions?: boolean;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-text-900">{title}</h2>
        <span className="text-xs text-text-400">({requests.length})</span>
      </div>

      {requests.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const isExpanded = expandedId === r.id;
            const entityLabel = r.entityType ?? 'deliverable';

            return (
              <div key={r.id} className="rounded-lg border border-surface-200 bg-white dark:bg-surface-900 p-4">
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => onToggle(r.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge label={entityLabel} color="bg-surface-100 text-text-500" size="sm" />
                      <h3 className="text-sm font-semibold text-text-900">
                        {r.deliverable?.title ?? r.entityId?.slice(0, 8) ?? r.deliverableId?.slice(0, 8) ?? '—'}
                      </h3>
                      {lifecycleBadge(r.lifecycleState)}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-text-500">
                      {r.deliverable ? (
                        <>
                          <span>{r.deliverable.type}</span>
                          {r.deliverable.version ? <span>v{r.deliverable.version}</span> : null}
                        </>
                      ) : null}
                      {r.dueDate ? (
                        <span className="text-warning-500 font-medium">Due {fmtDate(r.dueDate)}</span>
                      ) : null}
                      <span>Created {fmtDate(r.createdAt)}</span>
                    </div>
                  </div>

                  {!hideActions ? (
                    <div className="flex items-center gap-2 shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="primary" onClick={() => onApprove(r.id)}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => onReject(r.id)}>Reject</Button>
                    </div>
                  ) : null}

                  <span className="text-xs text-text-300 ml-3 mt-0.5 shrink-0">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {isExpanded ? (
                  <div className="mt-3 pt-3 border-t border-surface-100 space-y-2">
                    {r.notes ? (
                      <div>
                        <p className="text-xs font-medium text-text-500 mb-1">Notes</p>
                        <p className="text-sm text-text-800">{r.notes}</p>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-text-400">Requester:</span>
                      <span className="text-text-700">{r.requesterId.slice(0, 12)}...</span>
                      <span className="text-text-400 ml-3">Approver:</span>
                      <span className="text-text-700">{r.approverId.slice(0, 12)}...</span>
                      {r.respondedAt ? (
                        <>
                          <span className="text-text-400 ml-3">Responded:</span>
                          <span className="text-text-700">{fmtDate(r.respondedAt)}</span>
                        </>
                      ) : null}
                    </div>

                    {!hideActions ? (
                      <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" variant="tertiary" onClick={() => onRequestChanges(r.id)}>
                          Request Changes
                        </Button>
                        <Button size="sm" variant="tertiary" onClick={() => onApproveWithNote(r.id)}>
                          Approve with Note
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
