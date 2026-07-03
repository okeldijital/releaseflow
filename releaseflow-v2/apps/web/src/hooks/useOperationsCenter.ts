'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { fetchOrgIntelligence } from '@/lib/operational-intelligence-service';
import type {
  AlertItem, BlockedItem, DeadlineItem, PulseMetrics,
  ActivityItem, ReleaseIntelligence,
} from '@/lib/operational-intelligence-service';

export type {
  AlertItem, BlockedItem, DeadlineItem, PulseMetrics,
  ActivityItem, ReleaseIntelligence,
};

export interface OperationsData {
  releases: ReleaseIntelligence[];
  alerts: AlertItem[];
  blockedItems: BlockedItem[];
  deadlines: DeadlineItem[];
  pulseMetrics: PulseMetrics;
  activities: ActivityItem[];
  aggregateHealthPct: number;
  aggregateReadinessPct: number;
  aggregateConfidencePct: number;
  majorityStage: string;
  nearestDeadlineDays: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useOperationsCenter(): OperationsData {
  const { activeOrgId, orgVersion } = useOrgStore();
  const [data, setData] = useState<Omit<OperationsData, 'refresh'>>({
    releases: [], alerts: [], blockedItems: [], deadlines: [],
    pulseMetrics: { activeReleases: 0, blockedReleases: 0, overBudget: 0, overdueDeadlines: 0, shippedThisMonth: 0, campaignsActive: 0 },
    activities: [], aggregateHealthPct: 100, aggregateReadinessPct: 100,
    aggregateConfidencePct: 100, majorityStage: 'Operations', nearestDeadlineDays: null,
    loading: true, error: null,
  });

  const load = useCallback(async () => {
    if (!activeOrgId) { setData((d) => ({ ...d, loading: false })); return; }
    try {
      const ops = await fetchOrgIntelligence(activeOrgId);
      setData({ ...ops, loading: false, error: null });
    } catch (_err) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('useOperationsCenter:', _err);
      setData((d) => ({ ...d, error: 'Failed to load operational data. Please try again.', loading: false }));
    }
  }, [activeOrgId, orgVersion]);

  useEffect(() => { load(); }, [load]);

  return { ...data, refresh: load };
}
