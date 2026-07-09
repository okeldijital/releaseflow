import { doc, getDoc, setDoc, updateDoc, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';

export interface OrganizationPreferencesRecord {
  id: string;
  orgId: string;
  defaultReleaseType: string;
  defaultSpecTemplates: string[];
  namingConvention?: string | null;
  defaultDueDateOffset: number;
  defaultApprovalChain: string[];
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CreateOrganizationPreferencesFields {
  orgId: string;
  defaultReleaseType?: string;
  defaultSpecTemplates?: string[];
  namingConvention?: string | null;
  defaultDueDateOffset?: number;
  defaultApprovalChain?: string[];
}

export interface UpdateOrganizationPreferencesFields {
  defaultReleaseType?: string;
  defaultSpecTemplates?: string[];
  namingConvention?: string | null;
  defaultDueDateOffset?: number;
  defaultApprovalChain?: string[];
}

export async function getOrganizationPreferences(orgId: string): Promise<OrganizationPreferencesRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'organization_preferences', orgId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as OrganizationPreferencesRecord;
}

export async function createOrganizationPreferences(fields: CreateOrganizationPreferencesFields): Promise<OrganizationPreferencesRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const record: Omit<OrganizationPreferencesRecord, 'id'> = {
    orgId: fields.orgId,
    defaultReleaseType: fields.defaultReleaseType ?? 'single',
    defaultSpecTemplates: fields.defaultSpecTemplates ?? ['mastering'],
    namingConvention: fields.namingConvention ?? null,
    defaultDueDateOffset: fields.defaultDueDateOffset ?? 14,
    defaultApprovalChain: fields.defaultApprovalChain ?? [],
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'organization_preferences', fields.orgId), record);
  return { id: fields.orgId, ...record };
}

export async function updateOrganizationPreferences(orgId: string, fields: UpdateOrganizationPreferencesFields): Promise<void> {
  const db = getDb();
  if (!db) return;
  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.defaultReleaseType !== undefined) update.defaultReleaseType = fields.defaultReleaseType;
  if (fields.defaultSpecTemplates !== undefined) update.defaultSpecTemplates = fields.defaultSpecTemplates;
  if (fields.namingConvention !== undefined) update.namingConvention = fields.namingConvention;
  if (fields.defaultDueDateOffset !== undefined) update.defaultDueDateOffset = fields.defaultDueDateOffset;
  if (fields.defaultApprovalChain !== undefined) update.defaultApprovalChain = fields.defaultApprovalChain;
  await updateDoc(doc(db, 'organization_preferences', orgId), update);
}
