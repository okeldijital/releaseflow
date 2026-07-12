import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { Artwork } from './artwork-types';

const SUBCOLLECTION = 'artworks';

function artworksCol(db: NonNullable<ReturnType<typeof getDb>>, organizationId: string) {
  return collection(db, 'organizations', organizationId, SUBCOLLECTION);
}

function artworkDoc(db: NonNullable<ReturnType<typeof getDb>>, organizationId: string, id: string) {
  return doc(db, 'organizations', organizationId, SUBCOLLECTION, id);
}

function toArtwork(id: string, data: Record<string, unknown>): Artwork {
  return {
    id,
    organizationId: data.organizationId as string,
    releaseId: data.releaseId as string,
    publicId: data.publicId as string,
    secureUrl: data.secureUrl as string,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  };
}

export async function createArtwork(
  fields: Omit<Artwork, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  if (!fields.organizationId) throw new Error('organizationId required');
  const now = Timestamp.now();

  const ref = await addDoc(artworksCol(db, fields.organizationId), {
    ...fields,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateArtwork(
  organizationId: string,
  id: string,
  fields: Partial<Omit<Artwork, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(artworkDoc(db, organizationId, id), { ...fields, updatedAt: Timestamp.now() });
}

export async function deleteArtwork(
  organizationId: string,
  id: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(artworkDoc(db, organizationId, id));
}

export async function getArtwork(
  organizationId: string,
  id: string,
): Promise<Artwork | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(artworkDoc(db, organizationId, id));
  if (!snap.exists()) return null;
  return toArtwork(snap.id, snap.data() as Record<string, unknown>);
}

export async function getArtworksByRelease(
  organizationId: string,
  releaseId: string,
): Promise<Artwork[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(
    artworksCol(db, organizationId),
    where('releaseId', '==', releaseId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toArtwork(d.id, d.data() as Record<string, unknown>));
}
