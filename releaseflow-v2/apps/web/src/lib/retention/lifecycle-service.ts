import {
  doc, getDoc, updateDoc, Timestamp,
  writeBatch,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { recordActivity } from '@/lib/activity-service';
import { ENTITY_DEPENDENCY_VALIDATORS } from './dependency-validator';
import type { EntityType } from './retention-types';

export interface DeleteOptions {
  entityType: EntityType;
  entityId: string;
  organizationId: string;
  actorId: string;
  deleteReason?: string;
}

export interface RestoreOptions {
  entityType: EntityType;
  entityId: string;
  organizationId: string;
  actorId: string;
  previousStatus?: string;
}

export interface PurgeOptions {
  entityType: EntityType;
  entityId: string;
  organizationId: string;
  actorId: string;
  force?: boolean;
}

function buildDocRef(entityType: EntityType, entityId: string, orgId?: string) {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  if (entityType === 'artist' || entityType === 'label') {
    if (!orgId) throw new Error('organizationId required for subcollection entities');
    return doc(db, 'organizations', orgId, `${entityType}s`, entityId);
  }
  if (entityType === 'media_asset') {
    if (!orgId) throw new Error('organizationId required for subcollection entities');
    return doc(db, 'organizations', orgId, 'media_assets', entityId);
  }
  if (entityType === 'person') {
    return doc(db, 'people', entityId);
  }
  return doc(db, `${entityType}s`, entityId);
}

export async function softDelete(options: DeleteOptions): Promise<void> {
  const { entityType, entityId, organizationId, actorId, deleteReason } = options;
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const ref = buildDocRef(entityType, entityId, organizationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`${entityType} ${entityId} not found`);
  const data = snap.data();
  const currentStatus = data.status || 'active';

  await updateDoc(ref, {
    status: `${DELETED_STATUS_PREFIX}:${currentStatus}`,
    deletedAt: Timestamp.now(),
    deletedBy: actorId,
    deleteReason: deleteReason ?? null,
    updatedAt: Timestamp.now(),
  });

  await recordActivity({
    entityType: entityType as never,
    entityId,
    organizationId,
    actorId,
    action: 'soft_delete',
    details: deleteReason || null,
    metadata: { previousStatus: currentStatus },
  });
}

export async function restore(options: RestoreOptions): Promise<void> {
  const { entityType, entityId, organizationId, actorId, previousStatus } = options;
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const ref = buildDocRef(entityType, entityId, organizationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`${entityType} ${entityId} not found`);

  const raw = snap.data();
  const restoredStatus = previousStatus || (raw.status as string)?.replace(`${DELETED_STATUS_PREFIX}:`, '') || 'draft';

  await updateDoc(ref, {
    status: restoredStatus,
    deletedAt: null,
    deletedBy: null,
    deleteReason: null,
    updatedAt: Timestamp.now(),
  });

  await recordActivity({
    entityType: entityType as never,
    entityId,
    organizationId,
    actorId,
    action: 'restore',
    metadata: { restoredStatus },
  });
}

export async function purge(options: PurgeOptions): Promise<void> {
  const { entityType, entityId, organizationId, actorId, force } = options;

  if (!force) {
    const validator = ENTITY_DEPENDENCY_VALIDATORS[entityType];
    if (validator) {
      const summary = await validator(entityId, organizationId);
      if (!summary.canPurge) {
        const names = summary.dependencies.map((d) => d.label).join(', ');
        throw new Error(`Cannot purge: ${entityType} ${entityId} has ${summary.dependencies.length} dependency(s): ${names}`);
      }
    }
  }

  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const ref = buildDocRef(entityType, entityId, organizationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`${entityType} ${entityId} not found`);

  const batch = writeBatch(db);
  batch.delete(ref);
  await batch.commit();

  await recordActivity({
    entityType: entityType as never,
    entityId,
    organizationId,
    actorId,
    action: 'purge',
    metadata: { forced: !!force },
  });
}

export async function isDeleted(entityType: EntityType, entityId: string, orgId?: string): Promise<boolean> {
  const ref = buildDocRef(entityType, entityId, orgId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const status = snap.data().status as string;
  return status?.startsWith('deleted:') ?? false;
}

const DELETED_STATUS_PREFIX = 'deleted';
