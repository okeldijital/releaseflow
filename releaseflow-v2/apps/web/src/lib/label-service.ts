import {
  getLabelsByOrganization,
  createLabel,
  deleteLabel,
} from './label-repository';
import type { LabelRecord } from './label-repository';

export type { LabelRecord } from './label-repository';

export async function fetchLabelsByOrg(orgId: string): Promise<LabelRecord[]> {
  return getLabelsByOrganization(orgId);
}

export async function createNewLabel(fields: { name: string; organizationId: string }): Promise<LabelRecord> {
  if (!fields.name.trim()) throw new Error('Label name is required');
  return createLabel(fields);
}

export async function removeLabel(labelId: string, orgId: string): Promise<void> {
  return deleteLabel(labelId, orgId);
}
