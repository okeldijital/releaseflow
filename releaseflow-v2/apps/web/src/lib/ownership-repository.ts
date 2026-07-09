import {
  collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface OwnershipRecord {
  id: string;
  entityType: 'track' | 'release';
  entityId: string;
  organizationId: string;
  personId: string;
  ownershipType: string;
  percentage: number;
  notes?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export async function createOwnership(fields: {
  entityType: OwnershipRecord['entityType'];
  entityId: string;
  organizationId: string;
  personId: string;
  ownershipType: string;
  percentage: number;
  notes?: string;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'ownerships'), {
    ...fields,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateOwnership(
  ownershipId: string,
  fields: {
    ownershipType?: string;
    percentage?: number;
    notes?: string;
  },
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'ownerships', ownershipId), {
    ...fields,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteOwnership(ownershipId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'ownerships', ownershipId));
}

export async function getOwnershipsByEntity(
  entityType: OwnershipRecord['entityType'],
  entityId: string,
): Promise<OwnershipRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'ownerships'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OwnershipRecord);
}

export async function getTotalOwnership(
  entityType: OwnershipRecord['entityType'],
  entityId: string,
): Promise<number> {
  const ownerships = await getOwnershipsByEntity(entityType, entityId);
  return ownerships.reduce((sum, o) => sum + o.percentage, 0);
}
