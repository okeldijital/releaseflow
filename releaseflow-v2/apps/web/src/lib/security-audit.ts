interface SecurityRule {
  collection: string;
  rule: string;
  description: string;
  status: 'defined' | 'partial' | 'missing';
  risk: 'critical' | 'high' | 'medium' | 'low';
}

interface AuditReport {
  rules: SecurityRule[];
  summary: { total: number; defined: number; critical: number; high: number };
  recommendations: string[];
}

export function auditSecurityRules(): AuditReport {
  const rules: SecurityRule[] = [
    { collection: 'organizations', rule: 'ownerId check', description: 'Only creator can update/delete org', status: 'defined', risk: 'high' },
    { collection: 'memberships', rule: 'userId match', description: 'Users can only manage their own membership', status: 'defined', risk: 'high' },
    { collection: 'releases', rule: 'createdBy + org membership', description: 'Org members can read, creator can write', status: 'defined', risk: 'critical' },
    { collection: 'workflows', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'medium' },
    { collection: 'stages', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'medium' },
    { collection: 'tasks', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'medium' },
    { collection: 'deliverables', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'medium' },
    { collection: 'release_requirements', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'medium' },
    { collection: 'campaigns', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'medium' },
    { collection: 'campaign_tasks', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'medium' },
    { collection: 'budgets', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'medium' },
    { collection: 'cost_items', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'medium' },
    { collection: 'resource_assignments', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'medium' },
    { collection: 'activities', rule: 'actorId match', description: 'Only the actor can create activities', status: 'defined', risk: 'medium' },
    { collection: 'notifications', rule: 'userId match', description: 'Users can only read/write their own', status: 'defined', risk: 'medium' },
    { collection: 'artists', rule: 'auth only', description: 'Any authenticated user can CRUD', status: 'defined', risk: 'low' },
    { collection: 'rights_holders', rule: 'auth only', description: 'Any authenticated user can CRUD', status: 'defined', risk: 'low' },
    { collection: 'tracks', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'low' },
    { collection: 'contributors', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'low' },
    { collection: 'track_credits', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'low' },
    { collection: 'release_artists', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'low' },
    { collection: 'release_ownerships', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'low' },
    { collection: 'track_ownerships', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'low' },
    { collection: 'asset_references', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'low' },
    { collection: 'approval_requests', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'low' },
    { collection: 'distribution_packages', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'low' },
    { collection: 'operational_alerts', rule: 'auth only', description: 'Any auth user can read', status: 'defined', risk: 'low' },
    { collection: 'comments', rule: 'wildcard match', description: 'Auth required, release-scoped write', status: 'partial', risk: 'low' },
  ];

  const defined = rules.filter((r) => r.status === 'defined').length;
  const total = rules.length;
  const critical = rules.filter((r) => r.status !== 'defined' && r.risk === 'critical').length;
  const high = rules.filter((r) => r.status !== 'defined' && r.risk === 'high').length;

  return {
    rules,
    summary: { total, defined, critical, high },
    recommendations: [
      'Deploy firestore.rules via Firebase CLI: firebase deploy --only firestore:rules',
      'Add per-collection rules for the 18 "partial" collections using release-scoped data',
      'Test rules with Firebase Emulator before deploying to production',
      'Add rate limiting for write-heavy collections (activities, operational_alerts)',
      'Consider using Firestore Security Rules simulator to validate edge cases',
    ],
  };
}
