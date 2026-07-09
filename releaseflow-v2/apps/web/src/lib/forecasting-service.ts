import type { Task } from '@/app/(app)/types';
import type { ApprovalRequest } from '@/app/(app)/types';

export interface ForecastResult {
  expectedCompletionDate: string | null;
  riskOfMissingRelease: number;
  outstandingWorkload: number;
  capacityUtilisation: number;
  recommendations: string[];
}

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value
  ) {
    const ts = value as { seconds: number };
    return new Date(ts.seconds * 1000);
  }
  return null;
}

async function getTaskCompletionDays(): Promise<number> {
  try {
    const { getDb } = await import('./firebase');
    const { collection, query, where, getDocs } = await import(
      '@firebase/firestore'
    );
    const db = getDb();
    if (!db) return 3;

    const snap = await getDocs(
      query(
        collection(db, 'tasks'),
        where('status', '==', 'done'),
      ),
    );

    if (snap.empty) return 3;

    let totalDays = 0;
    let count = 0;
    for (const d of snap.docs) {
      const data = d.data();
      const createdAt = safeDate(data.createdAt);
      const updatedAt = safeDate(data.updatedAt);
      if (createdAt && updatedAt) {
        const diff = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (diff > 0) {
          totalDays += diff;
          count++;
        }
      }
    }
    return count > 0 ? totalDays / count : 3;
  } catch {
    return 3;
  }
}

export async function computeReleaseForecast(
  releaseId: string,
  _orgId: string,
): Promise<ForecastResult> {
  let tasks: Task[] = [];
  let approvalRequests: ApprovalRequest[] = [];
  let avgTaskDays = 3;

  try {
    const { getDb } = await import('./firebase');
    const { collection, query, where, getDocs } = await import(
      '@firebase/firestore'
    );
    const db = getDb();
    if (db) {
      const [tasksSnap, approvalsSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, 'tasks'),
            where('releaseId', '==', releaseId),
          ),
        ),
        getDocs(
          query(
            collection(db, 'approval_requests'),
            where('releaseId', '==', releaseId),
          ),
        ),
        getTaskCompletionDays(),
      ]);

      avgTaskDays = await getTaskCompletionDays();
      tasks = tasksSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Task,
      );
      approvalRequests = approvalsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as ApprovalRequest,
      );
    }
  } catch {
    // tasks and approvals remain empty
  }

  const recommendations: string[] = [];
  const totalTasks = tasks.length;

  const incompleteTasks = tasks.filter(
    (t) => t.status !== 'done',
  );
  const outstandingWorkload = incompleteTasks.length;

  const overdueTasks = incompleteTasks.filter((t) => {
    const dueDate = safeDate(t.dueDate);
    return dueDate && dueDate < new Date();
  }).length;

  const pendingApprovals = approvalRequests.filter(
    (a) =>
      a.lifecycleState === 'requested' ||
      a.lifecycleState === 'under_review',
  ).length;

  const risk = totalTasks > 0
    ? Math.round(((overdueTasks + pendingApprovals) / totalTasks) * 100)
    : 0;
  const riskOfMissingRelease = Math.min(100, risk);

  const assignedPeople = new Set(
    incompleteTasks
      .map((t) => t.assigneeId)
      .filter((id): id is string => !!id),
  ).size;
  const capacityUtilisation = totalTasks > 0
    ? Math.round((assignedPeople / totalTasks) * 100)
    : 0;

  let expectedCompletionDate: string | null = null;
  if (outstandingWorkload > 0) {
    const estimatedDays = outstandingWorkload * avgTaskDays;
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + estimatedDays);
    expectedCompletionDate = estDate.toISOString();
  }

  if (overdueTasks > 0) {
    recommendations.push(
      `${overdueTasks} overdue tasks require immediate attention`,
    );
  }
  if (pendingApprovals > 0) {
    recommendations.push(
      `${pendingApprovals} approvals are still pending`,
    );
  }
  if (riskOfMissingRelease >= 50) {
    recommendations.push(
      'High risk of missing the release deadline — consider adjusting scope or schedule',
    );
  }
  if (capacityUtilisation < 20 && outstandingWorkload > 5) {
    recommendations.push(
      'Low capacity utilisation — consider assigning more team members to tasks',
    );
  }
  if (outstandingWorkload === 0 && totalTasks > 0) {
    recommendations.push('All tasks completed — release is on track');
  }

  return {
    expectedCompletionDate,
    riskOfMissingRelease,
    outstandingWorkload,
    capacityUtilisation,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ['No specific recommendations — release appears on track'],
  };
}

export async function computeOrganizationForecast(
  orgId: string,
): Promise<ForecastResult[]> {
  try {
    const { getReleasesByOrganization } = await import(
      './release-repository'
    );
    const activeStatuses: string[] = [
      'draft',
      'planning',
      'in_production',
      'ready_for_distribution',
      'on_hold',
    ];
    const allReleases = await getReleasesByOrganization(orgId);
    const activeReleases = allReleases.filter((r) =>
      activeStatuses.includes(r.status as string),
    );

    const forecasts = await Promise.all(
      activeReleases.map((r) =>
        computeReleaseForecast(r.id, orgId),
      ),
    );

    return forecasts;
  } catch {
    return [];
  }
}
