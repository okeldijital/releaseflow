'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { fetchAssignment, fetchAssignmentsByEntity } from '@/lib/assignment-service';
import type { AssignmentRecord } from '@/lib/assignment-service';
import { getActivityByEntity } from '@/lib/activity-service';
import type { ActivityEventRecord } from '@/lib/activity-service';
import { resolvePersonNames } from '@/lib/resolve-person-names';
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
  if (a.entityType === 'release') return a.entityId;
  return null;
}

export interface AssignmentDetailData {
  assignment: AssignmentDisplayRecord | null;
  activities: ActivityEventRecord[];
  deliverableLinks: DeliverableLinkRecord[];
  releaseContext: AssignmentReleaseContext | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useAssignment(assignmentId: string | undefined): AssignmentDetailData {
  const { activeOrgId } = useOrgStore();
  const [assignment, setAssignment] = useState<AssignmentDisplayRecord | null>(null);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [deliverableLinks, setDeliverableLinks] = useState<DeliverableLinkRecord[]>([]);
  const [releaseContext, setReleaseContext] = useState<AssignmentReleaseContext | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!assignmentId || !activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [a, acts, links] = await Promise.all([
        fetchAssignment(assignmentId),
        getActivityByEntity(activeOrgId, 'task', assignmentId),
        fetchDeliverableLinks(assignmentId),
      ]);

      let displayRecord: AssignmentDisplayRecord | null = null;
      let releaseCtx: AssignmentReleaseContext | null = null;

      if (a) {
        const map = await resolvePersonNames([a.assigneeId, a.assignerId]);
        displayRecord = {
          ...a,
          assigneeName: map.get(a.assigneeId) ?? 'Unknown Person',
          assignerName: map.get(a.assignerId) ?? 'Unknown Person',
        };

        releaseCtx = await fetchAssignmentReleaseContext(a.entityType, a.entityId);
        setReleaseContext(releaseCtx);
      } else {
        setReleaseContext(null);
      }

      setAssignment(displayRecord);
      setActivities(acts);
      setDeliverableLinks(links);

      // CE-008 — cache recent assignment view for offline (no secrets)
      if (displayRecord && typeof navigator !== 'undefined') {
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
          /* offline cache best-effort */
        }
      }
    } catch {
      // CE-008 — fall back to offline cache
      try {
        const { getCachedAssignment } = await import('@/lib/pwa/offline-data-cache');
        const { getAuthInstance } = await import('@/lib/firebase');
        const uid = getAuthInstance()?.currentUser?.uid;
        if (uid && assignmentId) {
          const cached = await getCachedAssignment(assignmentId, uid);
          if (cached?.snapshot) {
            const snap = cached.snapshot as {
              assignment?: AssignmentDisplayRecord;
              activities?: ActivityEventRecord[];
              deliverableLinks?: DeliverableLinkRecord[];
              releaseContext?: AssignmentReleaseContext | null;
            };
            setAssignment(snap.assignment ?? null);
            setActivities(snap.activities ?? []);
            setDeliverableLinks(snap.deliverableLinks ?? []);
            setReleaseContext(snap.releaseContext ?? null);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      setAssignment(null);
      setReleaseContext(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, activeOrgId]);

  useEffect(() => { void load(); }, [load]);

  return { assignment, activities, deliverableLinks, releaseContext, loading, refresh: load };
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

      const releaseIds = [...new Set(data.map((a) => getEntityReleaseId(a)).filter(Boolean))] as string[];
      const releaseMap = new Map<string, { title: string; artwork: { secureUrl?: string } | null }>();
      if (releaseIds.length > 0) {
        const { fetchReleasesByOrg } = await import('@/lib/release-service');
        const allReleases = await fetchReleasesByOrg(activeOrgId);
        for (const r of allReleases) {
          if (releaseIds.includes(r.id)) {
            releaseMap.set(r.id, { title: r.title, artwork: r.artwork ?? null });
          }
        }
      }

      setAssignments(
        data.map((a) => {
          const releaseId = getEntityReleaseId(a);
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
        }),
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
