'use client';

/**
 * Assignment detail + list hooks.
 * BUG-002 — detail load isolates document fetch from side-channel failures.
 */

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import {
  fetchAssignmentsByEntity,
  loadAssignmentDetail,
  type AssignmentLoadErrorCode,
} from '@/lib/assignment-service';
import type { AssignmentRecord } from '@/lib/assignment-service';
import { getActivityByEntity } from '@/lib/activity-service';
import type { ActivityEventRecord } from '@/lib/activity-service';
import { resolvePersonNames, resolveActorDisplayNames } from '@/lib/resolve-person-names';
import { fetchDeliverableLinks } from '@/lib/deliverable-link-service';
import type { DeliverableLinkRecord } from '@/lib/deliverable-link-service';
import { fetchAssignmentReleaseContext } from '@/lib/fetch-assignment-context';
import type { AssignmentReleaseContext } from '@/lib/fetch-assignment-context';

export interface AssignmentDisplayRecord extends AssignmentRecord {
  assigneeName: string | null;
  assignerName: string | null;
  releaseTitle?: string | null;
  releaseArtwork?: { secureUrl?: string } | null;
  artistName?: string | null;
  trackTitle?: string | null;
}

function getEntityReleaseId(a: AssignmentRecord): string | null {
  if (a.releaseId) return a.releaseId;
  if (a.entityType === 'release') return a.entityId;
  return null;
}

export interface AssignmentDetailData {
  assignment: AssignmentDisplayRecord | null;
  activities: ActivityEventRecord[];
  /** UX-001 — display names for activity actorIds (never show raw UIDs). */
  activityActorNames: Map<string, string>;
  deliverableLinks: DeliverableLinkRecord[];
  releaseContext: AssignmentReleaseContext | null;
  loading: boolean;
  /** BUG-002 — distinguishable load failure (not a generic null). */
  error: { code: AssignmentLoadErrorCode; message: string } | null;
  refresh: () => Promise<void>;
}

function normalizeRouteId(raw: string | string[] | undefined): string {
  if (!raw) return '';
  if (Array.isArray(raw)) return (raw[0] ?? '').trim();
  return String(raw).trim();
}

export function useAssignment(assignmentId: string | string[] | undefined): AssignmentDetailData {
  const { activeOrgId, orgsLoaded } = useOrgStore();
  const id = normalizeRouteId(assignmentId);

  const [assignment, setAssignment] = useState<AssignmentDisplayRecord | null>(null);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [activityActorNames, setActivityActorNames] = useState<Map<string, string>>(new Map());
  const [deliverableLinks, setDeliverableLinks] = useState<DeliverableLinkRecord[]>([]);
  const [releaseContext, setReleaseContext] = useState<AssignmentReleaseContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: AssignmentLoadErrorCode; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setAssignment(null);
      setError({ code: 'invalid_id', message: 'Missing assignment id.' });
      setLoading(false);
      return;
    }

    // Wait for org store hydration before treating org as empty (BUG-002 race).
    if (!orgsLoaded) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setError(null);

    // 1) Canonical document load — never blocked by activity/links/context.
    const result = await loadAssignmentDetail(id, {
      organizationId: activeOrgId,
      enforceOrg: Boolean(activeOrgId),
    });

    if (!result.ok) {
      setAssignment(null);
      setActivities([]);
      setActivityActorNames(new Map());
      setDeliverableLinks([]);
      setReleaseContext(null);
      setError({ code: result.code, message: result.message });
      setLoading(false);
      return;
    }

    const a = result.assignment;

    // 2) Enrich names (best-effort) — include assignerUserId for activity actors
    let displayRecord: AssignmentDisplayRecord = {
      ...a,
      assigneeName: null,
      assignerName: null,
    };
    try {
      const map = await resolvePersonNames(
        [a.assigneeId, a.assignerId, a.assigneeUserId, a.assignerUserId].filter(Boolean) as string[],
      );
      displayRecord = {
        ...a,
        assigneeName: map.get(a.assigneeId) ?? map.get(a.assigneeUserId ?? '') ?? 'Unknown Person',
        assignerName: map.get(a.assignerId) ?? map.get(a.assignerUserId ?? '') ?? 'Unknown Person',
      };
    } catch (err) {
      console.warn('[useAssignment] name resolution failed', err);
    }

    // Primary content ready — do not wait for comments/history (UX-001.11)
    setAssignment(displayRecord);
    setError(null);
    setLoading(false);

    // 3) Side channels — failures must NOT clear the assignment (BUG-002 root cause).
    const orgForActivity = a.organizationId || activeOrgId || '';
    const [acts, links, releaseCtx] = await Promise.all([
      orgForActivity
        ? getActivityByEntity(orgForActivity, 'task', id).catch((err) => {
          console.warn('[useAssignment] activity load failed', err);
          return [] as ActivityEventRecord[];
        })
        : Promise.resolve([] as ActivityEventRecord[]),
      fetchDeliverableLinks(id).catch((err) => {
        console.warn('[useAssignment] deliverable links failed', err);
        return [] as DeliverableLinkRecord[];
      }),
      fetchAssignmentReleaseContext(a.entityType, a.entityId).catch((err) => {
        console.warn('[useAssignment] release context failed', err);
        return null;
      }),
    ]);

    // Resolve activity actor display names (UX-001 — Person.id or Auth uid)
    try {
      const actorIds = [
        ...acts.map((ev) => ev.actorId),
        a.assigneeId,
        a.assignerId,
        a.assigneeUserId,
        a.assignerUserId,
      ].filter(Boolean) as string[];
      const nameMap = await resolveActorDisplayNames(actorIds, a.organizationId || activeOrgId);
      if (displayRecord.assigneeName === 'Unknown Person' && a.assigneeId) {
        const n = nameMap.get(a.assigneeId) ?? (a.assigneeUserId ? nameMap.get(a.assigneeUserId) : undefined);
        if (n && n !== 'Unknown Person') displayRecord = { ...displayRecord, assigneeName: n };
      }
      if (displayRecord.assignerName === 'Unknown Person') {
        const n =
          (a.assignerId ? nameMap.get(a.assignerId) : undefined)
          ?? (a.assignerUserId ? nameMap.get(a.assignerUserId) : undefined);
        if (n && n !== 'Unknown Person') displayRecord = { ...displayRecord, assignerName: n };
      }
      setAssignment(displayRecord);
      setActivityActorNames(nameMap);
    } catch {
      setActivityActorNames(new Map());
    }

    setActivities(acts);
    setDeliverableLinks(links);
    setReleaseContext(releaseCtx);

    // CE-008 — offline cache best-effort
    if (typeof navigator !== 'undefined' && activeOrgId) {
      try {
        const { cacheAssignmentView } = await import('@/lib/pwa/offline-data-cache');
        const { getAuthInstance } = await import('@/lib/firebase');
        const uid = getAuthInstance()?.currentUser?.uid;
        if (uid) {
          await cacheAssignmentView({
            id: displayRecord.id,
            userId: uid,
            organizationId: activeOrgId,
            snapshot: {
              assignment: displayRecord,
              activities: acts,
              deliverableLinks: links,
              releaseContext: releaseCtx,
            },
          });
        }
      } catch {
        /* ignore */
      }
    }
  }, [id, activeOrgId, orgsLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    assignment,
    activities,
    activityActorNames,
    deliverableLinks,
    releaseContext,
    loading,
    error,
    refresh: load,
  };
}

