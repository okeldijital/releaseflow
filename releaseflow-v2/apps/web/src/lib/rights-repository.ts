import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, Timestamp,
} from 'firebase/firestore';
import type { QueryConstraint } from 'firebase/firestore';
import { getDb } from './firebase';

export interface RightsHolderRecord {
  id: string;
  name: string;
  type: string;
  organizationId?: string | null;
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
  orgId: string,
  contact?: string,
  territory?: string,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'rights_holders'), {
    name,
    type,
    organizationId: orgId,
    contact: contact ?? null,
    territory: territory ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getRightsHolders(orgId?: string): Promise<RightsHolderRecord[]> {
  const db = getDb();
  if (!db) return [];
  const constraints: QueryConstraint[] = [];
  if (orgId) {
    constraints.push(where('organizationId', '==', orgId));
  }
  const snap = await getDocs(
    constraints.length > 0
      ? query(collection(db, 'rights_holders'), ...constraints)
      : collection(db, 'rights_holders'),
  );
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

export interface TrackRightRecord {
  id: string;
  trackId: string;
  organizationId: string;
  rightType: 'composition' | 'sound_recording' | 'publishing' | 'mechanical' | 'performing' | 'neighbouring';
  territory: string;
  status: 'active' | 'pending' | 'expired';
  effectiveDate?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export async function createTrackRight(fields: {
  trackId: string;
  organizationId: string;
  rightType: TrackRightRecord['rightType'];
  territory: string;
  status: TrackRightRecord['status'];
  effectiveDate?: string;
  expiryDate?: string;
  notes?: string;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'track_rights'), {
    ...fields,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateTrackRight(
  rightId: string,
  fields: {
    rightType?: TrackRightRecord['rightType'];
    territory?: string;
    status?: TrackRightRecord['status'];
    effectiveDate?: string;
    expiryDate?: string;
    notes?: string;
  },
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'track_rights', rightId), {
    ...fields,
    updatedAt: Timestamp.now(),
  });
}

export async function getRightsByTrack(trackId: string): Promise<TrackRightRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'track_rights'), where('trackId', '==', trackId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackRightRecord);
}

export async function deleteTrackRight(rightId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'track_rights', rightId));
}
