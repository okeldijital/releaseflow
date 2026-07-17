'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import {
  fetchUnreadBadgeCount,
  refreshNotificationPipeline,
  subscribeInboxUnread,
} from '@/lib/notification-engine-service';

/**
 * NOT-001 — Unread badge for shell navigation.
 * Live subscription + periodic pipeline refresh (due reminders + event processing).
 */
export function useNotificationBadge(pollMs = 60_000) {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshPipeline = useCallback(async () => {
    if (!user?.uid) return;
    try {
      if (activeOrgId) {
        await refreshNotificationPipeline(activeOrgId, user.uid);
      }
    } catch {
      // best-effort
    }
  }, [user?.uid, activeOrgId]);

  const refreshCount = useCallback(async () => {
    if (!user?.uid) {
      setCount(0);
      setLoading(false);
      return;
    }
    try {
      const n = await fetchUnreadBadgeCount(user.uid, activeOrgId ?? undefined);
      setCount(n);
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  }, [user?.uid, activeOrgId]);

  // Live unread subscription
  useEffect(() => {
    if (!user?.uid) {
      setCount(0);
      setLoading(false);
      return;
    }
    const unsub = subscribeInboxUnread(
      user.uid,
      (n) => {
        setCount(n);
        setLoading(false);
      },
      activeOrgId ?? undefined,
    );
    return () => unsub();
  }, [user?.uid, activeOrgId]);

  // Pipeline + fallback poll
  useEffect(() => {
    void refreshPipeline().then(() => refreshCount());
    if (!user?.uid) return;
    const id = window.setInterval(() => {
      void refreshPipeline().then(() => refreshCount());
    }, pollMs);
    return () => window.clearInterval(id);
  }, [refreshPipeline, refreshCount, user?.uid, pollMs]);

  const refresh = useCallback(async () => {
    await refreshPipeline();
    await refreshCount();
  }, [refreshPipeline, refreshCount]);

  return { count, loading, refresh };
}
