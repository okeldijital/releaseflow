/**
 * BUILD-301F — StorageReference repository.
 * Path: organizations/{organizationId}/storage_references/{id}
 *
 * Never stores download URLs as durable identity.
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
import type { StorageProviderId } from './types';
import type {
  CreateStorageReferenceInput,
  StorageReferenceRecord,
  StorageReferenceStatus,
  StorageSyncStatus,
  StorageVersionInfo,
  UpdateStorageReferenceInput,
} from './storage-reference-types';

const SUB = 'storage_references';
const MAX_VERSION_HISTORY = 20;

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
): StorageReferenceRecord {
  return {
    id,
    organizationId,
    domainAssetId: String(data.domainAssetId ?? ''),
    assetType: data.assetType as AssetType,
    storageLocationId: String(data.storageLocationId ?? ''),
    providerId: data.providerId as StorageProviderId,
    providerFileId: String(data.providerFileId ?? ''),
    providerPath:
      data.providerPath === undefined || data.providerPath === null
        ? null
        : String(data.providerPath),
    status: (data.status as StorageReferenceStatus) ?? 'active',
    versioningEnabled: Boolean(data.versioningEnabled),
    currentVersion:
      typeof data.currentVersion === 'number' ? data.currentVersion : 1,
    providerVersionId:
      data.providerVersionId === undefined || data.providerVersionId === null
        ? null
        : String(data.providerVersionId),
    providerETag:
      data.providerETag === undefined || data.providerETag === null
        ? null
        : String(data.providerETag),
    providerModifiedAt:
      data.providerModifiedAt === undefined || data.providerModifiedAt === null
        ? null
        : String(data.providerModifiedAt),
    lastSyncedAt:
      data.lastSyncedAt === undefined || data.lastSyncedAt === null
        ? null
        : String(data.lastSyncedAt),
    syncStatus: (data.syncStatus as StorageSyncStatus) ?? 'never',
    lastSyncError:
      data.lastSyncError === undefined || data.lastSyncError === null
        ? null
        : String(data.lastSyncError),
    versions: Array.isArray(data.versions)
      ? (data.versions as StorageVersionInfo[])
      : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/** Strip any accidental downloadUrl from payloads before write. */
function stripEphemeralFields(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const {
    downloadUrl: _d,
    temporaryLink: _t,
    accessToken: _a,
    refreshToken: _r,
    ...rest
  } = data;
  void _d;
  void _t;
  void _a;
  void _r;
  return rest;
}

export async function listStorageReferences(
  organizationId: string,
): Promise<StorageReferenceRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(col(db, organizationId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) =>
    toRecord(d.id, organizationId, d.data() as Record<string, unknown>),
  );
}

export async function listStorageReferencesByDomainAsset(
  organizationId: string,
  domainAssetId: string,
): Promise<StorageReferenceRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      col(db, organizationId),
      where('domainAssetId', '==', domainAssetId),
    ),
  );
  return snap.docs
    .map((d) =>
      toRecord(d.id, organizationId, d.data() as Record<string, unknown>),
    )
    .filter((r) => r.organizationId === organizationId);
}

export async function getStorageReference(
  organizationId: string,
  id: string,
): Promise<StorageReferenceRecord | null> {
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

export async function createStorageReference(
  organizationId: string,
  input: CreateStorageReferenceInput & {
    providerId: StorageProviderId;
  },
): Promise<StorageReferenceRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const versionNumber =
    typeof input.currentVersion === 'number' && input.currentVersion >= 1
      ? input.currentVersion
      : 1;

  const versions: StorageVersionInfo[] = [
    {
      versionNumber,
      providerVersionId: input.providerVersionId ?? null,
      providerETag: input.providerETag ?? null,
      providerModifiedAt: input.providerModifiedAt ?? null,
      createdAt: new Date().toISOString(),
    },
  ];

  const payload = stripEphemeralFields({
    organizationId,
    domainAssetId: input.domainAssetId.trim(),
    assetType: input.assetType,
    storageLocationId: input.storageLocationId,
    providerId: input.providerId,
    providerFileId: input.providerFileId.trim(),
    providerPath:
      input.providerPath === undefined || input.providerPath === null
        ? null
        : String(input.providerPath).trim() || null,
    status: input.status ?? ('active' as StorageReferenceStatus),
    versioningEnabled: Boolean(input.versioningEnabled),
    currentVersion: versionNumber,
    providerVersionId: input.providerVersionId ?? null,
    providerETag: input.providerETag ?? null,
    providerModifiedAt: input.providerModifiedAt ?? null,
    lastSyncedAt: null,
    syncStatus: 'never' as StorageSyncStatus,
    lastSyncError: null,
    versions,
    createdAt: now,
    updatedAt: now,
  });

  const docRef = await addDoc(col(db, organizationId), payload);
  return toRecord(docRef.id, organizationId, payload);
}

export async function updateStorageReference(
  organizationId: string,
  id: string,
  input: UpdateStorageReferenceInput & {
    providerVersionId?: string | null;
    providerETag?: string | null;
    providerModifiedAt?: string | null;
    lastSyncedAt?: string | null;
    syncStatus?: StorageSyncStatus;
    lastSyncError?: string | null;
    currentVersion?: number;
    versions?: StorageVersionInfo[];
    status?: StorageReferenceStatus;
  },
): Promise<StorageReferenceRecord | null> {
  const db = getDb();
  if (!db) return null;
  const existing = await getStorageReference(organizationId, id);
  if (!existing) return null;

  const update: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };

  if (input.providerPath !== undefined) {
    update.providerPath =
      input.providerPath === null
        ? null
        : String(input.providerPath).trim() || null;
  }
  if (input.status !== undefined) update.status = input.status;
  if (input.detach === true) update.status = 'detached';
  if (input.versioningEnabled !== undefined) {
    update.versioningEnabled = input.versioningEnabled;
  }
  if (input.providerVersionId !== undefined) {
    update.providerVersionId = input.providerVersionId;
  }
  if (input.providerETag !== undefined) update.providerETag = input.providerETag;
  if (input.providerModifiedAt !== undefined) {
    update.providerModifiedAt = input.providerModifiedAt;
  }
  if (input.lastSyncedAt !== undefined) update.lastSyncedAt = input.lastSyncedAt;
  if (input.syncStatus !== undefined) update.syncStatus = input.syncStatus;
  if (input.lastSyncError !== undefined) {
    update.lastSyncError = input.lastSyncError;
  }
  if (input.currentVersion !== undefined) {
    update.currentVersion = input.currentVersion;
  }
  if (input.versions !== undefined) {
    update.versions = input.versions.slice(0, MAX_VERSION_HISTORY);
  }

  const safe = stripEphemeralFields(update);
  await updateDoc(ref(db, organizationId, id), safe);
  return getStorageReference(organizationId, id);
}

export async function deleteStorageReference(
  organizationId: string,
  id: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const existing = await getStorageReference(organizationId, id);
  if (!existing) return false;
  await deleteDoc(ref(db, organizationId, id));
  return true;
}

export { MAX_VERSION_HISTORY };
