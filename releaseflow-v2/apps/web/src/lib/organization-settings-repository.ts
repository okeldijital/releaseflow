import { doc, getDoc, setDoc, updateDoc, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';

export interface OrganizationSettingsRecord {
  id: string;
  orgId: string;
  name: string;
  logoUrl?: string | null;
  brandColor?: string | null;
  timezone: string;
  defaultLanguage: string;
  label?: string | null;
  distributionDefaults?: { channel?: string; releaseDate?: string } | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CreateOrganizationSettingsFields {
  orgId: string;
  name: string;
  logoUrl?: string | null;
  brandColor?: string | null;
  timezone?: string;
  defaultLanguage?: string;
  label?: string | null;
  distributionDefaults?: { channel?: string; releaseDate?: string } | null;
}

export interface UpdateOrganizationSettingsFields {
  name?: string;
  logoUrl?: string | null;
  brandColor?: string | null;
  timezone?: string;
  defaultLanguage?: string;
  label?: string | null;
  distributionDefaults?: { channel?: string; releaseDate?: string } | null;
}

export async function getOrganizationSettings(orgId: string): Promise<OrganizationSettingsRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'organization_settings', orgId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as OrganizationSettingsRecord;
}

export async function createOrganizationSettings(fields: CreateOrganizationSettingsFields): Promise<OrganizationSettingsRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const record: Omit<OrganizationSettingsRecord, 'id'> = {
    orgId: fields.orgId,
    name: fields.name,
    logoUrl: fields.logoUrl ?? null,
    brandColor: fields.brandColor ?? null,
    timezone: fields.timezone ?? 'UTC',
    defaultLanguage: fields.defaultLanguage ?? 'en-US',
    label: fields.label ?? null,
    distributionDefaults: fields.distributionDefaults ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'organization_settings', fields.orgId), record);
  return { id: fields.orgId, ...record };
}

export async function updateOrganizationSettings(orgId: string, fields: UpdateOrganizationSettingsFields): Promise<void> {
  const db = getDb();
  if (!db) return;
  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.logoUrl !== undefined) update.logoUrl = fields.logoUrl;
  if (fields.brandColor !== undefined) update.brandColor = fields.brandColor;
  if (fields.timezone !== undefined) update.timezone = fields.timezone;
  if (fields.defaultLanguage !== undefined) update.defaultLanguage = fields.defaultLanguage;
  if (fields.label !== undefined) update.label = fields.label;
  if (fields.distributionDefaults !== undefined) update.distributionDefaults = fields.distributionDefaults;
  await updateDoc(doc(db, 'organization_settings', orgId), update);
}