async function enrichAssignments(
  data: AssignmentRecord[],
  activeOrgId: string,
): Promise<AssignmentDisplayRecord[]> {
  let nameMap = new Map<string, string>();
  try {
    const allIds: string[] = [];
    for (const a of data) {
      if (a.assigneeId) allIds.push(a.assigneeId);
      if (a.assignerId) allIds.push(a.assignerId);
    }
    nameMap = await resolvePersonNames(allIds);
  } catch (err) {
    console.error('[useAssignments] name resolution failed', err);
  }

  const releaseMap = new Map<string, { title: string; artwork: { secureUrl?: string } | null }>();
  try {
    const releaseIds = [
      ...new Set(
        data
          .map((a) => a.releaseId ?? getEntityReleaseId(a))
          .filter(Boolean),
      ),
    ] as string[];
    if (releaseIds.length > 0) {
      const { fetchReleasesByOrg } = await import('@/lib/release-service');
      const allReleases = await fetchReleasesByOrg(activeOrgId);
      for (const r of allReleases) {
        if (releaseIds.includes(r.id)) {
          releaseMap.set(r.id, { title: r.title, artwork: r.artwork ?? null });
        }
      }
    }
  } catch (err) {
    console.error('[useAssignments] release context failed', err);
  }

  return data.map((a) => {
    const releaseId = a.releaseId ?? getEntityReleaseId(a);
    const releaseInfo = releaseId ? releaseMap.get(releaseId) : undefined;
    return {
      ...a,
      assigneeName: nameMap.get(a.assigneeId) ?? 'Unknown Person',
      assignerName: nameMap.get(a.assignerId) ?? 'Unknown Person',
      releaseTitle: releaseInfo?.title ?? null,
      releaseArtwork: releaseInfo?.artwork ?? null,
      artistName: null,
      trackTitle: null,
    };
  });
}

export function useAssignments(entityType?: string, entityId?: string) {
  const [assignments, setAssignments] = useState<AssignmentDisplayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeOrgId } = useOrgStore();

  const applyData = useCallback(async (data: AssignmentRecord[]) => {
    if (!activeOrgId) {
      setAssignments([]);
      return;
    }
    try {
      setAssignments(await enrichAssignments(data, activeOrgId));
    } catch (err) {
      console.error('[useAssignments] enrich failed', err);
      setAssignments(data.map((a) => ({
        ...a,
        assigneeName: null,
        assignerName: null,
        releaseTitle: null,
        releaseArtwork: null,
        artistName: null,
        trackTitle: null,
      })));
    }
  }, [activeOrgId]);

  const load = useCallback(async () => {
    if (!activeOrgId) {
      setAssignments([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let data: AssignmentRecord[];
      if (entityType && entityId) {
        data = await fetchAssignmentsByEntity(entityType, entityId, {
          organizationId: activeOrgId,
        });
      } else {
        const mod = await import('@/lib/assignment-service');
        data = await mod.fetchAssignments(activeOrgId);
      }
      await applyData(data);
    } catch (err) {
      console.error('[useAssignments] load failed', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
      setAssignments((prev) => (prev.length ? prev : []));
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, entityType, entityId, applyData]);

  // ARS-004.3 — Firestore snapshot listeners via Assignment Service
  useEffect(() => {
    if (!activeOrgId) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);

    void import('@/lib/assignment-service').then((mod) => {
      if (cancelled) return;
      if (entityType && entityId) {
        unsub = mod.subscribeEntityAssignments(
          entityType as AssignmentRecord['entityType'],
          entityId,
          (data) => {
            void applyData(data).finally(() => {
              if (!cancelled) setLoading(false);
            });
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          },
          { organizationId: activeOrgId },
        );
      } else {
        unsub = mod.subscribeOrgAssignments(
          activeOrgId,
          (data) => {
            void applyData(data).finally(() => {
              if (!cancelled) setLoading(false);
            });
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          },
        );
      }
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [activeOrgId, entityType, entityId, applyData]);

  return { assignments, loading, error, refresh: load };
}
