import { collection, query, where, orderBy, getDocs, getDoc, doc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { getDb } from './firebase';

export interface PersonRecord {
  id: string;
  organizationId: string;
  userId?: string;
  avatarUrl?: string | null;
  displayName: string;
  email: string;
  primaryRole: string;
  status: 'active' | 'archived';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CreatePersonFields {
  organizationId: string;
  userId?: string;
  avatarUrl?: string | null;
  displayName: string;
  email: string;
  primaryRole: string;
}

export interface UpdatePersonFields {
  displayName?: string;
  email?: string;
  primaryRole?: string;
  avatarUrl?: string | null;
  status?: 'active' | 'archived';
}

export async function createPerson(fields: CreatePersonFields): Promise<PersonRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'people'), {
    ...fields,
    avatarUrl: fields.avatarUrl ?? null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: ref.id,
    organizationId: fields.organizationId,
    userId: fields.userId,
    avatarUrl: fields.avatarUrl ?? null,
    displayName: fields.displayName,
    email: fields.email,
    primaryRole: fields.primaryRole,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

export async function updatePerson(personId: string, fields: UpdatePersonFields): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'people', personId), { ...fields, updatedAt: Timestamp.now() });
}

export async function getPerson(personId: string): Promise<PersonRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'people', personId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as PersonRecord;
}

export async function getPeopleByOrg(orgId: string): Promise<PersonRecord[]> {
  const db = getDb();
  if (!db) return [];
  console.log('[people-repo] Active Org:', orgId);
  const snap = await getDocs(
    query(
      collection(db, 'people'),
      where('organizationId', '==', orgId),
      orderBy('displayName', 'asc'),
    ),
  );
  console.log('[people-repo] Query returned:', snap.size, 'documents');
  console.log('[people-repo] Raw docs:', snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  const mapped = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PersonRecord);
  console.log('[people-repo] Mapped people:', mapped.length, mapped);
  return mapped;
}

export async function archivePerson(personId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'people', personId), { status: 'archived', updatedAt: Timestamp.now() });
}
