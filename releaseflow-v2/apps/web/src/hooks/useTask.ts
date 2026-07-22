'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import {
  listTasks,
  fetchTaskWithAssignment,
  listTasksByRelease,
  getTaskDashboardSummary,
  type TaskWithAssignment,
  type TaskListFilter,
  type TaskDashboardSummary,
} from '@/lib/task-service';

export function useTasks(filter: TaskListFilter = 'all_open', search = '') {
  const { activeOrgId, orgVersion } = useOrgStore();
  const { user } = useAuth();
  const perms = usePermissions();
  const [rows, setRows] = useState<TaskWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!activeOrgId || !user?.uid) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listTasks({
        organisationId: activeOrgId,
        actorUid: user.uid,
        filter,
        search,
        isManager: perms.canManageAssignments,
      });
      setRows(data);
    } catch (err) {
      console.error('[useTasks]', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, user?.uid, filter, search, perms.canManageAssignments, orgVersion]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, loading, error, refresh };
}

export function useTask(taskId: string | undefined) {
  const { activeOrgId } = useOrgStore();
  const [data, setData] = useState<TaskWithAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!taskId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await fetchTaskWithAssignment(taskId, activeOrgId ?? undefined);
      setData(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [taskId, activeOrgId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useReleaseTasks(releaseId: string | undefined) {
  const { activeOrgId } = useOrgStore();
  const [rows, setRows] = useState<TaskWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!activeOrgId || !releaseId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await listTasksByRelease(activeOrgId, releaseId));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, releaseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, loading, refresh };
}

export function useTaskDashboardSummary() {
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();
  const [summary, setSummary] = useState<TaskDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeOrgId || !user?.uid) {
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void getTaskDashboardSummary(activeOrgId, user.uid)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [activeOrgId, user?.uid]);

  return { summary, loading };
}
