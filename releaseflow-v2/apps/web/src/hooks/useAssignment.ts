'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { fetchAssignment, fetchAssignmentsByEntity } from '@/lib/assignment-service';
import type { AssignmentRecord } from '@/lib/assignment-service';
import { getActivityByEntity } from '@/lib/activity-service';
import type { ActivityEventRecord } from '@/lib/activity-service';

export function useAssignment(assignmentId: string | undefined) {
  const { activeOrgId } = useOrgStore();
  const [assignment, setAssignment] = useState<AssignmentRecord | null>(null);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!assignmentId || !activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [a, acts] = await Promise.all([
        fetchAssignment(assignmentId),
        getActivityByEntity(activeOrgId, 'task', assignmentId),
      ]);
      setAssignment(a);
      setActivities(acts);
    } catch {
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, activeOrgId]);

  useEffect(() => { void load(); }, [load]);

  return { assignment, activities, loading, refresh: load };
}

export function useAssignments(entityType?: string, entityId?: string) {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeOrgId } = useOrgStore();

  const load = useCallback(async () => {
    if (!activeOrgId) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (entityType && entityId) {
        const data = await fetchAssignmentsByEntity(entityType, entityId);
        setAssignments(data);
      } else {
        const mod = await import('@/lib/assignment-service');
        const data = await mod.fetchAssignments(activeOrgId);
        setAssignments(data);
      }
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, entityType, entityId]);

  useEffect(() => { void load(); }, [load]);

  return { assignments, loading, refresh: load };
}
