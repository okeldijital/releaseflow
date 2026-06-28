import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface RightsHolderRecord {
  id: string;
  name: string;
  type: string;
  contact?: string | null;
  territory?: string | null;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface ReleaseOwnershipRecord {
  id: string;
  releaseId: string;
  rightsHolderId: string;
  ownershipType: string;
  percentage: number;
}

export interface TrackOwnershipRecord {
  id: string;
  trackId: string;
  rightsHolderId: string;
  ownershipType: string;
  percentage: number;
}

export async function createRightsHolder(
  name: string,
  type: string,
  contact?: string,
  territory?: string,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'rights_holders'), {
    name,
    type,
    contact: contact ?? null,
    territory: territory ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getRightsHolders(): Promise<RightsHolderRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, 'rights_holders'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RightsHolderRecord);
}

export async function getRightsHolder(id: string): Promise<RightsHolderRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'rights_holders', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as RightsHolderRecord;
}

export async function deleteRightsHolder(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'rights_holders', id));
}

export async function addReleaseOwnership(
  releaseId: string,
  rightsHolderId: string,
  ownershipType: string,
  percentage: number,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'release_ownerships'), {
    releaseId,
    rightsHolderId,
    ownershipType,
    percentage,
  });
  return ref.id;
}

export async function getReleaseOwnerships(releaseId: string): Promise<ReleaseOwnershipRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'release_ownerships'), where('releaseId', '==', releaseId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReleaseOwnershipRecord);
}

export async function addTrackOwnership(
  trackId: string,
  rightsHolderId: string,
  ownershipType: string,
  percentage: number,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'track_ownerships'), {
    trackId,
    rightsHolderId,
    ownershipType,
    percentage,
  });
  return ref.id;
}

export async function getTrackOwnerships(trackId: string): Promise<TrackOwnershipRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'track_ownerships'), where('trackId', '==', trackId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackOwnershipRecord);
}
