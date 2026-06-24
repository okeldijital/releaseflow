export interface ActivityCoverageItem {
  domain: string;
  action: string;
  logged: boolean;
  activityType: string;
  service: string;
  notes?: string;
}

const COVERAGE: ActivityCoverageItem[] = [
  { domain: 'Release', action: 'Created', logged: true, activityType: 'release.created', service: 'releases/new/page.tsx', notes: 'Batch write with activity' },
  { domain: 'Workflow', action: 'Generated', logged: true, activityType: 'workflow.generated', service: 'workflow-service.ts', notes: 'Logged during template generation' },
  { domain: 'Stage', action: 'Started', logged: true, activityType: 'stage.started', service: 'workflow-progression.ts' },
  { domain: 'Stage', action: 'Completed', logged: true, activityType: 'stage.completed', service: 'workflow-progression.ts' },
  { domain: 'Task', action: 'Created', logged: true, activityType: 'task.created', service: 'task-service.ts' },
  { domain: 'Task', action: 'Completed', logged: true, activityType: 'task.completed', service: 'task-service.ts' },
  { domain: 'Task', action: 'Assigned', logged: true, activityType: 'task.assigned', service: 'task-service.ts' },
  { domain: 'Task', action: 'Reassigned', logged: true, activityType: 'task.reassigned', service: 'task-service.ts' },
  { domain: 'Task', action: 'Unassigned', logged: true, activityType: 'task.unassigned', service: 'task-service.ts' },
  { domain: 'Comment', action: 'Added', logged: true, activityType: 'comment.added', service: 'task-service.ts' },
  { domain: 'Deliverable', action: 'Created', logged: true, activityType: 'deliverable.created', service: 'deliverable-service.ts' },
  { domain: 'Deliverable', action: 'Updated', logged: true, activityType: 'deliverable.updated', service: 'deliverable-service.ts' },
  { domain: 'Deliverable', action: 'Approved', logged: true, activityType: 'deliverable.approved', service: 'deliverable-service.ts' },
  { domain: 'Deliverable', action: 'Rejected', logged: true, activityType: 'deliverable.rejected', service: 'deliverable-service.ts' },
  { domain: 'Approval', action: 'Requested', logged: true, activityType: 'approval.requested', service: 'approval-service.ts' },
  { domain: 'Approval', action: 'Approved', logged: true, activityType: 'approval.approved', service: 'approval-service.ts' },
  { domain: 'Approval', action: 'Rejected', logged: true, activityType: 'approval.rejected', service: 'approval-service.ts' },
  { domain: 'Notification', action: 'Created', logged: true, activityType: 'notification.created', service: 'notification-service.ts' },
  { domain: 'Notification', action: 'Read', logged: true, activityType: 'notification.read', service: 'notification-service.ts' },
  { domain: 'Notification', action: 'Archived', logged: true, activityType: 'notification.archived', service: 'notification-service.ts' },
  { domain: 'Campaign', action: 'Created', logged: true, activityType: 'campaign.created', service: 'campaign-service.ts' },
  { domain: 'Campaign', action: 'Activated', logged: true, activityType: 'campaign.activated', service: 'campaign-service.ts' },
  { domain: 'Campaign', action: 'Completed', logged: true, activityType: 'campaign.completed', service: 'campaign-service.ts' },
  { domain: 'Campaign Task', action: 'Created', logged: true, activityType: 'campaign.task.created', service: 'campaign-service.ts' },
  { domain: 'Campaign Task', action: 'Completed', logged: true, activityType: 'campaign.task.completed', service: 'campaign-service.ts' },
  { domain: 'Artist', action: 'Created', logged: false, activityType: '-', service: 'artist-service.ts', notes: 'No activity logged on artist creation' },
  { domain: 'Rights Holder', action: 'Created', logged: false, activityType: '-', service: 'rights-service.ts', notes: 'No activity logged' },
  { domain: 'Budget', action: 'Initialized', logged: false, activityType: '-', service: 'budget-service.ts', notes: 'No activity logged' },
  { domain: 'Cost Item', action: 'Added', logged: false, activityType: '-', service: 'budget-service.ts', notes: 'No activity logged' },
  { domain: 'Resource', action: 'Assigned', logged: false, activityType: '-', service: 'resource-service.ts', notes: 'No activity logged' },
  { domain: 'Release Requirement', action: 'Submitted', logged: false, activityType: '-', service: 'requirement-service.ts', notes: 'No activity logged' },
  { domain: 'Release Requirement', action: 'Approved', logged: false, activityType: '-', service: 'requirement-service.ts', notes: 'No activity logged' },
];

interface AuditGap {
  domain: string;
  action: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

export function auditActivityCoverage(): { coverage: number; logged: number; total: number; gaps: AuditGap[] } {
  const total = COVERAGE.length;
  const logged = COVERAGE.filter((c) => c.logged).length;
  const uncovered = COVERAGE.filter((c) => !c.logged);

  const gaps: AuditGap[] = uncovered.map((c) => ({
    domain: c.domain,
    action: c.action,
    severity: c.domain === 'Artist' || c.domain === 'Budget' ? 'medium' : 'low',
    recommendation: `Add logActivity({ type: '${c.domain.toLowerCase()}.${c.action.toLowerCase()}' }) in ${c.service}`,
  }));

  return {
    coverage: Math.round((logged / total) * 100),
    logged,
    total,
    gaps,
  };
}
