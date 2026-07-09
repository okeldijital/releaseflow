import {
  doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export interface MilestoneRecord {
  id: string;
  releaseId: string;
  organizationId: string;
  title: string;
  description?: string | null;
  owner?: string | null;
  dueDate?: unknown | null;
  completedAt?: unknown | null;
  status: MilestoneStatus;
  sortOrder: number;
  dependsOn?: string[] | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CreateMilestoneFields {
  releaseId: string;
  organizationId: string;
  title: string;
  description?: string | null;
  owner?: string | null;
  dueDate?: unknown | null;
  sortOrder?: number;
  dependsOn?: string[] | null;
}

export interface UpdateMilestoneFields {
  title?: string;
  description?: string | null;
  owner?: string | null;
  dueDate?: unknown | null;
  status?: MilestoneStatus;
  sortOrder?: number;
  dependsOn?: string[] | null;
}

const MILESTONE_TEMPLATES = [
  'Project Created',
  'Recording Complete',
  'Mix Approved',
  'Master Approved',
  'Artwork Approved',
  'Metadata Complete',
  'Distribution Submitted',
  'Pre-save Live',
  'Marketing Starts',
  'Release Day',
  'Post Release Review',
];

export { MILESTONE_TEMPLATES };

function toRecord(id: string, data: Record<string, unknown>): MilestoneRecord {
  return {
    id,
    releaseId: data.releaseId as string || '',
    organizationId: data.organizationId as string || '',
    title: data.title as string || '',
    description: data.description as string | null | undefined,
    owner: data.owner as string | null | undefined,
    dueDate: data.dueDate as unknown | null | undefined,
    completedAt: data.completedAt as unknown | null | undefined,
    status: (data.status as MilestoneStatus) || 'pending',
    sortOrder: (data.sortOrder as number) || 0,
    dependsOn: data.dependsOn as string[] | null | undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createMilestone(fields: CreateMilestoneFields): Promise<MilestoneRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'release_milestones'), {
    releaseId: fields.releaseId,
    organizationId: fields.organizationId,
    title: fields.title,
    description: fields.description ?? null,
    owner: fields.owner ?? null,
    dueDate: fields.dueDate ?? null,
    completedAt: null,
    status: 'pending',
    sortOrder: fields.sortOrder ?? 0,
    dependsOn: fields.dependsOn ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return toRecord(ref.id, { ...fields, id: ref.id, status: 'pending', sortOrder: fields.sortOrder ?? 0, createdAt: now, updatedAt: now });
}

export async function getMilestone(milestoneId: string): Promise<MilestoneRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'release_milestones', milestoneId));
  if (!snap.exists()) return null;
  return toRecord(snap.id, snap.data() as Record<string, unknown>);
}

export async function updateMilestone(milestoneId: string, fields: UpdateMilestoneFields): Promise<void> {
  const db = getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { ...fields, updatedAt: Timestamp.now() };
  if (fields.status === 'completed') updateData.completedAt = Timestamp.now();
  await updateDoc(doc(db, 'release_milestones', milestoneId), updateData);
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'release_milestones', milestoneId));
}

export async function getMilestonesByRelease(releaseId: string): Promise<MilestoneRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'release_milestones'), where('releaseId', '==', releaseId), orderBy('sortOrder', 'asc')),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
}

export async function getMilestonesByOrg(orgId: string): Promise<MilestoneRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'release_milestones'), where('organizationId', '==', orgId), orderBy('dueDate', 'asc')),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
}

export async function completeMilestone(milestoneId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'release_milestones', milestoneId), {
    status: 'completed', completedAt: Timestamp.now(), updatedAt: Timestamp.now(),
  });
}

export async function reopenMilestone(milestoneId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'release_milestones', milestoneId), {
    status: 'pending', completedAt: null, updatedAt: Timestamp.now(),
  });
}

export async function bulkCreateMilestones(releaseId: string, orgId: string, templates: string[]): Promise<MilestoneRecord[]> {
  const results: MilestoneRecord[] = [];
  for (let i = 0; i < templates.length; i++) {
    const m = await createMilestone({
      releaseId, organizationId: orgId, title: templates[i]!, sortOrder: i,
    });
    results.push(m);
  }
  return results;
}
