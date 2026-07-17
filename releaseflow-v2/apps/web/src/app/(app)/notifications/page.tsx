'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import {
  fetchUserNotifications,
  markAsRead,
  archiveUserNotification,
  fetchUnreadCount,
} from '@/lib/notification-service';
import type { NotificationRecord } from '@/lib/notification-repository';
import { EmptyState, LoadingState, SegmentedControl } from '@releaseflow/ui';

function fmtDate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'object' && 'toDate' in value) return (value as { toDate: () => Date }).toDate().toLocaleDateString();
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

function NotificationIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    mention: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
    approval: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    assignment: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    comment: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    invitation: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    review_request: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    release_reminder: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    system: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  const d = icons[type] || icons.system;
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
    </svg>
  );
}

function NotificationItem({ item, onMarkRead, onArchive }: {
  item: NotificationRecord;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const isUnread = item.status === 'unread';
  const entityLink = item.entityType && item.entityId
    ? `/${item.entityType === 'release' ? 'releases' : item.entityType}/${item.entityId}`
    : null;

  return (
    <div className={`flex items-start gap-4 rounded-xl border px-5 py-4 transition-all ${
      isUnread
        ? 'border-primary-500/30 bg-primary-500/5'
        : 'border-surface-700/60 bg-surface-900 hover:border-surface-600'
    }`}>
      <div className={`mt-0.5 rounded-lg p-2 ${
        isUnread ? 'bg-primary-500/15 text-primary-400' : 'bg-surface-800 text-text-400'
      }`}>
        <NotificationIcon type={item.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-medium truncate ${isUnread ? 'text-primary-300' : 'text-text-800'}`}>{item.title}</p>
          {isUnread && <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0" />}
        </div>
        <p className="text-xs text-text-400 mt-1 line-clamp-2">{item.message}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-text-500">{fmtDate(item.createdAt)}</span>
          {entityLink && (
            <Link href={entityLink} className="text-[10px] text-primary-500 hover:underline">
              View Details
            </Link>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isUnread && (
          <button onClick={() => onMarkRead(item.id)} className="rounded-lg px-3 py-1.5 text-[10px] font-medium bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors">
            Read
          </button>
        )}
        <button onClick={() => onArchive(item.id)} className="rounded-lg px-2 py-1.5 text-[10px] font-medium text-text-500 hover:text-text-300 hover:bg-surface-800 transition-colors" title="Archive">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

type FilterMode = 'all' | 'unread' | 'read';

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchUserNotifications(user.uid);
      setNotifications(data);
      const count = await fetchUnreadCount(user.uid);
      setUnreadCount(count);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter((n) => n.status === 'unread')
      : notifications.filter((n) => n.status === 'read');

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id, user!.uid);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, status: 'read' } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveUserNotification(id, user!.uid);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => Math.max(0, c - (notifications.find((n) => n.id === id)?.status === 'unread' ? 1 : 0)));
    } catch { /* ignore */ }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-7 py-8 page-transition">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Notifications</p>
          <p className="mt-1 text-sm text-text-400">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        <SegmentedControl options={filterOptions} value={filter} onChange={(v) => setFilter(v as FilterMode)} size="sm" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingState />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          description={filter === 'unread' ? 'You have no unread notifications.' : 'Notifications will appear here when you receive messages from your team.'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <NotificationItem key={n.id} item={n} onMarkRead={handleMarkRead} onArchive={handleArchive} />
          ))}
        </div>
      )}
    </div>
  );
}
