import { doc, getDocs, addDoc, updateDoc, collection, query, where, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';

export interface InvitationRecord {
  id: string;
  organizationId: string;
  email: string;
  inviterId: string;
  roleId: string;
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'revoked';
  token: string;
  expiresAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CreateInvitationFields {
  organizationId: string;
  email: string;
  inviterId: string;
  roleId: string;
}

export async function createInvitation(fields: CreateInvitationFields): Promise<InvitationRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const record: Omit<InvitationRecord, 'id'> = {
    organizationId: fields.organizationId,
    email: fields.email,
    inviterId: fields.inviterId,
    roleId: fields.roleId,
    status: 'sent',
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
  if (invitation.status !== 'sent') throw new Error('Invitation is no longer valid');
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

export async function getPendingInvitations(orgId: string): Promise<InvitationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'invitations'), where('organizationId', '==', orgId), where('status', '==', 'sent')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InvitationRecord);
}

export async function getInvitationsByEmail(email: string): Promise<InvitationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'invitations'), where('email', '==', email)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InvitationRecord);
}
