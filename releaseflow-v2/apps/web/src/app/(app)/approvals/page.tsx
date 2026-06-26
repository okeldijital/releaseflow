'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getPendingRequestsByApprover, approveRequest, rejectRequest } from '@/lib/approval-service';
import { Card, Badge, StatusBadge, Button, EmptyState, Skeleton } from '@releaseflow/ui';
import { fmtDate } from '@/lib/utils';
import { getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { ApprovalRequest, Deliverable } from '../types';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<(ApprovalRequest & { deliverable?: Deliverable })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    async function load() {
      const db = getDb();
      if (!db) { setLoading(false); return; }
      const pending = await getPendingRequestsByApprover(uid);

      const enriched = await Promise.all(
        pending.map(async (r) => {
          try {
            const snap = await getDoc(doc(db, 'deliverables', r.deliverableId));
            if (snap.exists()) return { ...r, deliverable: { id: snap.id, ...snap.data() } as Deliverable };
          } catch { /* ignore */ }
          return { ...r };
        }),
      );
      setRequests(enriched.sort((a, b) => {
        const ad = (a.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() ?? 0;
        const bd = (b.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() ?? 0;
        return bd - ad;
      }));
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleApprove(requestId: string) {
    await approveRequest(requestId, user?.uid ?? '', '');
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }

  async function handleReject(requestId: string) {
    await rejectRequest(requestId, user?.uid ?? '', '');
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }

  if (loading) return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 mb-6">
        <Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" />
      </div>
      <Skeleton variant="card" className="h-64" />
    </div>
  );

  const myRequests = requests.filter((r) => r.requesterId === user?.uid);
  const pendingCount = requests.length;
  const myPending = myRequests.length;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-900">Approval Queue</h1>
          <p className="text-sm text-text-500 mt-1">{pendingCount} pending review{pendingCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 mb-6">
        <Card padding="sm">
          <p className="text-xs text-text-500">Pending for Me</p>
          <p className="text-2xl font-bold text-warning-500 mt-0.5">{pendingCount}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-text-500">My Requests</p>
          <p className="text-2xl font-bold text-info-500 mt-0.5">{myPending}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-text-500">Avg. Wait</p>
          <p className="text-2xl font-bold text-text-900 mt-0.5">—</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-900">Pending ({requests.length})</h2>
        </div>

        {requests.length === 0 ? (
          <EmptyState title="Queue empty" description="No pending approvals. Great work!" />
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-lg border border-surface-200 bg-white dark:bg-surface-900 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-900">{r.deliverable?.title ?? `Deliverable ${r.deliverableId.slice(0, 8)}`}</h3>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-text-500">
                      {r.deliverable ? (
                        <>
                          <Badge label={r.deliverable.type} color="bg-surface-100 text-text-500" size="sm" />
                          {r.deliverable.version ? <span>v{r.deliverable.version}</span> : null}
                          <span>{r.deliverable.status.replace(/_/g, ' ')}</span>
                        </>
                      ) : null}
                      <span>Created {fmtDate(r.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button size="sm" variant="primary" onClick={() => handleApprove(r.id)}>Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => handleReject(r.id)}>Reject</Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs border-t border-surface-100 pt-3">
                  <div className="flex items-center gap-1">
                    <span className="text-text-400">Requester:</span>
                    <span className="text-text-700">{r.requesterId.slice(0, 12)}...</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-text-400">Approver:</span>
                    <span className="text-text-700">{r.approverId.slice(0, 12)}...</span>
                  </div>
                  {r.respondedAt ? (
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-text-400">Responded:</span>
                      <span className="text-text-700">{fmtDate(r.respondedAt)}</span>
                    </div>
                  ) : (
                    <span className="ml-auto text-xs text-warning-500">Awaiting response</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
