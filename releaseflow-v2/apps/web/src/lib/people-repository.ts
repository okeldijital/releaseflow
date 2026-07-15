import {
  collection, query, where, orderBy, getDocs, getDoc, doc,
  addDoc, updateDoc, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface PersonRecord {
  id: string;
  organizationId: string;
  userId?: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  displayName: string;
  legalName?: string | null;
  preferredName?: string | null;
  email: string;
  phone?: string | null;
  timezone?: string | null;
  department?: string | null;
  position?: string | null;
  employmentType?: string | null;
  primaryRole: string;
  bio?: string | null;
  skills?: string[] | null;
  languages?: string[] | null;
  status: 'active' | 'archived';
  invitationStatus?: 'invited' | 'pending' | 'accepted' | 'declined' | 'expired' | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  deletedAt?: unknown;
  deletedBy?: string | null;
  deleteReason?: string | null;
}

export interface CreatePersonFields {
  organizationId: string;
  userId?: string;
  avatarUrl?: string | null;
  displayName: string;
  email: string;
  primaryRole: string;
  legalName?: string | null;
  preferredName?: string | null;
  phone?: string | null;
  timezone?: string | null;
  department?: string | null;
  position?: string | null;
  employmentType?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  languages?: string[] | null;
}

export interface UpdatePersonFields {
  userId?: string;
  displayName?: string;
  legalName?: string | null;
  preferredName?: string | null;
  email?: string;
  phone?: string | null;
  timezone?: string | null;
  department?: string | null;
  position?: string | null;
  employmentType?: string | null;
  primaryRole?: string;
  bio?: string | null;
  skills?: string[] | null;
  languages?: string[] | null;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  status?: 'active' | 'archived';
  invitationStatus?: 'invited' | 'pending' | 'accepted' | 'declined' | 'expired' | null;
}

function toRecord(id: string, data: Record<string, unknown>): PersonRecord {
  return {
    id,
    organizationId: data.organizationId as string || '',
    displayName: data.displayName as string || '',
    email: data.email as string || '',
    primaryRole: data.primaryRole as string || '',
    status: (data.status as 'active' | 'archived') || 'active',
    userId: data.userId as string | undefined,
    avatarUrl: data.avatarUrl as string | null | undefined,
    avatarPublicId: data.avatarPublicId as string | null | undefined,
    legalName: data.legalName as string | null | undefined,
    preferredName: data.preferredName as string | null | undefined,
    phone: data.phone as string | null | undefined,
    timezone: data.timezone as string | null | undefined,
    department: data.department as string | null | undefined,
    position: data.position as string | null | undefined,
    employmentType: data.employmentType as string | null | undefined,
    bio: data.bio as string | null | undefined,
    skills: data.skills as string[] | null | undefined,
    languages: data.languages as string[] | null | undefined,
    invitationStatus: data.invitationStatus as PersonRecord['invitationStatus'],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt,
    deletedBy: data.deletedBy as string | null | undefined,
    deleteReason: data.deleteReason as string | null | undefined,
  };
}

/**
 * Persists a new Person document.
 *
 * ARCHITECTURE — restricted creation path.
 * Persons may only be created by:
 *   1. Organization owner provisioning (person-service.ensureOwnerPerson)
 *   2. Invitation acceptance (invitation-service.acceptPersonInvitation)
 * plus the service-mediated "Add Person" roster flow (person-service.createNewPerson).
 *
 * Do NOT call this method for general application workflows and never call it
 * directly from UI components — always go through the service layer so that
 * identity rules (one Person per organizationId + userId) are enforced.
 */
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
  return toRecord(ref.id, { ...fields, id: ref.id, status: 'active', createdAt: now, updatedAt: now });
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
  return toRecord(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Resolves a Person by organizationId + email.
 *
 * ARCHITECTURE — invitation reconciliation ONLY.
 * Email is not a permanent identity. This method exists solely to reconnect an
 * invitation-created Person that has not yet been linked to a Firebase account.
 * It must NOT be used for authenticated lookups — once a Person has a userId,
 * always resolve via getPersonByOrganizationAndUserId instead.
 */
export async function getPersonByEmail(orgId: string, email: string): Promise<PersonRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(query(collection(db, 'people'), where('email', '==', email)));
  const match = snap.docs.find((d) => (d.data() as Record<string, unknown>).organizationId === orgId);
  if (!match) return null;
  return toRecord(match.id, match.data() as Record<string, unknown>);
}

/**
 * Canonical identity lookup for an authenticated collaborator.
 *
 * Resolves a Person by organizationId + userId. This is the stable, canonical
 * identity for a collaborator once their Person has been linked to a Firebase
 * account, and MUST be preferred over email-based lookups after authentication.
 */
export async function getPersonByOrganizationAndUserId(
  organizationId: string,
  userId: string,
): Promise<PersonRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(
      collection(db, 'people'),
      where('organizationId', '==', organizationId),
      where('userId', '==', userId),
    ),
  );
  const docData = snap.docs[0];
  if (!docData) return null;
  return toRecord(docData.id, docData.data() as Record<string, unknown>);
}

export async function getPeopleByOrg(orgId: string): Promise<PersonRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'people'),
      where('organizationId', '==', orgId),
      orderBy('displayName', 'asc'),
    ),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
}

export async function searchPeople(orgId: string, queryStr: string): Promise<PersonRecord[]> {
  const db = getDb();
  if (!db) return [];
  const q = queryStr.toLowerCase();
  const snap = await getDocs(
    query(
      collection(db, 'people'),
      where('organizationId', '==', orgId),
    ),
  );
  return snap.docs
    .map((d) => toRecord(d.id, d.data() as Record<string, unknown>))
    .filter((p) => {
      if (p.displayName.toLowerCase().includes(q)) return true;
      if (p.email.toLowerCase().includes(q)) return true;
      if (p.department?.toLowerCase().includes(q)) return true;
      if (p.skills?.some((s) => s.toLowerCase().includes(q))) return true;
      return false;
    });
}

export async function archivePerson(personId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'people', personId), { status: 'archived', updatedAt: Timestamp.now() });
}

export async function restorePerson(personId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'people', personId), { status: 'active', updatedAt: Timestamp.now() });
}

export async function updateSkills(personId: string, skills: string[]): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'people', personId), { skills, updatedAt: Timestamp.now() });
}

export async function getAssignmentSummary(personId: string): Promise<{
  current: number; completed: number; overdue: number; upcoming: number;
}> {
  const db = getDb();
  if (!db) return { current: 0, completed: 0, overdue: 0, upcoming: 0 };
  const snap = await getDocs(
    query(
      collection(db, 'assignments'),
      where('assigneeId', '==', personId),
    ),
  );
  let current = 0, completed = 0, overdue = 0, upcoming = 0;
  const now = new Date();
  snap.docs.forEach((d) => {
    const data = d.data();
    const status = data.status as string;
    const dueDate = data.dueDate as Timestamp | undefined;
    if (status === 'completed') {
      completed++;
    } else if (status === 'archived' || status === 'cancelled') {
      current++;
    } else if (dueDate) {
      if (dueDate.toDate().getTime() < now.getTime()) {
        overdue++;
      } else {
        upcoming++;
      }
    } else {
      current++;
    }
  });
  return { current, completed, overdue, upcoming };
}
