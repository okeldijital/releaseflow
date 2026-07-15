'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { fetchAssignment, fetchAssignmentsByEntity } from '@/lib/assignment-service';
import type { AssignmentRecord } from '@/lib/assignment-service';
import { getActivityByEntity } from '@/lib/activity-service';
import type { ActivityEventRecord } from '@/lib/activity-service';
import { resolvePersonNames } from '@/lib/resolve-person-names';

export interface AssignmentDisplayRecord extends AssignmentRecord {
  assigneeName: string | null;
  assignerName: string | null;
}

export function useAssignment(assignmentId: string | undefined) {
  const { activeOrgId } = useOrgStore();
  const [assignment, setAssignment] = useState<AssignmentDisplayRecord | null>(null);
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
      if (a) {
        const map = await resolvePersonNames([a.assigneeId, a.assignerId]);
        setAssignment({
          ...a,
          assigneeName: map.get(a.assigneeId) ?? 'Unknown Person',
          assignerName: map.get(a.assignerId) ?? 'Unknown Person',
        });
      } else {
        setAssignment(null);
      }
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
  const [assignments, setAssignments] = useState<AssignmentDisplayRecord[]>([]);
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
      let data: AssignmentRecord[];
      if (entityType && entityId) {
        data = await fetchAssignmentsByEntity(entityType, entityId);
      } else {
        const mod = await import('@/lib/assignment-service');
        data = await mod.fetchAssignments(activeOrgId);
      }

      const allIds: string[] = [];
      for (const a of data) {
        if (a.assigneeId) allIds.push(a.assigneeId);
        if (a.assignerId) allIds.push(a.assignerId);
      }
      const nameMap = await resolvePersonNames(allIds);

      setAssignments(
        data.map((a) => ({
          ...a,
          assigneeName: nameMap.get(a.assigneeId) ?? 'Unknown Person',
          assignerName: nameMap.get(a.assignerId) ?? 'Unknown Person',
        })),
      );
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, entityType, entityId]);

  useEffect(() => { void load(); }, [load]);

  return { assignments, loading, refresh: load };
}
