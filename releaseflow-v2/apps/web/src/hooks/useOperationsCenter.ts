'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { fetchOperationsData } from '@/lib/operations-center-service';
import type { AlertItem, BlockedItem, DeadlineItem, PulseMetrics, ActivityItem } from '@/lib/operations-center-service';

export type { AlertItem, BlockedItem, DeadlineItem, PulseMetrics, ActivityItem };

export interface OperationsData {
  alerts: AlertItem[];
  blockedItems: BlockedItem[];
  deadlines: DeadlineItem[];
  pulseMetrics: PulseMetrics;
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useOperationsCenter(): OperationsData {
  const { activeOrgId } = useOrgStore();
  const [data, setData] = useState<Omit<OperationsData, 'refresh'>>({
    alerts: [],
    blockedItems: [],
    deadlines: [],
    pulseMetrics: { activeReleases: 0, blockedReleases: 0, overBudget: 0, campaignsActive: 0 },
    activities: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!activeOrgId) {
      setData((d) => ({ ...d, loading: false }));
      return;
    }
    try {
      const ops = await fetchOperationsData(activeOrgId);
      setData({ ...ops, loading: false, error: null });
    } catch (err) {
      setData((d) => ({ ...d, error: (err as Error).message, loading: false }));
    }
  }, [activeOrgId]);

  useEffect(() => { load(); }, [load]);

  return { ...data, refresh: load };
}
