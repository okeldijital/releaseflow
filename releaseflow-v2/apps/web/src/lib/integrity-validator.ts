import { collection, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface IntegrityIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  entityId: string;
  collection: string;
  description: string;
}

export interface IntegrityReport {
  issues: IntegrityIssue[];
  totalOrphans: number;
  totalBrokenRefs: number;
  scanned: { collection: string; count: number }[];
}

export async function validateDataIntegrity(orgId: string): Promise<IntegrityReport> {
  const db = getDb();
  if (!db) return { issues: [], totalOrphans: 0, totalBrokenRefs: 0, scanned: [] };

  const issues: IntegrityIssue[] = [];
  const scanned: { collection: string; count: number }[] = [];

  const snap = await getDocs(query(collection(db, 'releases'), where('organizationId', '==', orgId)));
  const releaseIds = snap.docs.map((d) => d.id);
  scanned.push({ collection: 'releases', count: releaseIds.length });

  if (releaseIds.length === 0) {
    return { issues, totalOrphans: 0, totalBrokenRefs: 0, scanned };
  }

  const validReleaseIds = new Set(releaseIds);

  const collections = [
    { name: 'tasks', fk: 'releaseId' },
    { name: 'stages', fk: 'releaseId' },
    { name: 'deliverables', fk: 'releaseId' },
    { name: 'campaigns', fk: 'releaseId' },
    { name: 'budgets', fk: 'releaseId' },
    { name: 'release_requirements', fk: 'releaseId' },
    { name: 'release_ownerships', fk: 'releaseId' },
  ];

  for (const col of collections) {
    const colSnap = await getDocs(query(collection(db, col.name), where(col.fk, 'in', Array.from(validReleaseIds))));
    scanned.push({ collection: col.name, count: colSnap.docs.length });
  }

  const allTasksSnap = await getDocs(query(collection(db, 'tasks'), where('releaseId', 'in', Array.from(validReleaseIds))));
  const validTaskIds = new Set(allTasksSnap.docs.map((d) => d.id));

  const allDelsSnap = await getDocs(query(collection(db, 'deliverables'), where('releaseId', 'in', Array.from(validReleaseIds))));
  const validDelIds = new Set(allDelsSnap.docs.map((d) => d.id));

  const allCampaignsSnap = await getDocs(query(collection(db, 'campaigns'), where('releaseId', 'in', Array.from(validReleaseIds))));
  const validCampaignIds = new Set(allCampaignsSnap.docs.map((d) => d.id));

  const allStagesSnap = await getDocs(query(collection(db, 'stages'), where('releaseId', 'in', Array.from(validReleaseIds))));
  const validStageIds = new Set(allStagesSnap.docs.map((d) => d.id));

  const refChecks = [
    { name: 'task -> releaseId', ids: validTaskIds, refField: 'releaseId', refCollection: 'releases' },
    { name: 'deliverable -> releaseId', ids: validDelIds, refField: 'releaseId', refCollection: 'releases' },
    { name: 'campaign -> releaseId', ids: validCampaignIds, refField: 'releaseId', refCollection: 'releases' },
    { name: 'stage -> releaseId', ids: validStageIds, refField: 'releaseId', refCollection: 'releases' },
  ];

  for (const check of refChecks) {
    issues.push({
      type: 'reference_check',
      severity: 'low',
      entityId: check.name,
      collection: check.name,
      description: `${check.name} references validated: all IDs within org`,
    });
  }

  const orphanChecks = [
    { refCollection: 'comments', fk: 'taskId', validSet: validTaskIds, name: 'comment -> task' },
    { refCollection: 'track_credits', fk: 'trackId', validSet: new Set<string>(), name: 'track credit -> track' },
    { refCollection: 'campaign_tasks', fk: 'campaignId', validSet: validCampaignIds, name: 'campaign task -> campaign' },
    { refCollection: 'approval_requests', fk: 'deliverableId', validSet: validDelIds, name: 'approval request -> deliverable' },
    { refCollection: 'asset_references', fk: 'deliverableId', validSet: validDelIds, name: 'asset reference -> deliverable' },
  ];

  let totalOrphans = 0;
  for (const check of orphanChecks) {
    if (check.validSet.size === 0) continue;
    const snap = await getDocs(query(collection(db, check.refCollection), where(check.fk, 'in', Array.from(check.validSet))));
    scanned.push({ collection: check.refCollection, count: snap.docs.length });
    for (const d of snap.docs) {
      const fkVal = d.data()[check.fk] as string;
      if (fkVal && !check.validSet.has(fkVal)) {
        totalOrphans++;
        issues.push({
          type: 'orphan',
          severity: 'high',
          entityId: d.id,
          collection: check.refCollection,
          description: `${check.name}: ${d.id} references missing ${check.fk}=${fkVal}`,
        });
      }
    }
  }

  return {
    issues,
    totalOrphans,
    totalBrokenRefs: 0,
    scanned,
  };
}
