'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchMilestonesByRelease, fetchMilestonesByOrg } from '@/lib/milestone-service';
import type { MilestoneRecord } from '@/lib/milestone-service';

interface UseMilestonesResult {
  milestones: MilestoneRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useReleaseMilestones(releaseId: string | undefined): UseMilestonesResult {
  const [milestones, setMilestones] = useState<MilestoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!releaseId) {
      setMilestones([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMilestonesByRelease(releaseId);
      setMilestones(data);
      setError(null);
    } catch (err) {
      setError('Failed to load milestones');
      if (process.env.NODE_ENV === 'development') console.error('useReleaseMilestones:', err);
    } finally {
      setLoading(false);
    }
  }, [releaseId]);

  useEffect(() => { load(); }, [load]);

  return { milestones, loading, error, refresh: load };
}

export function useOrgMilestones(orgId: string | undefined): UseMilestonesResult {
  const [milestones, setMilestones] = useState<MilestoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orgId) {
      setMilestones([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMilestonesByOrg(orgId);
      setMilestones(data);
      setError(null);
    } catch (err) {
      setError('Failed to load milestones');
      if (process.env.NODE_ENV === 'development') console.error('useOrgMilestones:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  return { milestones, loading, error, refresh: load };
}
