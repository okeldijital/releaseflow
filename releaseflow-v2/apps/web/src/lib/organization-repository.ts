import { collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt?: unknown;
}

export interface MembershipRecord {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  status: 'active' | 'pending' | 'inactive';
  invitedBy?: string;
  createdAt?: unknown;
}

export async function getOrganizationsByUser(userId: string): Promise<OrganizationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(collection(db, 'memberships'), where('userId', '==', userId), where('status', '==', 'active'));
  const snapshot = await getDocs(q);
  const orgs: OrganizationRecord[] = [];
  for (const d of snapshot.docs) {
    const membership = d.data() as { organizationId: string };
    const orgSnap = await getDoc(doc(db, 'organizations', membership.organizationId));
    if (orgSnap.exists()) orgs.push({ id: orgSnap.id, ...orgSnap.data() } as OrganizationRecord);
  }
  return orgs;
}

export async function getPendingMemberships(userId: string): Promise<(MembershipRecord & { orgName?: string })[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(collection(db, 'memberships'), where('userId', '==', userId), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  const results: (MembershipRecord & { orgName?: string })[] = [];
  for (const d of snapshot.docs) {
    const m = { id: d.id, ...d.data() } as MembershipRecord;
    const orgSnap = await getDoc(doc(db, 'organizations', m.organizationId));
    const orgName = orgSnap.exists() ? (orgSnap.data() as { name: string }).name : m.organizationId;
    results.push({ ...m, orgName });
  }
  return results;
}

export async function createOrganization(
  name: string,
  slug: string,
  ownerId: string,
): Promise<OrganizationRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const orgRef = await addDoc(collection(db, 'organizations'), {
    name, slug, ownerId, createdAt: Timestamp.now(),
  });
  await addDoc(collection(db, 'memberships'), {
    organizationId: orgRef.id,
    userId: ownerId,
    roleId: 'owner',
    status: 'active',
    invitedBy: ownerId,
    createdAt: Timestamp.now(),
  });
  const snap = await getDoc(doc(db, 'organizations', orgRef.id));
  if (!snap.exists()) throw new Error('Created organization not found');
  return { id: snap.id, ...snap.data() } as OrganizationRecord;
}

export async function acceptMembership(membershipId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'memberships', membershipId), { status: 'active' });
}

export async function removeMembership(membershipId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'memberships', membershipId));
}

export async function updateMembershipRole(membershipId: string, roleId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'memberships', membershipId), { roleId });
}

export async function getMembershipsByOrg(orgId: string): Promise<MembershipRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'memberships'), where('organizationId', '==', orgId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MembershipRecord);
}

export async function updateOrganization(
  orgId: string,
  data: Partial<Pick<OrganizationRecord, 'name' | 'slug'>>,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'organizations', orgId), { ...data });
}

export async function getUserRole(userId: string): Promise<string> {
  const db = getDb();
  if (!db) return 'contributor';
  const snap = await getDocs(
    query(collection(db, 'memberships'), where('userId', '==', userId), where('status', '==', 'active')),
  );
  if (!snap.empty && snap.docs[0]) {
    return (snap.docs[0].data() as { roleId: string }).roleId;
  }
  return 'contributor';
}

export async function userHasOrganization(userId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const q = query(collection(db, 'memberships'), where('userId', '==', userId), where('status', '==', 'active'));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function getOrganization(orgId: string): Promise<OrganizationRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'organizations', orgId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as OrganizationRecord;
}
