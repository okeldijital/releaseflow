import { collection, query, where, getDocs, orderBy } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { checkDependencyRules } from '@/lib/dependency-health';
import type { Task, Stage, Deliverable, ReleaseRequirement, Campaign, ReleaseBudget, Dependency } from '@/app/(app)/types';

export interface RuleFinding {
  releaseId: string;
  rule: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  entityType: string;
  entityId: string;
}

function toDate(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === 'object' && ts !== null) {
    const obj = ts as Record<string, unknown>;
    if (typeof obj.toDate === 'function') return (obj as { toDate: () => Date }).toDate();
    if (typeof obj.seconds === 'number') return new Date((obj as { seconds: number }).seconds * 1000);
  }
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

export async function runRules(releaseId: string): Promise<RuleFinding[]> {
  const db = getDb();
  if (!db) return [];
  const findings: RuleFinding[] = [];

  const [taskSnap, stageSnap, delSnap, reqSnap, campaignSnap, budgetSnap, depSnap] = await Promise.all([
    getDocs(query(collection(db, 'tasks'), where('releaseId', '==', releaseId), where('status', '!=', 'done'))),
    getDocs(query(collection(db, 'stages'), where('releaseId', '==', releaseId))),
    getDocs(query(collection(db, 'deliverables'), where('releaseId', '==', releaseId))),
    getDocs(query(collection(db, 'release_requirements'), where('releaseId', '==', releaseId))),
    getDocs(query(collection(db, 'campaigns'), where('releaseId', '==', releaseId))),
    getDocs(query(collection(db, 'release_budgets'), where('releaseId', '==', releaseId), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'dependencies'), where('releaseId', '==', releaseId))),
  ]);

  const now = new Date();

  const tasks = taskSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
  const stages = stageSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Stage);
  const dels = delSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deliverable);
  const reqs = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseRequirement);
  const campaigns = campaignSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Campaign);
  const budgetDocs = budgetSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseBudget);

  for (const t of tasks) {
    if (t.dueDate) {
      const due = toDate(t.dueDate);
      if (due && due < now) {
        findings.push({ releaseId, rule: 'overdue_task', priority: 'high', message: `Overdue task: ${t.title}`, entityType: 'task', entityId: t.id });
      }
    }
  }

  for (const s of stages) {
    if (s.status === 'blocked') {
      findings.push({ releaseId, rule: 'blocked_stage', priority: 'high', message: `Blocked stage: ${s.name}`, entityType: 'stage', entityId: s.id });
    }
  }

  const notApproved = dels.filter((d) => d.status !== 'approved' && d.status !== 'archived');
  if (notApproved.length > 0 && stages.length > 0 && tasks.length > 0) {
    findings.push({ releaseId, rule: 'missing_deliverables', priority: 'medium', message: `${notApproved.length} deliverable(s) not approved`, entityType: 'deliverable', entityId: releaseId });
  }

  const unapprovedReqs = reqs.filter((r) => r.status !== 'approved');
  if (unapprovedReqs.length > 0 && reqs.length > 0) {
    findings.push({ releaseId, rule: 'incomplete_requirements', priority: 'medium', message: `${unapprovedReqs.length}/${reqs.length} requirements not approved`, entityType: 'requirement', entityId: releaseId });
  }

  const budgetDoc = budgetDocs[0];
  if (budgetDoc && (budgetDoc.status === 'over_budget' || budgetDoc.status === 'at_risk')) {
    findings.push({ releaseId, rule: 'budget_risk', priority: budgetDoc.status === 'over_budget' ? 'high' : 'medium', message: `Budget ${budgetDoc.status.replace(/_/g, ' ')}: $${budgetDoc.actualCost} / $${budgetDoc.plannedBudget}`, entityType: 'budget', entityId: budgetDoc.id });
  }

  for (const c of campaigns) {
    if (c.status === 'active') {
      const cTasksSnap = await getDocs(query(collection(db, 'campaign_tasks'), where('campaignId', '==', c.id), where('status', '!=', 'done')));
      if (!cTasksSnap.empty) {
        findings.push({ releaseId, rule: 'campaign_risk', priority: 'low', message: `Campaign "${c.name}" has incomplete tasks`, entityType: 'campaign', entityId: c.id });
      }
    }
  }

  const dependencies = depSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Dependency);
  const depFindings = checkDependencyRules(releaseId, dependencies);
  findings.push(...depFindings);

  return findings;
}

export async function runOrgRules(orgId: string): Promise<RuleFinding[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'releases'), where('organizationId', '==', orgId)));
  const ids = snap.docs.map((d) => d.id);
  const all: RuleFinding[] = [];
  for (const rid of ids) {
    const findings = await runRules(rid);
    all.push(...findings);
  }
  return all;
}
