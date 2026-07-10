'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrgStore } from '@/stores/org-store';
import {
  fetchWork, fetchWorks,
  checkWorkReadiness, getWorkWriters, getWorkPublishers,
  getWorkLinkedTracks,
} from '@/lib/work-service';
import type { WorkRecord, WorkReadinessResult } from '@/lib/work-service';
import type { WorkWriterSplit, WorkPublisherRecord } from '@/lib/work-repository';
import { getActivityByEntity } from '@/lib/activity-service';
import type { ActivityEventRecord } from '@/lib/activity-service';
import { toWorkOptions, type WorkOption } from '@/lib/work-field-picker-logic';

export type { WorkOption };

export function useWork(workId: string | undefined) {
  const { activeOrgId } = useOrgStore();
  const [work, setWork] = useState<WorkRecord | null>(null);
  const [writers, setWriters] = useState<WorkWriterSplit[]>([]);
  const [publishers, setPublishers] = useState<WorkPublisherRecord[]>([]);
  const [linkedTracks, setLinkedTracks] = useState<{ trackId: string; linkedAt: unknown }[]>([]);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [readiness, setReadiness] = useState<WorkReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!workId || !activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [w, wr, pubs, tracks, acts, r] = await Promise.all([
        fetchWork(workId),
        getWorkWriters(workId),
        getWorkPublishers(workId),
        getWorkLinkedTracks(workId),
        getActivityByEntity(activeOrgId, 'release', workId),
        checkWorkReadiness(workId),
      ]);
      setWork(w);
      setWriters(wr);
      setPublishers(pubs);
      setLinkedTracks(tracks);
      setReadiness(r);
      const activityEvents = acts.length > 0 ? acts : await getActivityByEntity(activeOrgId, 'track', workId);
      setActivities(activityEvents);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [workId, activeOrgId]);

  useEffect(() => { void load(); }, [load]);

  return {
    work, writers, publishers, linkedTracks, activities, readiness,
    loading, refresh: load,
  };
}

export function useWorks() {
  const [works, setWorks] = useState<WorkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { activeOrgId, orgVersion } = useOrgStore();

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!activeOrgId) {
      setWorks([]);
      setLoading(false);
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchWorks(activeOrgId);
      setWorks(data);
    } catch {
      setWorks([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => { void load(); }, [load, orgVersion]);

  const filteredWorks = useMemo(() => {
    if (statusFilter === 'all') return works;
    return works.filter((w) => w.status === statusFilter);
  }, [works, statusFilter]);

  const workOptions = useMemo(
    () => toWorkOptions(works.filter((w) => w.status !== 'archived')),
    [works],
  );

  return {
    works: filteredWorks,
    allWorks: works,
    workOptions,
    loading,
    refresh: load,
    statusFilter,
    setStatusFilter,
  };
}
