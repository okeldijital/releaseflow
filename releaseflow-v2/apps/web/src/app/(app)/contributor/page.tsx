'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getTasksByAssignee } from '@/lib/task-service';
import { getPendingRequestsByApprover, approveRequest, rejectRequest } from '@/lib/approval-service';
import { getDeliverablesByRelease } from '@/lib/deliverable-service';
import { getNotificationsByUser, markAsRead, archiveNotification } from '@/lib/notification-service';
import { fmtDate } from '@/lib/utils';
import { getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { Task, ApprovalRequest, Deliverable, Notification as Notif } from '../types';

const priorityStyles: Record<string, string> = {
  low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

function toDate(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === 'object' && ts !== null) {
    const obj = ts as Record<string, unknown>;
    if (typeof obj.toDate === 'function') return (obj as { toDate: () => Date }).toDate();
    if (typeof obj.seconds === 'number') return new Date((obj as { seconds: number }).seconds * 1000);
  }
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

export default function ContributorPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reviews, setReviews] = useState<ApprovalRequest[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    async function load() {
      const db = getDb();
      if (!db) { setLoading(false); return; }

      const [taskData, reviewData, notifData] = await Promise.all([
        getTasksByAssignee(uid),
        getPendingRequestsByApprover(uid),
        getNotificationsByUser(uid),
      ]);
      setTasks(taskData);
      setReviews(reviewData);
      setNotifications(notifData);
      setUnreadCount(notifData.filter((n) => !n.read).length);

      const releaseIds = [
        ...new Set([
          ...taskData.map((t) => t.releaseId),
          ...(await Promise.all(reviewData.map(async (r) => {
            const s = await getDoc(doc(db, 'deliverables', r.deliverableId));
            return s.data()?.releaseId;
          }))).filter(Boolean) as string[],
        ]),
      ];

      const delData: Deliverable[] = [];
      for (const rid of releaseIds) {
        const d = await getDeliverablesByRelease(rid);
        delData.push(...d);
      }
      const now = new Date();
      const overdue = delData.filter((d) => {
        if (d.status === 'approved' || d.status === 'archived') return false;
        const dd = toDate(d.createdAt as never);
        return dd && dd.getTime() < now.getTime();
      });
      setDeliverables(overdue);
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleApprove(requestId: string, _deliverableId: string) {
    await approveRequest(requestId, user?.uid ?? '', '');
    const updated = await getPendingRequestsByApprover(user?.uid ?? '');
    setReviews(updated);
  }

  async function handleReject(requestId: string, _deliverableId: string) {
    await rejectRequest(requestId, user?.uid ?? '', '');
    const updated = await getPendingRequestsByApprover(user?.uid ?? '');
    setReviews(updated);
  }

  async function handleMarkRead(notifId: string) {
    await markAsRead(notifId, user?.uid ?? '');
    const updated = await getNotificationsByUser(user?.uid ?? '');
    setNotifications(updated);
    setUnreadCount(updated.filter((n) => !n.read).length);
  }

  async function handleArchive(notifId: string) {
    await archiveNotification(notifId, user?.uid ?? '');
    const updated = await getNotificationsByUser(user?.uid ?? '');
    setNotifications(updated);
    setUnreadCount(updated.filter((n) => !n.read).length);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Contributor Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
        </div>
        {unreadCount > 0 ? (
          <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 text-xs font-medium">{unreadCount} unread</span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Assigned Tasks ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-zinc-400">No assigned tasks.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <Link key={t.id} href={`/releases/${t.releaseId}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2.5 hover:shadow-sm transition-shadow">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs capitalize rounded-full px-1.5 py-0.5 ${priorityStyles[t.priority] ?? ''}`}>{t.priority}</span>
                      <span className="text-xs text-zinc-400 capitalize">{t.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Pending Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-zinc-400">No pending reviews.</p>
          ) : (
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">Review Request</p>
                    <p className="text-xs text-zinc-400">Deliverable: {r.deliverableId}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleApprove(r.id, r.deliverableId)}
                      className="rounded px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">Approve</button>
                    <button onClick={() => handleReject(r.id, r.deliverableId)}
                      className="rounded px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Overdue Deliverables ({deliverables.length})</h2>
          {deliverables.length === 0 ? (
            <p className="text-sm text-zinc-400">No overdue deliverables.</p>
          ) : (
            <div className="space-y-2">
              {deliverables.map((d) => (
                <Link key={d.id} href={`/releases/${d.releaseId}`}
                  className="flex items-center justify-between rounded-lg border border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2.5 hover:shadow-sm transition-shadow">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300 truncate">{d.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-red-400 capitalize">{d.type}</span>
                      <span className="text-xs text-red-400">{d.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Notifications ({notifications.length})</h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-zinc-400">No notifications.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${n.read ? 'border-zinc-100 dark:border-zinc-800' : 'border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-950'}`}>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${n.read ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-50'}`}>{n.title}</p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-400 capitalize">{n.type.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-zinc-400">{fmtDate(n.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read ? (
                      <button onClick={() => handleMarkRead(n.id)} className="rounded px-1.5 py-0.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">Read</button>
                    ) : null}
                    <button onClick={() => handleArchive(n.id)} className="rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
