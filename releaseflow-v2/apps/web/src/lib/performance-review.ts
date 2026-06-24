interface QueryPattern {
  collection: string;
  filters: string[];
  order: string[];
  frequency: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface FirestoreIndex {
  collection: string;
  fields: string[];
  reason: string;
  suggested: boolean;
}

export interface PerformanceReport {
  queries: QueryPattern[];
  suggestedIndexes: FirestoreIndex[];
  collectionGrowth: string[];
  recommendations: string[];
}

export function reviewPerformance(): PerformanceReport {
  const queries: QueryPattern[] = [
    { collection: 'releases', filters: ['organizationId'], order: ['createdAt'], frequency: 'high', recommendation: 'Already has implicit ordering. Index: organizationId + createdAt desc' },
    { collection: 'tasks', filters: ['releaseId', 'status'], order: ['createdAt'], frequency: 'high', recommendation: 'Composite index: releaseId + status + createdAt' },
    { collection: 'tasks', filters: ['stageId'], order: ['createdAt'], frequency: 'high', recommendation: 'Composite index: stageId + createdAt' },
    { collection: 'tasks', filters: ['assigneeId', 'status'], order: ['status', 'priority', 'createdAt'], frequency: 'medium', recommendation: 'Composite index with multiple order fields. Split into separate queries or add composite index' },
    { collection: 'stages', filters: ['releaseId'], order: [], frequency: 'medium', recommendation: 'Index on releaseId'},
    { collection: 'stages', filters: ['workflowId'], order: ['order'], frequency: 'high', recommendation: 'Composite index: workflowId + order'},
    { collection: 'deliverables', filters: ['releaseId'], order: ['createdAt'], frequency: 'high', recommendation: 'Composite index: releaseId + createdAt' },
    { collection: 'campaigns', filters: ['releaseId'], order: ['createdAt'], frequency: 'medium', recommendation: 'Composite index: releaseId + createdAt' },
    { collection: 'operational_alerts', filters: ['releaseId', 'resolved'], order: ['priority', 'createdAt'], frequency: 'medium', recommendation: 'Composite index: releaseId + resolved + priority + createdAt' },
    { collection: 'activities', filters: [], order: ['createdAt'], frequency: 'medium', recommendation: 'Consider composite index for querying by releaseId + createdAt for audit trails' },
    { collection: 'notifications', filters: ['userId', 'read', 'archived'], order: ['createdAt'], frequency: 'high', recommendation: 'Composite index: userId + read + archived + createdAt' },
  ];

  const suggestedIndexes: FirestoreIndex[] = [
    { collection: 'tasks', fields: ['releaseId', 'status', 'createdAt', 'desc'], reason: 'Frequent query pattern for dashboard', suggested: true },
    { collection: 'tasks', fields: ['stageId', 'createdAt', 'asc'], reason: 'Stage task listing', suggested: true },
    { collection: 'stages', fields: ['workflowId', 'order', 'asc'], reason: 'Workflow stage ordering', suggested: true },
    { collection: 'deliverables', fields: ['releaseId', 'createdAt', 'desc'], reason: 'Deliverable listing', suggested: true },
    { collection: 'notifications', fields: ['userId', 'read', 'archived', 'createdAt', 'desc'], reason: 'Notification feed', suggested: true },
    { collection: 'operational_alerts', fields: ['releaseId', 'resolved', 'priority', 'desc', 'createdAt', 'desc'], reason: 'Alert dashboard', suggested: true },
    { collection: 'activities', fields: ['releaseId', 'createdAt', 'desc'], reason: 'Activity feed per release', suggested: true },
    { collection: 'campaigns', fields: ['releaseId', 'createdAt', 'desc'], reason: 'Campaign listing', suggested: true },
    { collection: 'release_requirements', fields: ['releaseId', 'createdAt', 'asc'], reason: 'Requirement listing', suggested: true },
    { collection: 'cost_items', fields: ['releaseId', 'createdAt', 'desc'], reason: 'Budget cost tracking', suggested: true },
    { collection: 'release_ownerships', fields: ['releaseId'], reason: 'Ownership lookup', suggested: true },
    { collection: 'resource_assignments', fields: ['userId'], reason: 'Resource utilization', suggested: true },
    { collection: 'approval_requests', fields: ['approverId', 'status', 'createdAt', 'desc'], reason: 'Pending approval listing', suggested: true },
    { collection: 'campaign_tasks', fields: ['campaignId', 'createdAt', 'asc'], reason: 'Campaign task listing', suggested: true },
    { collection: 'comments', fields: ['taskId', 'createdAt', 'asc'], reason: 'Comment thread', suggested: true },
    { collection: 'track_credits', fields: ['trackId'], reason: 'Credit lookup', suggested: true },
    { collection: 'release_artists', fields: ['releaseId'], reason: 'Artist linkage', suggested: true },
  ];

  const collectionGrowth: string[] = [
    'activities — grows linearly with every action (fastest growing)',
    'operational_alerts — grows per rule evaluation (medium growth, periodic cleanup needed)',
    'notifications — grows per event (medium growth, archive old)',
    'tasks, deliverables, comments — grows per release (steady)',
    'releases, campaigns, budgets — grows per project (slow)',
    'Suggestion: Add TTL or archiving policy for activities older than 90 days',
  ];

  const recommendations: string[] = [
    'Use Firestore composite indexes defined above to avoid index errors on compound queries',
    'Consider paginating tasks/activities using cursor-based pagination (startAfter)',
    'Add a cleanup job to archive resolved alerts older than 30 days',
    'Add a "search_releases" index for free-text title search if needed',
    'Consider denormalizing release title into tasks/deliverables for cheaper reads',
    'Monitor query count — each org scan loop (for loop over releaseIds) generates N queries',
    'Recommended: Use collection group queries instead of per-release loops where possible',
    'Use Firestore Bundles for read-heavy dashboards (brief, budgets) to reduce costs',
  ];

  return {
    queries,
    suggestedIndexes,
    collectionGrowth,
    recommendations,
  };
}
