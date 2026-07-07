import {
  getDocs, getDoc, doc,
  collection, query, where, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { EntityType, RestorableEntity } from './retention-types';
import { ENTITY_DISPLAY_NAMES } from './retention-types';

async function queryDeleted<T>(
  collectionName: string,
  titleField: string,
  maxCount: number,
  orgId?: string,
  subcollectionPath?: string,
): Promise<RestorableEntity[]> {
  const db = getDb();
  if (!db) return [];

  const ref = subcollectionPath
    ? collection(db, 'organizations', orgId!, `${subcollectionPath}`)
    : collection(db, collectionName);

  const snap = await getDocs(
    query(
      ref,
      where('status', '>=', 'deleted:'),
      where('status', '<', 'deleted~'),
      orderBy('status'),
      orderBy('deletedAt', 'desc'),
      limit(maxCount),
    ),
  );

  return snap.docs.map((d) => {
    const data = d.data();
    const status = (data.status as string) || '';
    const originalStatus = status.startsWith('deleted:') ? status.slice(8) : 'draft';
    return {
      id: d.id,
      entityType: collectionName.replace(/_/g, '_') as EntityType,
      title: (data[titleField] as string) || (data.name as string) || 'Untitled',
      status,
      deletedAt: data.deletedAt ?? null,
      deletedBy: data.deletedBy ?? '',
      deleteReason: data.deleteReason ?? null,
      originalStatus,
    };
  });
}

export async function getDeletedReleases(orgId: string, maxCount = 100): Promise<RestorableEntity[]> {
  return queryDeleted('releases', 'title', maxCount);
}

export async function getDeletedTracks(orgId: string, maxCount = 100): Promise<RestorableEntity[]> {
  return queryDeleted('tracks', 'title', maxCount);
}

export async function getDeletedArtists(orgId: string, maxCount = 100): Promise<RestorableEntity[]> {
  return queryDeleted('artists', 'name', maxCount, orgId, 'artists');
}

export async function getDeletedLabels(orgId: string, maxCount = 100): Promise<RestorableEntity[]> {
  return queryDeleted('labels', 'name', maxCount, orgId, 'labels');
}

export async function getDeletedPeople(orgId: string, maxCount = 100): Promise<RestorableEntity[]> {
  return queryDeleted('people', 'name', maxCount);
}

export async function getDeletedMediaAssets(orgId: string, maxCount = 100): Promise<RestorableEntity[]> {
  return queryDeleted('media_assets', 'filename', maxCount);
}

export async function getDeletedAssignments(orgId: string, maxCount = 100): Promise<RestorableEntity[]> {
  return queryDeleted('assignments', 'title', maxCount);
}

export async function getDeletedWorks(orgId: string, maxCount = 100): Promise<RestorableEntity[]> {
  return queryDeleted('works', 'title', maxCount);
}

export async function getAllDeleted(orgId: string, maxCount = 50): Promise<RestorableEntity[]> {
  const results = await Promise.allSettled([
    getDeletedReleases(orgId, maxCount),
    getDeletedTracks(orgId, maxCount),
    getDeletedArtists(orgId, maxCount),
    getDeletedLabels(orgId, maxCount),
    getDeletedPeople(orgId, maxCount),
    getDeletedMediaAssets(orgId, maxCount),
    getDeletedAssignments(orgId, maxCount),
    getDeletedWorks(orgId, maxCount),
  ]);

  return results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => (r as PromiseFulfilledResult<RestorableEntity[]>).value)
    .filter((e) => e.title !== 'Untitled');
}

export async function getEntityById(
  entityType: EntityType,
  entityId: string,
  orgId?: string,
): Promise<Record<string, unknown> | null> {
  const db = getDb();
  if (!db) return null;

  let ref;
  if (entityType === 'artist' || entityType === 'label') {
    if (!orgId) return null;
    ref = doc(db, 'organizations', orgId, `${entityType}s`, entityId);
  } else if (entityType === 'person') {
    ref = doc(db, 'people', entityId);
  } else {
    ref = doc(db, `${entityType}s`, entityId);
  }

  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
