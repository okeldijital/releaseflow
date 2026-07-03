import {
  doc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface AssignmentRecord {
  id: string;
  personId: string;
  entityType: 'track' | 'release';
  entityId: string;
  primaryRole: string;
  responsibility?: string;
  status: 'assigned' | 'in_progress' | 'completed';
  createdAt: unknown;
  updatedAt: unknown;
}

export async function createAssignment(
  personId: string,
  entityType: 'track' | 'release',
  entityId: string,
  primaryRole: string,
  responsibility?: string,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'assignments'), {
    personId,
    entityType,
    entityId,
    primaryRole,
    responsibility: responsibility ?? null,
    status: 'assigned' as const,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateAssignment(
  assignmentId: string,
  fields: Partial<Pick<AssignmentRecord, 'primaryRole' | 'responsibility' | 'status'>>,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assignments', assignmentId), {
    ...fields,
    updatedAt: Timestamp.now(),
  });
}

export async function getAssignmentsByEntity(
  entityType: 'track' | 'release',
  entityId: string,
): Promise<AssignmentRecord[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db, 'assignments'),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId),
      ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AssignmentRecord);
  } catch {
    return [];
  }
}

export async function getAssignmentsByPerson(
  personId: string,
): Promise<AssignmentRecord[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, 'assignments'), where('personId', '==', personId)),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AssignmentRecord);
  } catch {
    return [];
  }
}

export async function completeAssignment(assignmentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'assignments', assignmentId), {
    status: 'completed',
    updatedAt: Timestamp.now(),
  });
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'assignments', assignmentId));
}
