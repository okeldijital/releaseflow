'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWorkflow, fetchStages, fetchActivity } from '@/lib/workflow-service';
import type { WorkflowRecord, StageRecord } from '@/lib/workflow-repository';
import type { ActivityEventRecord } from '@/lib/activity-service';

export function useWorkflow(releaseId: string | undefined) {
  const [workflow, setWorkflow] = useState<WorkflowRecord | null>(null);
  const [stages, setStages] = useState<StageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!releaseId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [wf, stg] = await Promise.all([
        fetchWorkflow(releaseId),
        (async () => {
          const w = await fetchWorkflow(releaseId);
          if (!w) return [];
          return fetchStages(w.id);
        })(),
      ]);
      setWorkflow(wf);
      setStages(stg);
      setError(null);
    } catch (err) {
      setError('Failed to load workflow data. Please try again.');
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('useWorkflow:', err);
    } finally {
      setLoading(false);
    }
  }, [releaseId]);

  useEffect(() => { load(); }, [load]);

  return { workflow, stages, loading, error, refresh: load };
}

export function useActivity(releaseId: string | undefined) {
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!releaseId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchActivity(releaseId);
      setActivities(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [releaseId]);

  useEffect(() => { load(); }, [load]);

  return { activities, loading, refresh: load };
}
