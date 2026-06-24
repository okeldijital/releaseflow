export interface PermissionCheck {
  route: string;
  action: string;
  orgScoped: boolean;
  roleCheck: boolean;
  notes?: string;
}

const ROUTES: PermissionCheck[] = [
  { route: '/releases', action: 'list', orgScoped: true, roleCheck: true, notes: 'Queries by activeOrgId' },
  { route: '/releases/new', action: 'create', orgScoped: true, roleCheck: true, notes: 'Saves organizationId from activeOrgId' },
  { route: '/releases/[id]', action: 'read/write', orgScoped: false, roleCheck: false, notes: 'Reads release by id, no org check' },
  { route: '/releases/[id]/edit', action: 'update', orgScoped: false, roleCheck: false, notes: 'Updates release by id, no org check' },
  { route: '/tasks', action: 'create/complete', orgScoped: false, roleCheck: false, notes: 'Tasks scoped to release, not org' },
  { route: '/deliverables', action: 'CRUD', orgScoped: false, roleCheck: false, notes: 'Scoped to release/stage' },
  { route: '/organizations', action: 'CRUD', orgScoped: true, roleCheck: true, notes: 'Queries by user membership' },
  { route: '/campaigns', action: 'CRUD', orgScoped: true, roleCheck: true, notes: 'Queries by organization releases' },
  { route: '/artists', action: 'CRUD', orgScoped: false, roleCheck: false, notes: 'Global artist list' },
  { route: '/contributor', action: 'read', orgScoped: false, roleCheck: true, notes: 'Scoped to current user' },
  { route: '/brief', action: 'read', orgScoped: true, roleCheck: true, notes: 'Queries by activeOrgId' },
  { route: '/budgets', action: 'read', orgScoped: true, roleCheck: true, notes: 'Queries by organization releases' },
  { route: '/rights-holders', action: 'CRUD', orgScoped: false, roleCheck: false, notes: 'Global rights holder list' },
];

interface AuditGap {
  route: string;
  severity: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
}

export function auditPermissions(): { coverage: number; gaps: AuditGap[] } {
  const total = ROUTES.length;
  const missing = ROUTES.filter((r) => !r.orgScoped && !r.roleCheck).length;

  const gaps: AuditGap[] = [];

  const unScoped = ROUTES.filter((r) => !r.orgScoped);
  for (const r of unScoped) {
    gaps.push({
      route: r.route,
      severity: r.route.includes('releases') ? 'high' : 'medium',
      issue: `No organization scope check on ${r.action}`,
      recommendation: `Add org membership verification or use activeOrgId to filter results`,
    });
  }

  return {
    coverage: Math.round(((total - missing) / total) * 100),
    gaps,
  };
}

export function getAuditReport(): { routes: PermissionCheck[]; summary: { total: number; orgScoped: number; roleChecked: number; coverage: number } } {
  return {
    routes: ROUTES,
    summary: {
      total: ROUTES.length,
      orgScoped: ROUTES.filter((r) => r.orgScoped).length,
      roleChecked: ROUTES.filter((r) => r.roleCheck).length,
      coverage: Math.round((ROUTES.filter((r) => r.orgScoped).length / ROUTES.length) * 100),
    },
  };
}
