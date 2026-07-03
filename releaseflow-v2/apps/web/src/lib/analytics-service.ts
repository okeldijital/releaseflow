import type { ApprovalRequest } from '@/app/(app)/types';
import type { EntityCommentRecord } from './comments-repository';

export interface AnalyticsSnapshot {
  avgProductionDuration: number;
  avgApprovalTime: number;
  avgAssetTurnaround: number;
  avgSpecCompletion: number;
  distributionSuccessRate: number;
  collaborationResponsiveness: number;
}

function safeDaysBetween(
  start: unknown,
  end: unknown,
): number {
  const toMs = (val: unknown): number => {
    if (!val) return NaN;
    if (typeof val === 'object' && val !== null && 'toDate' in val) {
      return (val as { toDate: () => Date }).toDate().getTime();
    }
    if (val instanceof Date) return val.getTime();
    if (typeof val === 'string') return new Date(val).getTime();
    if (typeof val === 'number') return val;
    return NaN;
  };

  const startMs = toMs(start);
  const endMs = toMs(end);
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return 0;
  return (endMs - startMs) / (1000 * 60 * 60 * 24);
}

function safeHoursBetween(
  start: unknown,
  end: unknown,
): number {
  const toMs = (val: unknown): number => {
    if (!val) return NaN;
    if (typeof val === 'object' && val !== null && 'toDate' in val) {
      return (val as { toDate: () => Date }).toDate().getTime();
    }
    if (val instanceof Date) return val.getTime();
    if (typeof val === 'string') return new Date(val).getTime();
    if (typeof val === 'number') return val;
    return NaN;
  };

  const startMs = toMs(start);
  const endMs = toMs(end);
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return 0;
  return (endMs - startMs) / (1000 * 60 * 60);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

async function computeAvgProductionDuration(orgId: string): Promise<number> {
  try {
    const { getReleasesByOrganization } = await import('./release-repository');
    const releases = await getReleasesByOrganization(orgId);
    const durations: number[] = [];
    for (const release of releases) {
      const duration = safeDaysBetween(release.createdAt, release.updatedAt);
      if (duration > 0) durations.push(duration);
    }
    return average(durations);
  } catch {
    return 0;
  }
}

async function computeAvgApprovalTime(orgId: string): Promise<number> {
  try {
    const { getDb } = await import('./firebase');
    const { collection, query, where, orderBy, getDocs } = await import(
      'firebase/firestore'
    );
    const db = getDb();
    if (!db) return 0;

    const snap = await getDocs(
      query(
        collection(db, 'approval_requests'),
        where('organizationId', '==', orgId),
        where('lifecycleState', '==', 'approved'),
        orderBy('createdAt', 'desc'),
      ),
    );

    const approvals = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ApprovalRequest,
    );
    const durations: number[] = [];
    for (const approval of approvals) {
      const duration = safeDaysBetween(
        approval.createdAt,
        approval.respondedAt,
      );
      if (duration > 0) durations.push(duration);
    }
    return average(durations);
  } catch {
    return 0;
  }
}

async function computeAvgAssetTurnaround(orgId: string): Promise<number> {
  try {
    const { getAssetsByOrg } = await import('./asset-entity-repository');
    const assets = await getAssetsByOrg(orgId);
    const durations: number[] = [];
    for (const asset of assets) {
      const duration = safeDaysBetween(asset.createdAt, asset.updatedAt);
      if (duration > 0) durations.push(duration);
    }
    return average(durations);
  } catch {
    return 0;
  }
}

async function computeAvgSpecCompletion(orgId: string): Promise<number> {
  try {
    const { getDb } = await import('./firebase');
    const { collection, query, where, getDocs } = await import(
      'firebase/firestore'
    );
    const db = getDb();
    if (!db) return 0;

    const { getReleasesByOrganization } = await import('./release-repository');
    const releases = await getReleasesByOrganization(orgId);
    const releaseIds = releases.map((r) => r.id);
    if (releaseIds.length === 0) return 0;

    const durations: number[] = [];
    for (const releaseId of releaseIds) {
      const snap = await getDocs(
        query(
          collection(db, 'specifications'),
          where('releaseId', '==', releaseId),
          where('status', '==', 'completed'),
        ),
      );
      for (const d of snap.docs) {
        const data = d.data();
        const duration = safeDaysBetween(
          data.createdAt as unknown,
          data.updatedAt as unknown,
        );
        if (duration > 0) durations.push(duration);
      }
    }
    return average(durations);
  } catch {
    return 0;
  }
}

async function computeDistributionSuccessRate(orgId: string): Promise<number> {
  try {
    const { getReleasesByOrganization } = await import('./release-repository');
    const releases = await getReleasesByOrganization(orgId);
    if (releases.length === 0) return 0;
    const readyCount = releases.filter(
      (r) =>
        r.status === 'ready_for_distribution' || r.status === 'released',
    ).length;
    return Math.round((readyCount / releases.length) * 100);
  } catch {
    return 0;
  }
}

async function computeCollaborationResponsiveness(
  orgId: string,
): Promise<number> {
  try {
    const { getDb } = await import('./firebase');
    const { collection, query, where, getDocs } = await import(
      'firebase/firestore'
    );
    const db = getDb();
    if (!db) return 0;

    const snap = await getDocs(
      query(
        collection(db, 'entity_comments'),
        where('organizationId', '==', orgId),
      ),
    );

    const comments = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as EntityCommentRecord,
    );

    if (comments.length === 0) return 0;

    const parentComments = comments.filter(
      (c) => !c.parentCommentId,
    );
    let totalResponseHours = 0;
    let responseCount = 0;

    for (const parent of parentComments) {
      const replies = comments.filter(
        (c) => c.parentCommentId === parent.id,
      );
      if (replies.length > 0) {
        const firstReply = replies.reduce((earliest, reply) => {
          const replyTime =
            (reply.createdAt as { toDate?: () => Date })?.toDate?.() ??
            new Date();
          const earliestTime =
            (earliest.createdAt as { toDate?: () => Date })?.toDate?.() ??
            new Date();
          return replyTime < earliestTime ? reply : earliest;
        }, replies[0]!);
        const hours = safeHoursBetween(
          parent.createdAt,
          firstReply!.createdAt,
        );
        if (hours > 0) {
          totalResponseHours += hours;
          responseCount++;
        }
      }
    }

    return responseCount > 0 ? totalResponseHours / responseCount : 0;
  } catch {
    return 0;
  }
}

export async function computeAnalytics(
  orgId: string,
): Promise<AnalyticsSnapshot> {
  const [
    avgProductionDuration,
    avgApprovalTime,
    avgAssetTurnaround,
    avgSpecCompletion,
    distributionSuccessRate,
    collaborationResponsiveness,
  ] = await Promise.all([
    computeAvgProductionDuration(orgId),
    computeAvgApprovalTime(orgId),
    computeAvgAssetTurnaround(orgId),
    computeAvgSpecCompletion(orgId),
    computeDistributionSuccessRate(orgId),
    computeCollaborationResponsiveness(orgId),
  ]);

  return {
    avgProductionDuration: Math.round(avgProductionDuration * 10) / 10,
    avgApprovalTime: Math.round(avgApprovalTime * 10) / 10,
    avgAssetTurnaround: Math.round(avgAssetTurnaround * 10) / 10,
    avgSpecCompletion: Math.round(avgSpecCompletion * 10) / 10,
    distributionSuccessRate: Math.round(distributionSuccessRate * 10) / 10,
    collaborationResponsiveness: Math.round(collaborationResponsiveness * 10) / 10,
  };
}
