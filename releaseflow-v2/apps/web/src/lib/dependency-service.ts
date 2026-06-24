import { collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { Dependency, DependencyCategory, DependencyStatus } from '@/app/(app)/types';

export async function createDependency(fields: {
  releaseId: string;
  title: string;
  category: DependencyCategory;
  owner: string;
  dueDate?: Date;
  blocking?: boolean;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'dependencies'), {
    releaseId: fields.releaseId,
    title: fields.title,
    category: fields.category,
    owner: fields.owner,
    status: 'pending',
    dueDate: fields.dueDate ? Timestamp.fromDate(fields.dueDate) : null,
    blocking: fields.blocking ?? false,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateDependency(depId: string, fields: Partial<{ status: DependencyStatus; owner: string; dueDate: Date; blocking: boolean }>): Promise<void> {
  const db = getDb();
  if (!db) return;
  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.status !== undefined) update.status = fields.status;
  if (fields.owner !== undefined) update.owner = fields.owner;
  if (fields.dueDate !== undefined) update.dueDate = Timestamp.fromDate(fields.dueDate);
  if (fields.blocking !== undefined) update.blocking = fields.blocking;
  await updateDoc(doc(db, 'dependencies', depId), update);
}

export async function getDependenciesByRelease(releaseId: string): Promise<Dependency[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'dependencies'), where('releaseId', '==', releaseId), orderBy('createdAt', 'asc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Dependency);
}

export async function getBlockingDependencies(releaseId: string): Promise<Dependency[]> {
  const deps = await getDependenciesByRelease(releaseId);
  return deps.filter((d) => d.blocking && d.status !== 'completed');
}
