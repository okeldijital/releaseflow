import {
  doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export type WorkStatus = 'active' | 'archived';
export type RegistrationStatus = 'unregistered' | 'pending' | 'registered' | 'public_domain';

export interface WorkRecord {
  id: string;
  organizationId: string;
  title: string;
  alternativeTitle?: string | null;
  subtitle?: string | null;
  language?: string | null;
  genre?: string | null;
  duration?: number | null;
  description?: string | null;
  iswc?: string | null;
  pro?: string | null;
  copyrightYear?: number | null;
  copyrightOwner?: string | null;
  registrationStatus: RegistrationStatus;
  status: WorkStatus;
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  deletedAt?: unknown;
  deletedBy?: string | null;
  deleteReason?: string | null;
}

export interface CreateWorkFields {
  organizationId: string;
  title: string;
  alternativeTitle?: string | null;
  subtitle?: string | null;
  language?: string | null;
  genre?: string | null;
  duration?: number | null;
  description?: string | null;
  iswc?: string | null;
  pro?: string | null;
  copyrightYear?: number | null;
  copyrightOwner?: string | null;
  registrationStatus?: RegistrationStatus;
  createdBy?: string;
}

export interface UpdateWorkFields {
  title?: string;
  alternativeTitle?: string | null;
  subtitle?: string | null;
  language?: string | null;
  genre?: string | null;
  duration?: number | null;
  description?: string | null;
  iswc?: string | null;
  pro?: string | null;
  copyrightYear?: number | null;
  copyrightOwner?: string | null;
  registrationStatus?: RegistrationStatus;
  status?: WorkStatus;
}

function toRecord(id: string, data: Record<string, unknown>): WorkRecord {
  return {
    id,
    organizationId: data.organizationId as string || '',
    title: data.title as string || '',
    alternativeTitle: data.alternativeTitle as string | null | undefined,
    subtitle: data.subtitle as string | null | undefined,
    language: data.language as string | null | undefined,
    genre: data.genre as string | null | undefined,
    duration: data.duration as number | null | undefined,
    description: data.description as string | null | undefined,
    iswc: data.iswc as string | null | undefined,
    pro: data.pro as string | null | undefined,
    copyrightYear: data.copyrightYear as number | null | undefined,
    copyrightOwner: data.copyrightOwner as string | null | undefined,
    registrationStatus: (data.registrationStatus as RegistrationStatus) || 'unregistered',
    status: (data.status as WorkStatus) || 'active',
    createdBy: data.createdBy as string | undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt,
    deletedBy: data.deletedBy as string | null | undefined,
    deleteReason: data.deleteReason as string | null | undefined,
  };
}

export async function createWork(fields: CreateWorkFields): Promise<WorkRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'works'), {
    ...fields,
    alternativeTitle: fields.alternativeTitle ?? null,
    subtitle: fields.subtitle ?? null,
    language: fields.language ?? null,
    genre: fields.genre ?? null,
    duration: fields.duration ?? null,
    description: fields.description ?? null,
    iswc: fields.iswc ?? null,
    pro: fields.pro ?? null,
    copyrightYear: fields.copyrightYear ?? null,
    copyrightOwner: fields.copyrightOwner ?? null,
    registrationStatus: fields.registrationStatus ?? 'unregistered',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
  return toRecord(ref.id, { ...fields, id: ref.id, status: 'active', createdAt: now, updatedAt: now, registrationStatus: fields.registrationStatus ?? 'unregistered' });
}

export async function getWork(workId: string): Promise<WorkRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'works', workId));
  if (!snap.exists()) return null;
  return toRecord(snap.id, snap.data() as Record<string, unknown>);
}

export async function updateWork(workId: string, fields: UpdateWorkFields): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'works', workId), { ...fields, updatedAt: Timestamp.now() });
}

export async function deleteWork(workId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'works', workId));
}

export async function listWorks(orgId: string, opts?: { includeArchived?: boolean }): Promise<WorkRecord[]> {
  const db = getDb();
  if (!db) return [];
  const constraints = [where('organizationId', '==', orgId), orderBy('title', 'asc')];
  const snap = await getDocs(query(collection(db, 'works'), ...constraints));
  return snap.docs
    .map((d) => toRecord(d.id, d.data() as Record<string, unknown>))
    .filter((w) => opts?.includeArchived ? true : w.status !== 'archived');
}

export async function searchWorks(orgId: string, queryStr: string): Promise<WorkRecord[]> {
  const db = getDb();
  if (!db) return [];
  const q = queryStr.toLowerCase();
  const snap = await getDocs(
    query(collection(db, 'works'), where('organizationId', '==', orgId)),
  );
  return snap.docs
    .map((d) => toRecord(d.id, d.data() as Record<string, unknown>))
    .filter((w) => {
      if (w.title.toLowerCase().includes(q)) return true;
      if (w.iswc?.toLowerCase().includes(q)) return true;
      if (w.alternativeTitle?.toLowerCase().includes(q)) return true;
      return false;
    });
}

