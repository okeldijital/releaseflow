/**
 * BUILD-301E — Storage Policy repository.
 * Path: organizations/{organizationId}/storage_policies/{policyId}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  type Firestore,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { AssetType } from '@/lib/asset-entity-repository';
import type {
  CreateStoragePolicyInput,
  StoragePolicyRecord,
  UpdateStoragePolicyInput,
} from './storage-policy-types';

const SUB = 'storage_policies';

function col(db: Firestore, organizationId: string) {
  return collection(db, 'organizations', organizationId, SUB);
}

function ref(db: Firestore, organizationId: string, id: string) {
  return doc(db, 'organizations', organizationId, SUB, id);
}

function toRecord(
  id: string,
  organizationId: string,
  data: Record<string, unknown>,
): StoragePolicyRecord {
  return {
    id,
    organizationId,
    name: String(data.name ?? ''),
    assetType: data.assetType as AssetType,
    storageLocationId: String(data.storageLocationId ?? ''),
    folderTemplateId: String(data.folderTemplateId ?? ''),
    versioningEnabled: Boolean(data.versioningEnabled),
    autoCreateFolders: Boolean(data.autoCreateFolders),
    active: data.active !== false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function listStoragePolicies(
  organizationId: string,
): Promise<StoragePolicyRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(col(db, organizationId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) =>
    toRecord(d.id, organizationId, d.data() as Record<string, unknown>),
  );
}

export async function getStoragePolicy(
  organizationId: string,
  id: string,
): Promise<StoragePolicyRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(ref(db, organizationId, id));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (data.organizationId && data.organizationId !== organizationId) {
    return null;
  }
  return toRecord(snap.id, organizationId, data);
}

/**
 * Find active policies for org + assetType.
 * Caller must treat length > 1 as configuration error.
 */
export async function listActiveStoragePoliciesForAssetType(
  organizationId: string,
  assetType: AssetType,
): Promise<StoragePolicyRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      col(db, organizationId),
      where('assetType', '==', assetType),
      where('active', '==', true),
    ),
  );
  return snap.docs
    .map((d) =>
      toRecord(d.id, organizationId, d.data() as Record<string, unknown>),
    )
    .filter((p) => p.organizationId === organizationId);
}

export async function createStoragePolicy(
  organizationId: string,
  input: CreateStoragePolicyInput,
): Promise<StoragePolicyRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const payload = {
    organizationId,
    name: input.name.trim(),
    assetType: input.assetType,
    storageLocationId: input.storageLocationId,
    folderTemplateId: input.folderTemplateId,
    versioningEnabled: Boolean(input.versioningEnabled),
    autoCreateFolders: Boolean(input.autoCreateFolders),
    active: input.active !== false,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(col(db, organizationId), payload);
  return toRecord(docRef.id, organizationId, payload);
}

export async function updateStoragePolicy(
  organizationId: string,
  id: string,
  input: UpdateStoragePolicyInput,
): Promise<StoragePolicyRecord | null> {
  const db = getDb();
  if (!db) return null;
  const existing = await getStoragePolicy(organizationId, id);
  if (!existing) return null;

  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (input.name !== undefined) update.name = input.name.trim();
  if (input.assetType !== undefined) update.assetType = input.assetType;
  if (input.storageLocationId !== undefined) {
    update.storageLocationId = input.storageLocationId;
  }
  if (input.folderTemplateId !== undefined) {
    update.folderTemplateId = input.folderTemplateId;
  }
  if (input.versioningEnabled !== undefined) {
    update.versioningEnabled = input.versioningEnabled;
  }
  if (input.autoCreateFolders !== undefined) {
    update.autoCreateFolders = input.autoCreateFolders;
  }
  if (input.active !== undefined) update.active = input.active;

  await updateDoc(ref(db, organizationId, id), update);
  return getStoragePolicy(organizationId, id);
}

export async function deleteStoragePolicy(
  organizationId: string,
  id: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const existing = await getStoragePolicy(organizationId, id);
  if (!existing) return false;
  await deleteDoc(ref(db, organizationId, id));
  return true;
}
