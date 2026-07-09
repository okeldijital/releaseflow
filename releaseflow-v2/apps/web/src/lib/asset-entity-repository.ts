import {
  collection, query, where, orderBy, getDocs, getDoc, doc, addDoc, updateDoc, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export type AssetType = 'audio' | 'artwork' | 'video' | 'document' | 'other';
export type AssetStatus = 'active' | 'archived';

export interface AssetRecord {
  id: string;
  organizationId: string;
  releaseId?: string | null;
  name: string;
  type: AssetType;
  url: string;
  filename: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  metadata?: Record<string, unknown> | null;
  status: AssetStatus;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CreateAssetFields {
  organizationId: string;
  releaseId?: string | null;
  name: string;
  type: AssetType;
  url: string;
  filename: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateAssetFields {
  name?: string;
  type?: AssetType;
  releaseId?: string | null;
  status?: AssetStatus;
  metadata?: Record<string, unknown> | null;
}

export async function createAsset(fields: CreateAssetFields): Promise<AssetRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'assets'), {
    ...fields,
    releaseId: fields.releaseId ?? null,
    contentType: fields.contentType ?? null,
    sizeBytes: fields.sizeBytes ?? null,
    metadata: fields.metadata ?? null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: ref.id,
    organizationId: fields.organizationId,
    releaseId: fields.releaseId ?? null,
    name: fields.name,
    type: fields.type,
    url: fields.url,
    filename: fields.filename,
    contentType: fields.contentType ?? null,
    sizeBytes: fields.sizeBytes ?? null,
    metadata: fields.metadata ?? null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateAsset(assetId: string, fields: UpdateAssetFields): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assets', assetId), { ...fields, updatedAt: Timestamp.now() });
}

export async function getAsset(assetId: string): Promise<AssetRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'assets', assetId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AssetRecord;
}

export async function getAssetsByOrg(orgId: string): Promise<AssetRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'assets'),
      where('organizationId', '==', orgId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AssetRecord);
}

export async function archiveAsset(assetId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assets', assetId), { status: 'archived', updatedAt: Timestamp.now() });
}
