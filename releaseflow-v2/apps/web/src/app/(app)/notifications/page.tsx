'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import {
  fetchInbox,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  notificationHref,
  refreshNotificationPipeline,
  filterNotificationsByCategory,
  type UserNotificationRecord,
} from '@/lib/notification-engine-service';
import {
  getNotificationTypeDefinition,
  INBOX_FILTERS,
  type NotificationCategory,
} from '@/lib/notification-type-registry';
import {
  Button, EmptyState, LoadingState,
} from '@releaseflow/ui';
import { IdentityAvatar } from '@/components/identity-avatar';
import type { QueryDocumentSnapshot, DocumentData } from '@firebase/firestore';

function relativeTime(value: unknown): string {
  if (!value) return '';
  let date: Date | null = null;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    date = (value as { toDate: () => Date }).toDate();
  } else if (value instanceof Date) {
    date = value;
  }
  if (!date) return '';
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} minutes ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  if (sec < 172800) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function sectionFor(value: unknown): 'today' | 'yesterday' | 'earlier' {
  let date: Date | null = null;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    date = (value as { toDate: () => Date }).toDate();
  } else if (value instanceof Date) {
    date = value;
  }
  if (!date) return 'earlier';
  const today = startOfDay(new Date());
  const that = startOfDay(date);
  if (that === today) return 'today';
  if (that === today - 86400000) return 'yesterday';
  return 'earlier';
}

function TypeIcon({ type }: { type: string }) {
  const def = getNotificationTypeDefinition(type);
  const kind = def?.icon ?? 'system';
  const paths: Record<string, string> = {
    assignment: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    comment: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    mention: 'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207',
    review: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    watcher: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    due: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    invitation: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    release: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    system: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  const d = paths[kind] ?? paths.system;
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
    </svg>
  );
}

