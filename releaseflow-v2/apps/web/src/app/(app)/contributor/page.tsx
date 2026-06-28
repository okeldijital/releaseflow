'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getTasksByAssignee, completeTask } from '@/lib/task-service';
import { getPendingRequestsByApprover, approveRequest, rejectRequest } from '@/lib/approval-service';
import { getNotificationsByUser, markAsRead, archiveNotification } from '@/lib/notification-service';
import { fmtDate } from '@/lib/utils';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Card, Badge, StatusBadge, Button, EmptyState, Skeleton } from '@releaseflow/ui';
import type { Task, ApprovalRequest, Notification as Notif } from '../types';

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
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [deadlines, setDeadlines] = useState<Task[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    async function load() {
      const db = getDb();
      if (!db) { setLoading(false); return; }

      const [taskData, reviewData, notifData, taskSnap] = await Promise.all([
        getTasksByAssignee(uid),
        getPendingRequestsByApprover(uid),
        getNotificationsByUser(uid),
        getDocs(query(
          collection(db, 'tasks'),
          where('assigneeId', '==', uid),
          where('status', '!=', 'done'),
          orderBy('dueDate', 'asc'),
        )),
      ]);

      setTasks(taskData);
      setReviews(reviewData);
      setNotifications(notifData);
      setUnreadCount(notifData.filter((n) => !n.read).length);

      const now = new Date();
      const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = taskSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Task)
        .filter((t) => {
          const due = toDate(t.dueDate);
          return due && due > now && due < week;
        })
        .sort((a, b) => {
          const ad = toDate(a.dueDate)?.getTime() ?? 0;
          const bd = toDate(b.dueDate)?.getTime() ?? 0;
          return ad - bd;
        });
      setDeadlines(upcoming);
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleComplete(taskId: string) {
    await completeTask(taskId, '', '', user?.uid ?? '');
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function handleApprove(requestId: string, _deliverableId: string) {
    await approveRequest(requestId, user?.uid ?? '', '');
    setReviews(await getPendingRequestsByApprover(user?.uid ?? ''));
  }

  async function handleReject(requestId: string, _deliverableId: string) {
    await rejectRequest(requestId, user?.uid ?? '', '');
    setReviews(await getPendingRequestsByApprover(user?.uid ?? ''));
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

  if (loading) return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <Skeleton className="h-8 w-56 mb-8" />
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
        <Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton variant="card" className="h-48" />
          <Skeleton variant="card" className="h-32" />
          <Skeleton variant="card" className="h-40" />
        </div>
        <div className="space-y-6">
          <Skeleton variant="card" className="h-56" />
          <Skeleton variant="card" className="h-24" />
        </div>
      </div>
    </div>
  );

  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const upcomingDeadlines = deadlines.filter((t) => {
    const d = toDate(t.dueDate);
    return d && d.getTime() < Date.now() + 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-900">Contributor Dashboard</h1>
          <p className="text-sm text-text-500 mt-1">{user?.email}</p>
        </div>
        {unreadCount > 0 ? (
          <span className="rounded-full bg-primary-50 text-primary-500 px-3 py-1 text-xs font-medium">{unreadCount} unread</span>
        ) : null}
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
        <Card padding="sm">
          <p className="text-xs text-text-500">Assigned</p>
          <p className="text-2xl font-bold text-text-900 mt-0.5">{tasks.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-text-500">Done</p>
          <p className="text-2xl font-bold text-success-500 mt-0.5">{doneTasks}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-text-500">Reviews</p>
          <p className="text-2xl font-bold text-warning-500 mt-0.5">{reviews.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-text-500">Due Today</p>
          <p className="text-2xl font-bold text-danger-500 mt-0.5">{upcomingDeadlines}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="sm">
            <h2 className="text-sm font-semibold text-text-900 mb-3">Assigned Tasks ({tasks.length})</h2>
            {tasks.length === 0 ? (
              <EmptyState title="No assigned tasks" description="Tasks assigned to you will appear here." />
            ) : (
              <div className="space-y-1.5">
                {tasks.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded border border-surface-100 px-3 py-2.5 hover:border-surface-200 transition-colors">
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <button onClick={() => handleComplete(t.id)}
                        className={`shrink-0 w-4 h-4 rounded border ${t.status === 'done' ? 'bg-success-500 border-success-500' : 'border-surface-300 hover:border-primary-500'} flex items-center justify-center`}>
                        {t.status === 'done' ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : null}
                      </button>
                      <Link href={`/releases/${t.releaseId}`} className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${t.status === 'done' ? 'line-through text-text-400' : 'text-text-700'}`}>{t.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge label={t.priority} color={t.priority === 'critical' || t.priority === 'high' ? 'bg-danger-50 text-danger-500' : t.priority === 'medium' ? 'bg-warning-50 text-warning-500' : 'bg-surface-100 text-text-500'} size="sm" />
                          <StatusBadge status={t.status} />
                        </div>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card padding="sm">
            <h2 className="text-sm font-semibold text-text-900 mb-3">Pending Approvals ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <EmptyState title="No pending approvals" description="Nothing needs your review right now." />
            ) : (
              <div className="space-y-1.5">
                {reviews.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded border border-warning-100 bg-warning-50 dark:border-warning-800 dark:bg-warning-950 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-900 truncate">Review Request</p>
                      <p className="text-xs text-text-400">Deliverable: {r.deliverableId.slice(0, 8)}...</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <Button size="sm" variant="primary" onClick={() => handleApprove(r.id, r.deliverableId)}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => handleReject(r.id, r.deliverableId)}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card padding="sm">
            <h2 className="text-sm font-semibold text-text-900 mb-3">Upcoming Deadlines ({deadlines.length})</h2>
            {deadlines.length === 0 ? (
              <EmptyState title="No deadlines this week" description="Nothing due in the next 7 days." />
            ) : (
              <div className="space-y-1.5">
                {deadlines.slice(0, 8).map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded border border-surface-100 px-3 py-2.5">
                    <Link href={`/releases/${d.releaseId}`} className="min-w-0 flex-1">
                      <p className="text-sm text-text-700 truncate">{d.title}</p>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge label={d.priority} color={d.priority === 'critical' || d.priority === 'high' ? 'bg-danger-50 text-danger-500' : 'bg-surface-100 text-text-500'} size="sm" />
                      <span className="text-xs text-text-400">{fmtDate(d.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="sm">
            <h2 className="text-sm font-semibold text-text-900 mb-3">Notifications ({notifications.length})</h2>
            {notifications.length === 0 ? (
              <EmptyState title="No notifications" description="You're all caught up." />
            ) : (
              <div className="space-y-1.5">
                {notifications.slice(0, 8).map((n) => (
                  <div key={n.id} className={`rounded border px-3 py-2.5 ${n.read ? 'border-surface-100' : 'border-info-100 bg-info-50 dark:border-info-800 dark:bg-info-950'}`}>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${n.read ? 'text-text-500' : 'text-text-900'}`}>{n.title}</p>
                        <p className="text-xs text-text-400 truncate mt-0.5">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge label={n.type.replace(/_/g, ' ')} color="bg-surface-100 text-text-500" size="sm" />
                          <span className="text-xs text-text-400">{fmtDate(n.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {!n.read ? (
                          <button onClick={() => handleMarkRead(n.id)} className="text-xs text-primary-500 hover:underline">Read</button>
                        ) : null}
                        <button onClick={() => handleArchive(n.id)} className="text-xs text-text-400 hover:text-text-700">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card padding="sm">
            <h2 className="text-sm font-semibold text-text-900 mb-3">Quick Links</h2>
            <div className="space-y-1 text-sm">
              <Link href="/releases" className="block text-text-500 hover:text-text-900 py-1">View Releases</Link>
              <Link href="/dashboard" className="block text-text-500 hover:text-text-900 py-1">Operations Center</Link>
              <Link href="/brief" className="block text-text-500 hover:text-text-900 py-1">Daily Brief</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
