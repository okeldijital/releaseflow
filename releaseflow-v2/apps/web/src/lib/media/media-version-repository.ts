import {
  doc, getDoc, getDocs, addDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { MediaVersion } from './media-types';

const COLLECTION = 'media_versions';

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
  fields: Omit<MediaVersion, 'id' | 'createdAt'>,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, COLLECTION), {
    ...fields,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getVersionsByAsset(assetId: string): Promise<MediaVersion[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, COLLECTION), where('assetId', '==', assetId), orderBy('versionNumber', 'desc')),
  );
  return snap.docs.map((d) => toVersion(d.id, d.data() as Record<string, unknown>));
}

export async function getMediaVersion(id: string): Promise<MediaVersion | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return toVersion(snap.id, snap.data() as Record<string, unknown>);
}

export async function deleteMediaVersion(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, COLLECTION, id));
}