function NotificationCard({
  item,
  onOpen,
}: {
  item: UserNotificationRecord;
  onOpen: (item: UserNotificationRecord) => void;
}) {
  const unread = !item.isRead;
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={`
        w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3.5
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40
        ${unread
          ? 'border-primary-500/30 bg-primary-500/5'
          : 'border-surface-700/60 bg-layer-2 hover:border-surface-600'
        }
      `}
    >
      <div className={`mt-0.5 rounded-lg p-2 ${unread ? 'bg-primary-500/15 text-primary-400' : 'bg-surface-800 text-text-400'}`}>
        <TypeIcon type={item.type} />
      </div>
      <IdentityAvatar
        userId={item.actorId}
        fallbackName={item.actorName || 'User'}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${unread ? 'text-primary-300' : 'text-surface-100'}`}>
            {item.title}
          </p>
          {unread ? <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0" aria-label="Unread" /> : null}
        </div>
        <p className="text-xs text-text-400 mt-0.5 line-clamp-2">{item.message}</p>
        <p className="text-[11px] text-text-500 mt-1.5">{relativeTime(item.createdAt)}</p>
      </div>
      <span className="text-text-500 self-center shrink-0" aria-hidden>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </button>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const [items, setItems] = useState<UserNotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');
  const [pullY, setPullY] = useState(0);
  const touchStart = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (opts?: { append?: boolean; cursorDoc?: QueryDocumentSnapshot<DocumentData> | null }) => {
    if (!user?.uid) return;
    if (opts?.append) setLoadingMore(true);
    else setLoading(true);
    try {
      if (activeOrgId && !opts?.append) {
        await refreshNotificationPipeline(activeOrgId, user.uid);
      }
      const page = await fetchInbox(user.uid, {
        organizationId: activeOrgId ?? undefined,
        pageSize: 50,
        cursor: opts?.append ? opts.cursorDoc ?? undefined : undefined,
      });
      setItems((prev) => {
        const next = opts?.append ? [...prev, ...page.notifications] : page.notifications;
        setUnreadCount(next.filter((n) => !n.isRead).length);
        return next;
      });
      setHasMore(page.hasMore);
      setCursor(page.lastDoc);

      if (!opts?.append && user?.uid) {
        try {
          const { cacheNotifications } = await import('@/lib/pwa/offline-data-cache');
          await cacheNotifications(
            user.uid,
            activeOrgId ?? undefined,
            page.notifications as unknown as Record<string, unknown>[],
          );
        } catch { /* ignore */ }
      }
    } catch {
      // CE-008 offline notifications
      if (!opts?.append && user?.uid) {
        try {
          const { listCachedNotifications } = await import('@/lib/pwa/offline-data-cache');
          const cached = await listCachedNotifications(user.uid);
          const mapped = cached.map((c) => c.snapshot as unknown as UserNotificationRecord);
          setItems(mapped);
          setUnreadCount(mapped.filter((n) => !n.isRead).length);
          setHasMore(false);
        } catch {
          setItems([]);
        }
      } else if (!opts?.append) {
        setItems([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.uid, activeOrgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOpen = async (item: UserNotificationRecord) => {
    if (!user?.uid) return;
    try {
      if (!item.isRead) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          const { enqueueOfflineAction } = await import('@/lib/pwa/offline-queue');
          await enqueueOfflineAction('mark_read', {
            notificationId: item.id,
            userId: user.uid,
          }, { userId: user.uid });
        } else {
          await markNotificationAsRead(item.id, user.uid);
        }
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch { /* ignore */ }
    router.push(notificationHref(item));
  };

  const handleMarkAll = async () => {
    if (!user?.uid) return;
    try {
      await markAllNotificationsAsRead(user.uid, activeOrgId ?? undefined);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (listRef.current && listRef.current.scrollTop <= 0) {
      touchStart.current = e.touches[0]?.clientY ?? null;
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const y = e.touches[0]?.clientY ?? 0;
    const delta = y - touchStart.current;
    if (delta > 0) setPullY(Math.min(delta, 80));
  };
  const onTouchEnd = () => {
    if (pullY > 50) void load();
    touchStart.current = null;
    setPullY(0);
  };

  const visible = filterNotificationsByCategory(items, filter);

  const grouped = {
    today: visible.filter((n) => sectionFor(n.createdAt) === 'today'),
    yesterday: visible.filter((n) => sectionFor(n.createdAt) === 'yesterday'),
    earlier: visible.filter((n) => sectionFor(n.createdAt) === 'earlier'),
  };

  const titleCount = unreadCount > 0 ? ` (${unreadCount})` : '';

  return (
    <div
      className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-6 sm:py-8 page-transition min-h-[70vh]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-4 bg-layer-1/95 backdrop-blur border-b border-surface-700/40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">
              Inbox{titleCount}
            </h1>
            <p className="mt-0.5 text-sm text-text-400">
              {unreadCount > 0
                ? `${unreadCount} unread — operational updates that need attention`
                : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => void handleMarkAll()}>
              Mark all read
            </Button>
          ) : null}
        </div>

        {/* NOT-001 category filters */}
        <div
          className="flex gap-1.5 mt-3 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-none"
          role="tablist"
          aria-label="Filter notifications"
        >
          {INBOX_FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`
                  shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40
                  ${active
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                    : 'bg-surface-800/80 text-text-400 border border-transparent hover:text-surface-100'
                  }
                `}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {pullY > 0 ? (
          <p className="text-xs text-text-500 text-center mt-2">
            {pullY > 50 ? 'Release to refresh' : 'Pull to refresh'}
          </p>
        ) : null}
      </div>

      <div ref={listRef} className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-20"><LoadingState /></div>
        ) : visible.length === 0 ? (
          <EmptyState
            title={filter === 'all' ? "You're all caught up." : 'Nothing in this filter.'}
            description={
              filter === 'all'
                ? 'Assignment, release, and comment updates appear here.'
                : 'Try another filter or check back after new activity.'
            }
          />
        ) : (
          <>
            {(['today', 'yesterday', 'earlier'] as const).map((key) => {
              const list = grouped[key];
              if (list.length === 0) return null;
              const label = key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : 'Earlier';
              return (
                <section key={key}>
                  <p className="text-xs font-medium uppercase tracking-wider text-text-500 mb-2">{label}</p>
                  <div className="space-y-2">
                    {list.map((n) => (
                      <NotificationCard key={n.id} item={n} onOpen={(item) => void handleOpen(item)} />
                    ))}
                  </div>
                </section>
              );
            })}
            {hasMore && filter === 'all' ? (
              <div className="flex justify-center pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  loading={loadingMore}
                  onClick={() => void load({ append: true, cursorDoc: cursor })}
                >
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
