import {
  doc, getDoc, getDocs, addDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { MediaVersion } from './media-types';

/** organizations/{orgId}/media_versions/{versionId} */
const SUBCOLLECTION = 'media_versions';

function versionsCol(db: NonNullable<ReturnType<typeof getDb>>, organizationId: string) {
  return collection(db, 'organizations', organizationId, SUBCOLLECTION);
}

function versionDoc(db: NonNullable<ReturnType<typeof getDb>>, organizationId: string, id: string) {
  return doc(db, 'organizations', organizationId, SUBCOLLECTION, id);
}

function toVersion(id: string, data: Record<string, unknown>): MediaVersion {
  return {
    id,
    assetId: data.assetId as string,
    versionNumber: data.versionNumber as number,
    storageKey: data.storageKey as string,
    thumbnailUrl: data.thumbnailUrl as string | undefined,
    mimeType: data.mimeType as string,
    fileSize: data.fileSize as number,
    dimensions: data.dimensions as { width: number; height: number } | undefined,
    notes: data.notes as string | undefined,
    uploadedBy: data.uploadedBy as string,
    createdAt: data.createdAt as Timestamp,
  };
}

export async function createMediaVersion(
  organizationId: string,
  fields: Omit<MediaVersion, 'id' | 'createdAt'>,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(versionsCol(db, organizationId), {
    ...fields,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getVersionsByAsset(organizationId: string, assetId: string): Promise<MediaVersion[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(versionsCol(db, organizationId), where('assetId', '==', assetId), orderBy('versionNumber', 'desc')),
  );
  return snap.docs.map((d) => toVersion(d.id, d.data() as Record<string, unknown>));
}

export async function getMediaVersion(organizationId: string, id: string): Promise<MediaVersion | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(versionDoc(db, organizationId, id));
  if (!snap.exists()) return null;
  return toVersion(snap.id, snap.data() as Record<string, unknown>);
}

export async function deleteMediaVersion(organizationId: string, id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(versionDoc(db, organizationId, id));
}
