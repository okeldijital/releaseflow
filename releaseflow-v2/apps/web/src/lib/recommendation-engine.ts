import { collection, query, where, getDocs, orderBy, limit } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { Release, Stage, Task, Deliverable, ReleaseRequirement, Campaign, ReleaseBudget } from '@/app/(app)/types';

export interface Recommendation {
  releaseId: string;
  message: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export async function generateRecommendations(orgId: string): Promise<Recommendation[]> {
  const db = getDb();
  if (!db) return [];

  const snap = await getDocs(
    query(collection(db, 'releases'), where('organizationId', '==', orgId), where('status', '!=', 'archived')),
  );
  const releases = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Release);

  const recs: Recommendation[] = [];

  for (const r of releases) {
    const [stages, tasks, delSnap, reqs, camps, budgetSnap] = await Promise.all([
      getDocs(query(collection(db, 'stages'), where('releaseId', '==', r.id))),
      getDocs(query(collection(db, 'tasks'), where('releaseId', '==', r.id), where('status', '!=', 'done'))),
      getDocs(query(collection(db, 'deliverables'), where('releaseId', '==', r.id))),
      getDocs(query(collection(db, 'release_requirements'), where('releaseId', '==', r.id))),
      getDocs(query(collection(db, 'campaigns'), where('releaseId', '==', r.id))),
      getDocs(query(collection(db, 'release_budgets'), where('releaseId', '==', r.id), orderBy('createdAt', 'desc'), limit(1))),
    ]);

    const stageList = stages.docs.map((d) => ({ id: d.id, ...d.data() }) as Stage);
    const taskList = tasks.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
    const delList = delSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deliverable);
    const reqList = reqs.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseRequirement);
    const campList = camps.docs.map((d) => ({ id: d.id, ...d.data() }) as Campaign);

    const inProgressStages = stageList.filter((s) => s.status === 'in_progress');
    for (const s of inProgressStages) {
      if (s.assignedRole) {
        const assignedTasks = taskList.filter((t) => t.stageId === s.id && t.assigneeId);
        if (assignedTasks.length === 0) {
          recs.push({ releaseId: r.id, message: `No tasks assigned in "${s.name}"`, action: `Assign ${s.assignedRole.replace(/_/g, ' ')}`, priority: 'high' });
        }
      }
    }

    const unapprovedDels = delList.filter((d) => d.status !== 'approved' && d.status !== 'archived');
    if (unapprovedDels.length > 0) {
      for (const d of unapprovedDels) {
        recs.push({ releaseId: r.id, message: `Deliverable "${d.title}" needs approval`, action: 'Approve Deliverable', priority: 'medium' });
      }
    }

    const unapprovedReqs = reqList.filter((rq) => rq.status !== 'approved');
    if (unapprovedReqs.length > 0 && unapprovedReqs.length <= 3) {
      for (const rq of unapprovedReqs) {
        recs.push({ releaseId: r.id, message: `Requirement "${rq.name}" not approved`, action: 'Complete Metadata', priority: 'low' });
      }
    }

    if (!r.upc || !r.catalogNumber || !r.genre) {
      recs.push({ releaseId: r.id, message: 'Release metadata incomplete', action: 'Complete Metadata', priority: 'medium' });
    }

    const activeCampaigns = campList.filter((c) => c.status === 'draft');
    for (const c of activeCampaigns) {
      recs.push({ releaseId: r.id, message: `Campaign "${c.name}" is still in draft`, action: 'Launch Campaign', priority: 'low' });
    }

    const budgetDocs = budgetSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseBudget);
    if (budgetDocs[0] && budgetDocs[0].status === 'at_risk') {
      recs.push({ releaseId: r.id, message: `Budget at risk for "${r.title}"`, action: 'Review Budget', priority: 'medium' });
    }
  }

  return recs.slice(0, 10);
}
