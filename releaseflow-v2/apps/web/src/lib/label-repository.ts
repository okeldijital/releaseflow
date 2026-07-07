import {
  doc, getDoc, getDocs, addDoc, deleteDoc,
  collection, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface LabelRecord {
  id: string;
  name: string;
  organizationId: string;
  createdAt: unknown;
}

function labelsCollection(db: ReturnType<typeof getDb>, orgId: string) {
  return collection(db!, 'organizations', orgId, 'labels');
}

function labelDocument(db: ReturnType<typeof getDb>, orgId: string, labelId: string) {
  return doc(db!, 'organizations', orgId, 'labels', labelId);
}

function toLabelRecord(id: string, data: Record<string, unknown>, orgId: string): LabelRecord {
  return {
    id,
    name: (data.name as string) ?? '',
    organizationId: (data.organizationId as string) ?? orgId,
    createdAt: data.createdAt,
  };
}

export async function getLabelsByOrganization(orgId: string): Promise<LabelRecord[]> {
  const db = getDb();
  if (!db || !orgId) return [];

  const snap = await getDocs(
    query(labelsCollection(db, orgId), orderBy('name', 'asc')),
  );

  return snap.docs.map((d) => toLabelRecord(d.id, d.data() as Record<string, unknown>, orgId));
}

export async function createLabel(fields: { name: string; organizationId: string }): Promise<LabelRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  if (!fields.organizationId) throw new Error('Organization ID is required');

  const trimmedName = fields.name.trim();
  if (!trimmedName) throw new Error('Label name is required');

  const now = Timestamp.now();
  const ref = await addDoc(labelsCollection(db, fields.organizationId), {
    name: trimmedName,
    organizationId: fields.organizationId,
    createdAt: now,
  });

  return {
    id: ref.id,
    name: trimmedName,
    organizationId: fields.organizationId,
    createdAt: now,
  };
}

export async function deleteLabel(labelId: string, orgId: string, actorId?: string, deleteReason?: string): Promise<void> {
  if (actorId) {
    const { softDelete } = await import('@/lib/retention/lifecycle-service');
    await softDelete({ entityType: 'label', entityId: labelId, organizationId: orgId, actorId, deleteReason });
    return;
  }

  const db = getDb();
  if (!db || !orgId) return;

  const ref = labelDocument(db, orgId, labelId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
  }
}
