import {
  doc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, Timestamp, type WriteBatch,
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface PersonMembershipRecord {
  id: string;
  organizationId: string;
  personId: string;
  role: string;
  department?: string | null;
  joinedAt: unknown;
  leftAt?: unknown | null;
  isPrimary: boolean;
  status: 'active' | 'inactive';
}

export interface CreateMembershipFields {
  organizationId: string;
  personId: string;
  role: string;
  department?: string | null;
  isPrimary?: boolean;
}

function toRecord(id: string, data: Record<string, unknown>): PersonMembershipRecord {
  return {
    id,
    organizationId: data.organizationId as string || '',
    personId: data.personId as string || '',
    role: data.role as string || 'member',
    department: data.department as string | null | undefined,
    joinedAt: data.joinedAt as unknown,
    leftAt: data.leftAt as unknown | null | undefined,
    isPrimary: (data.isPrimary as boolean) ?? false,
    status: (data.status as 'active' | 'inactive') || 'active',
  };
}

export async function addPersonToOrganization(
  fields: CreateMembershipFields,
): Promise<PersonMembershipRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const existing = await getDocs(
    query(
      collection(db, 'person_memberships'),
      where('personId', '==', fields.personId),
      where('organizationId', '==', fields.organizationId),
      where('status', '==', 'active'),
      limit(1),
    ),
  );
  if (!existing.empty) {
    const existingRec = toRecord(existing.docs[0]!.id, existing.docs[0]!.data() as Record<string, unknown>);
    throw new Error(`Already a member of this organization (membership: ${existingRec.id})`);
  }
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'person_memberships'), {
    ...fields,
    department: fields.department ?? null,
    isPrimary: fields.isPrimary ?? false,
    status: 'active',
    joinedAt: now,
    leftAt: null,
  });
  return toRecord(ref.id, { ...fields, id: ref.id, status: 'active', joinedAt: now, leftAt: null });
}

export async function removePersonFromOrganization(membershipId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'person_memberships', membershipId), {
    status: 'inactive',
    leftAt: Timestamp.now(),
  });
}

export async function updateMembership(
  membershipId: string,
  fields: Partial<Pick<PersonMembershipRecord, 'role' | 'department' | 'isPrimary'>>,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'person_memberships', membershipId), { ...fields });
}

export async function getMembershipsForPerson(personId: string): Promise<PersonMembershipRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'person_memberships'),
      where('personId', '==', personId),
      orderBy('joinedAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
}

export async function getActiveMembershipsForPerson(personId: string): Promise<PersonMembershipRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'person_memberships'),
      where('personId', '==', personId),
      where('status', '==', 'active'),
      orderBy('joinedAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
}

export async function getMembersByOrg(orgId: string): Promise<PersonMembershipRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'person_memberships'),
      where('organizationId', '==', orgId),
      where('status', '==', 'active'),
    ),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
}

export async function deleteMembership(membershipId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'person_memberships', membershipId));
}

export async function migrateMemberships(
  batch: WriteBatch,
  sourcePersonId: string,
  destinationPersonId: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const snap = await getDocs(
    query(collection(db, 'person_memberships'), where('personId', '==', sourcePersonId)),
  );
  snap.docs.forEach((d) => {
    batch.update(d.ref, { personId: destinationPersonId });
  });
}
