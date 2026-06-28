import { getReleasesByOrganization } from './release-repository';
import { getWorkflow, getStages } from './workflow-repository';
import { getReleasesByStatus } from './release-repository';
import type { ReleaseRecord } from './release-repository';
import type { WorkflowRecord, StageRecord } from './workflow-repository';

export interface AlertItem {
  id: string;
  releaseId: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  entityType: string;
  entityId: string;
  rule: string;
  createdAt: unknown;
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
}

function ageLabel(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return `${Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))}h`;
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

export async function fetchOperationsData(orgId: string): Promise<OperationsData> {
  const releases = await getReleasesByOrganization(orgId);
  const activeReleases = releases.filter((r) => r.status !== 'archived' && r.status !== 'cancelled');

  const alerts: AlertItem[] = [];
  const blockedItems: BlockedItem[] = [];
  const deadlines: DeadlineItem[] = [];
  const activities: ActivityItem[] = [];

  let blockedReleaseCount = 0;
  let overBudgetCount = 0;
  let campaignsActiveCount = 0;

  for (const release of activeReleases) {
    const workflow = await getWorkflow(release.id);
    if (!workflow) continue;

    const stages = await getStages(workflow.id);

    const blockedStages = stages.filter((s) => s.status === 'blocked');
    if (blockedStages.length > 0) {
      blockedReleaseCount++;
      for (const s of blockedStages) {
        blockedItems.push({
          id: s.id,
          releaseId: release.id,
          name: s.name,
          type: 'stage',
          owner: s.assignedRole ?? undefined,
          age: ageLabel((s.startedAt as Date) ?? new Date()),
          status: 'blocked',
        });
      }
    }
  }

  return {
    alerts,
    blockedItems,
    deadlines,
    pulseMetrics: {
      activeReleases: activeReleases.length,
      blockedReleases: blockedReleaseCount,
      overBudget: overBudgetCount,
      campaignsActive: campaignsActiveCount,
    },
    activities,
  };
}
