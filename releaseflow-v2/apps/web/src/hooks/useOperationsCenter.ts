'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useOrgStore } from '@/stores/org-store';
import type { OperationalAlert, Task, Stage, Dependency, ReleaseBudget, Campaign, Release } from '@/app/(app)/types';

export interface AlertItem {
  id: string;
  releaseId: string;
  rule: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
}

export interface BlockedItem {
  id: string;
  releaseId: string;
  name: string;
  type: 'stage' | 'dependency' | 'approval';
  owner?: string;
  age: string;
  status: string;
}

export interface DeadlineItem {
  id: string;
  releaseId: string;
  title: string;
  type: 'task' | 'campaign_task' | 'dependency';
  dueDate: Date;
  priority: string;
}

export interface PulseMetrics {
  activeReleases: number;
  blockedReleases: number;
  overBudget: number;
  campaignsActive: number;
}

export interface ActivityItem {
  id: string;
  message: string;
  releaseId: string;
  type: string;
  createdAt: Date;
}

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

function toDate(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (ts instanceof Timestamp) return ts.toDate();
  if (typeof ts === 'object' && ts !== null) {
    const obj = ts as Record<string, unknown>;
    if (typeof obj.toDate === 'function') return (obj as { toDate: () => Date }).toDate();
    if (typeof obj.seconds === 'number') return new Date((obj as { seconds: number }).seconds * 1000);
  }
  return null;
}

function ageLabel(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return `${Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))}h`;
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

export function useOperationsCenter(): OperationsData {
  const { activeOrgId } = useOrgStore();
  const [data, setData] = useState<Omit<OperationsData, 'refresh'>>({
    alerts: [], blockedItems: [], deadlines: [],
    pulseMetrics: { activeReleases: 0, blockedReleases: 0, overBudget: 0, campaignsActive: 0 },
    activities: [], loading: true, error: null,
  });

  const load = useCallback(async () => {
    if (!activeOrgId) { setData((d) => ({ ...d, loading: false })); return; }
    const db = getDb();
    if (!db) { setData((d) => ({ ...d, error: 'Firestore unavailable', loading: false })); return; }

    try {
      const now = new Date();
      const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const relSnap = await getDocs(
        query(collection(db, 'releases'), where('organizationId', '==', activeOrgId)),
      );
      const releases = relSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Release);
      const releaseIds = releases.map((r) => r.id);

      if (releaseIds.length === 0) {
        setData((d) => ({ ...d, loading: false }));
        return;
      }

      // Alerts
      const alertItems: AlertItem[] = [];
      for (const rid of releaseIds) {
        const snap = await getDocs(
          query(collection(db, 'operational_alerts'), where('releaseId', '==', rid), where('resolved', '==', false), orderBy('priority', 'desc'), limit(10)),
        );
        for (const d of snap.docs) {
          const a = d.data() as OperationalAlert;
          alertItems.push({ id: d.id, releaseId: a.releaseId, rule: a.rule, priority: a.priority, message: a.message, entityType: a.entityType, entityId: a.entityId, createdAt: toDate(a.createdAt) ?? new Date() });
        }
      }

      // Blocked stages
      const stageSnap = await getDocs(query(collection(db, 'stages'), where('status', '==', 'blocked')));
      const blockedStages = stageSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Stage);
      const blockedItems: BlockedItem[] = blockedStages.map((s) => ({
        id: s.id, releaseId: s.workflowId, name: s.name, type: 'stage' as const,
        owner: s.assignedRole, age: ageLabel(toDate(s.startedAt) ?? new Date()), status: 'blocked',
      }));

      // Blocked dependencies
      for (const rid of releaseIds) {
        const depSnap = await getDocs(query(collection(db, 'dependencies'), where('releaseId', '==', rid), where('status', '==', 'blocked'), limit(5)));
        for (const d of depSnap.docs) {
          const dep = d.data() as Dependency;
          blockedItems.push({
            id: d.id, releaseId: rid, name: dep.title, type: 'dependency' as const,
            owner: dep.owner, age: ageLabel(toDate(dep.createdAt) ?? new Date()), status: 'blocked',
          });
        }
      }

      // Deadlines
      const deadlines: DeadlineItem[] = [];
      if (releaseIds.length > 0) {
        const taskSnap = await getDocs(
          query(collection(db, 'tasks'), where('releaseId', 'in', releaseIds), where('status', '!=', 'done'), orderBy('dueDate', 'asc'), limit(10)),
        );
        for (const d of taskSnap.docs) {
          const t = d.data() as Task;
          const dd = toDate(t.dueDate);
          if (dd && dd > now && dd < week) {
            deadlines.push({ id: d.id, releaseId: t.releaseId, title: t.title, type: 'task' as const, dueDate: dd, priority: t.priority });
          }
        }
      }

      // Pulse metrics
      const activeRel = releases.filter((r) => r.status !== 'archived').length;
      const blockedRel = stageSnap.docs.filter((d) => releaseIds.includes(d.data().workflowId)).length > 0 ? new Set(stageSnap.docs.map((d) => d.data().workflowId)).size : 0;

      const budgetSnap = await getDocs(
        query(collection(db, 'release_budgets'), where('releaseId', 'in', releaseIds), where('status', '==', 'over_budget'), limit(50)),
      );
      const budgetItems = budgetSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseBudget);

      const campaignSnap = await getDocs(
        query(collection(db, 'campaigns'), where('releaseId', 'in', releaseIds), where('status', '==', 'active'), limit(50)),
      );
      const campaignItems = campaignSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Campaign);

      // Activities
      const activityItems: ActivityItem[] = [];
      for (const rid of releaseIds.slice(0, 3)) {
        const snap = await getDocs(
          query(collection(db, 'activities'), where('releaseId', '==', rid), orderBy('createdAt', 'desc'), limit(5)),
        );
        for (const d of snap.docs) {
          const a = d.data() as { type: string; releaseId: string; metadata?: { title?: string } };
          activityItems.push({ id: d.id, message: a.metadata?.title ?? a.type.replace(/_/g, ' '), releaseId: a.releaseId, type: a.type, createdAt: toDate(d.data().createdAt) ?? new Date() });
        }
      }

      setData({
        alerts: alertItems,
        blockedItems,
        deadlines,
        pulseMetrics: { activeReleases: activeRel, blockedReleases: blockedRel, overBudget: budgetItems.length, campaignsActive: campaignItems.length },
        activities: activityItems,
        loading: false,
        error: null,
      });
    } catch (err) {
      setData((d) => ({ ...d, error: (err as Error).message, loading: false }));
    }
  }, [activeOrgId]);

  useEffect(() => { load(); }, [load]);

  return { ...data, refresh: load };
}
