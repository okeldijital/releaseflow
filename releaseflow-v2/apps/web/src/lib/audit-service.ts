import { recordAudit, getAuditByOrg } from './audit-repository';

export async function auditOrganizationAction(
  orgId: string,
  userId: string,
  action: string,
  details?: Record<string, unknown>,
): Promise<string> {
  return recordAudit({
    organizationId: orgId,
    userId,
    action,
    entityType: 'organization',
    entityId: orgId,
    ...(details && { after: details }),
  });
}

export async function auditMemberAction(
  orgId: string,
  userId: string,
  action: string,
  memberId: string,
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null,
): Promise<string> {
  return recordAudit({
    organizationId: orgId,
    userId,
    action,
    entityType: 'membership',
    entityId: memberId,
    before: before ?? null,
    after: after ?? null,
  });
}

export async function auditSettingsChange(
  orgId: string,
  userId: string,
  key: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Promise<string> {
  return recordAudit({
    organizationId: orgId,
    userId,
    action: 'settings.update',
    entityType: 'settings',
    entityId: key,
    before,
    after,
  });
}

export async function getOrganizationAuditLog(orgId: string, limit?: number) {
  return getAuditByOrg(orgId, limit);
}
