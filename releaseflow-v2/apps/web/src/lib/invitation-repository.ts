import { doc, getDocs, getDoc, addDoc, updateDoc, collection, query, where, orderBy, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';
import { getSystemRoleForDiscipline } from './disciplines';

export interface InvitationRecord {
  id: string;
  organizationId: string;
  email: string;
  inviterId: string;
  roleId: string;
  discipline?: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  expiresAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CreateInvitationFields {
  organizationId: string;
  email: string;
  inviterId: string;
  roleId?: string;
  discipline?: string;
}

export async function createInvitation(fields: CreateInvitationFields): Promise<InvitationRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const roleId = fields.roleId || (fields.discipline ? getSystemRoleForDiscipline(fields.discipline) : 'contributor');
  const record: Omit<InvitationRecord, 'id'> = {
    organizationId: fields.organizationId,
    email: fields.email,
    inviterId: fields.inviterId,
    roleId,
    discipline: fields.discipline,
    status: 'pending',
    token,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, 'invitations'), record);
  return { id: ref.id, ...record };
}

export async function getInvitationByToken(token: string): Promise<InvitationRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(query(collection(db, 'invitations'), where('token', '==', token)));
  if (snap.empty) return null;
  const docData = snap.docs[0]!;
  return { id: docData.id, ...docData.data() } as InvitationRecord;
}

export async function acceptInvitation(token: string, userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const invitation = await getInvitationByToken(token);
  if (!invitation) throw new Error('Invitation not found');
  if (invitation.status !== 'pending') throw new Error('Invitation is no longer valid');
  const now = Timestamp.now();
  await updateDoc(doc(db, 'invitations', invitation.id), { status: 'accepted', updatedAt: now });
  await addDoc(collection(db, 'memberships'), {
    organizationId: invitation.organizationId,
    userId,
    roleId: invitation.roleId,
    status: 'active',
    invitedBy: invitation.inviterId,
    createdAt: now,
  });
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'invitations', invitationId), { status: 'revoked', updatedAt: Timestamp.now() });
}

export async function resendInvitation(invitationId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const snap = await getDoc(doc(db, 'invitations', invitationId));
  if (!snap.exists()) throw new Error('Invitation not found');
  const now = Timestamp.now();
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await updateDoc(doc(db, 'invitations', invitationId), {
    status: 'pending',
    expiresAt: Timestamp.fromDate(newExpiresAt),
    updatedAt: now,
  });
}

export async function expireOldInvitations(orgId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  const snap = await getDocs(
    query(collection(db, 'invitations'), where('organizationId', '==', orgId), where('status', '==', 'pending')),
  );
  const batch = [];
  for (const d of snap.docs) {
    const data = d.data() as { expiresAt: unknown };
    const expiresAt = data.expiresAt as { toDate?(): Date };
    if (expiresAt && expiresAt.toDate && expiresAt.toDate() < new Date()) {
      batch.push(updateDoc(doc(db, 'invitations', d.id), { status: 'expired', updatedAt: now }));
    }
  }
  await Promise.all(batch);
}

export async function getPendingInvitations(orgId: string): Promise<InvitationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'invitations'), where('organizationId', '==', orgId), where('status', '==', 'pending')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InvitationRecord);
}

export async function getInvitationsByEmail(email: string): Promise<InvitationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'invitations'), where('email', '==', email)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InvitationRecord);
}

export async function getInvitationsByOrg(orgId: string): Promise<InvitationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'invitations'), where('organizationId', '==', orgId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InvitationRecord);
}
