/**
 * BUILD-301D — Storage Location repository.
 * Path: organizations/{organizationId}/storage_locations/{id}
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
  orderBy,
  Timestamp,
  type Firestore,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type {
  CreateStorageLocationInput,
  StorageLocationRecord,
  StorageLocationStatus,
  UpdateStorageLocationInput,
} from './storage-location-types';
import type { StorageProviderId } from './types';

const SUB = 'storage_locations';

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
): StorageLocationRecord {
  return {
    id,
    organizationId,
    name: String(data.name ?? ''),
    providerId: data.providerId as StorageProviderId,
    status: (data.status as StorageLocationStatus) ?? 'active',
    rootPath: String(data.rootPath ?? '/ReleaseFlow'),
    configuration: {
      rootConfigured: Boolean(
        (data.configuration as { rootConfigured?: boolean } | undefined)
          ?.rootConfigured ?? data.rootPath,
      ),
    },
    isDefault: Boolean(data.isDefault),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    metadata: (data.metadata as Record<string, unknown> | null) ?? null,
  };
}

export async function listStorageLocations(
  organizationId: string,
): Promise<StorageLocationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(col(db, organizationId), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) =>
    toRecord(d.id, organizationId, d.data() as Record<string, unknown>),
  );
}

export async function getStorageLocation(
  organizationId: string,
  id: string,
): Promise<StorageLocationRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(ref(db, organizationId, id));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  // Enforce org path ownership
  if (data.organizationId && data.organizationId !== organizationId) {
    return null;
  }
  return toRecord(snap.id, organizationId, data);
}

export async function createStorageLocation(
  organizationId: string,
  input: CreateStorageLocationInput & { providerId: StorageProviderId },
): Promise<StorageLocationRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const rootPath = (input.rootPath ?? '/ReleaseFlow').trim() || '/ReleaseFlow';
  const payload = {
    organizationId,
    name: input.name.trim(),
    providerId: input.providerId,
    status: input.status ?? ('active' as StorageLocationStatus),
    rootPath,
    configuration: { rootConfigured: true },
    isDefault: Boolean(input.isDefault),
    metadata: null,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(col(db, organizationId), payload);
  return toRecord(docRef.id, organizationId, payload);
}

export async function updateStorageLocation(
  organizationId: string,
  id: string,
  input: UpdateStorageLocationInput,
): Promise<StorageLocationRecord | null> {
  const db = getDb();
  if (!db) return null;
  const existing = await getStorageLocation(organizationId, id);
  if (!existing) return null;

  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (input.name !== undefined) update.name = input.name.trim();
  if (input.rootPath !== undefined) {
    update.rootPath = input.rootPath.trim() || '/ReleaseFlow';
    update.configuration = { rootConfigured: true };
  }
  if (input.status !== undefined) update.status = input.status;
  if (input.isDefault !== undefined) update.isDefault = input.isDefault;

  await updateDoc(ref(db, organizationId, id), update);
  return getStorageLocation(organizationId, id);
}

export async function deleteStorageLocation(
  organizationId: string,
  id: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const existing = await getStorageLocation(organizationId, id);
  if (!existing) return false;
  await deleteDoc(ref(db, organizationId, id));
  return true;
}

/** Clear isDefault on all other locations when one is set default. */
export async function clearOtherDefaultLocations(
  organizationId: string,
  exceptId: string,
): Promise<void> {
  const all = await listStorageLocations(organizationId);
  await Promise.all(
    all
      .filter((l) => l.id !== exceptId && l.isDefault)
      .map((l) =>
        updateStorageLocation(organizationId, l.id, { isDefault: false }),
      ),
  );
}
