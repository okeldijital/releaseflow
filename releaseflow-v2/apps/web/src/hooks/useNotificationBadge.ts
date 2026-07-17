'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import {
  fetchUnreadBadgeCount,
  refreshNotificationPipeline,
} from '@/lib/notification-engine-service';

/**
 * Unread badge count for shell navigation.
 * Periodically refreshes pipeline (due reminders + event processing).
 */
export function useNotificationBadge(pollMs = 60_000) {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setCount(0);
      setLoading(false);
      return;
    }
    try {
      if (activeOrgId) {
        await refreshNotificationPipeline(activeOrgId, user.uid);
      }
      const n = await fetchUnreadBadgeCount(user.uid, activeOrgId ?? undefined);
      setCount(n);
    } catch {
      // keep previous count
    } finally {
      setLoading(false);
    }
  }, [user?.uid, activeOrgId]);

  useEffect(() => {
    void refresh();
    if (!user?.uid) return;
    const id = window.setInterval(() => { void refresh(); }, pollMs);
    return () => window.clearInterval(id);
  }, [refresh, user?.uid, pollMs]);

  return { count, loading, refresh };
}