export async function archiveWork(workId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'works', workId), { status: 'archived', updatedAt: Timestamp.now() });
}

export async function restoreWork(workId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'works', workId), { status: 'active', updatedAt: Timestamp.now() });
}

export interface WorkWriterSplit {
  id: string;
  workId: string;
  personId: string;
  role: string;
  ownershipShare: number;
  collectionShare: number;
  publisherShare: number;
  administrationShare: number;
  position: number;
  ipi?: string | null;
  pro?: string | null;
  isPrimary: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export async function addWriter(workId: string, fields: {
  personId: string;
  role: string;
  ownershipShare: number;
  collectionShare?: number;
  publisherShare?: number;
  administrationShare?: number;
  position?: number;
  ipi?: string | null;
  pro?: string | null;
  isPrimary?: boolean;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'work_splits'), {
    workId,
    personId: fields.personId,
    role: fields.role,
    ownershipShare: fields.ownershipShare,
    collectionShare: fields.collectionShare ?? fields.ownershipShare,
    publisherShare: fields.publisherShare ?? 0,
    administrationShare: fields.administrationShare ?? 0,
    position: fields.position ?? 0,
    ipi: fields.ipi ?? null,
    pro: fields.pro ?? null,
    isPrimary: fields.isPrimary ?? false,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateWriter(splitId: string, fields: Partial<Omit<WorkWriterSplit, 'id' | 'workId' | 'createdAt'>>): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'work_splits', splitId), { ...fields, updatedAt: Timestamp.now() });
}

export async function removeWriter(splitId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'work_splits', splitId));
}

export async function getWriters(workId: string): Promise<WorkWriterSplit[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'work_splits'), where('workId', '==', workId), orderBy('position', 'asc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkWriterSplit);
}

export async function validateSplits(workId: string): Promise<{ total: number; valid: boolean; message: string }> {
  const writers = await getWriters(workId);
  const total = writers.reduce((sum, w) => sum + w.ownershipShare, 0);
  return {
    total,
    valid: Math.abs(total - 100) < 0.01,
    message: total === 0 ? 'No writers assigned' : `Total ownership: ${total}%`,
  };
}

export interface WorkPublisherRecord {
  id: string;
  workId: string;
  publisherId: string;
  territory?: string | null;
  share: number;
  administrationType?: string | null;
  startDate?: unknown | null;
  endDate?: unknown | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export async function addPublisher(workId: string, fields: {
  publisherId: string;
  territory?: string | null;
  share: number;
  administrationType?: string | null;
  startDate?: unknown | null;
  endDate?: unknown | null;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'work_publishers'), {
    workId,
    publisherId: fields.publisherId,
    territory: fields.territory ?? null,
    share: fields.share,
    administrationType: fields.administrationType ?? null,
    startDate: fields.startDate ?? null,
    endDate: fields.endDate ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updatePublisher(publisherId: string, fields: Partial<Omit<WorkPublisherRecord, 'id' | 'workId' | 'createdAt'>>): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'work_publishers', publisherId), { ...fields, updatedAt: Timestamp.now() });
}

export async function removePublisher(publisherId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'work_publishers', publisherId));
}

export async function getPublishers(workId: string): Promise<WorkPublisherRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'work_publishers'), where('workId', '==', workId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkPublisherRecord);
}

export async function linkTrack(workId: string, trackId: string): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const existing = await getDocs(
    query(collection(db, 'work_tracks'), where('workId', '==', workId), where('trackId', '==', trackId), limit(1)),
  );
  if (!existing.empty) return existing.docs[0]!.id;
  const ref = await addDoc(collection(db, 'work_tracks'), {
    workId,
    trackId,
    createdAt: now,
  });
  return ref.id;
}

export async function unlinkTrack(workId: string, trackId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const snap = await getDocs(
    query(collection(db, 'work_tracks'), where('workId', '==', workId), where('trackId', '==', trackId)),
  );
  for (const d of snap.docs) await deleteDoc(d.ref);
}

export async function getLinkedTracks(workId: string): Promise<{ trackId: string; linkedAt: unknown }[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'work_tracks'), where('workId', '==', workId)),
  );
  return snap.docs.map((d) => ({ trackId: d.data().trackId as string, linkedAt: d.data().createdAt }));
}

export async function findDuplicateWorks(orgId: string, title: string): Promise<WorkRecord[]> {
  const db = getDb();
  if (!db) return [];
  const normalized = title.trim().toLowerCase();
  const snap = await getDocs(
    query(collection(db, 'works'), where('organizationId', '==', orgId)),
  );
  return snap.docs
    .map((d) => toRecord(d.id, d.data() as Record<string, unknown>))
    .filter((w) => w.title.trim().toLowerCase() === normalized);
}
