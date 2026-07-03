import {
  doc, getDocs, addDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface PerformerRoleRecord {
  id: string;
  trackId: string;
  organizationId: string;
  personId: string;
  role: string;
  displayOrder: number;
  createdAt: unknown;
}

export interface CreatePerformerRoleFields {
  trackId: string;
  organizationId: string;
  personId: string;
  role: string;
  displayOrder?: number;
}

export interface UpdatePerformerRoleFields {
  role?: string;
  displayOrder?: number;
}

export async function createPerformerRole(fields: CreatePerformerRoleFields): Promise<PerformerRoleRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const data = {
    trackId: fields.trackId,
    organizationId: fields.organizationId,
    personId: fields.personId,
    role: fields.role,
    displayOrder: fields.displayOrder ?? 0,
    createdAt: now,
  };
  const ref = await addDoc(collection(db, 'performer_roles'), data);
  return {
    id: ref.id,
    trackId: data.trackId,
    organizationId: data.organizationId,
    personId: data.personId,
    role: data.role,
    displayOrder: data.displayOrder,
    createdAt: now,
  };
}

export async function deletePerformerRole(roleId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'performer_roles', roleId));
}

export async function getPerformerRolesByTrack(trackId: string): Promise<PerformerRoleRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'performer_roles'),
      where('trackId', '==', trackId),
      orderBy('displayOrder', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PerformerRoleRecord);
}
