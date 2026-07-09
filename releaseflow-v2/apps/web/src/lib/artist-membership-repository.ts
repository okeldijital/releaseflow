import {
  doc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, Timestamp, writeBatch,
} from '@firebase/firestore';
import { getDb } from './firebase';

export interface ArtistMembershipRecord {
  id: string;
  artistId: string;
  groupArtistId: string;
  role: string;
  joinedAt: unknown;
  leftAt?: unknown | null;
  isActive: boolean;
  position?: string | null;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface CreateMembershipFields {
  artistId: string;
  groupArtistId: string;
  role?: string;
  position?: string;
}

export interface UpdateMembershipFields {
  role?: string;
  position?: string | null;
  isActive?: boolean;
  leftAt?: unknown | null;
}

const COLLECTION = 'artist_memberships';

function toRecord(id: string, data: Record<string, unknown>): ArtistMembershipRecord {
  return {
    id,
    artistId: data.artistId as string,
    groupArtistId: data.groupArtistId as string,
    role: (data.role as string) ?? 'member',
    joinedAt: data.joinedAt,
    leftAt: data.leftAt ?? null,
    isActive: (data.isActive as boolean) ?? true,
    position: (data.position as string | null) ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function addArtistToGroup(fields: CreateMembershipFields): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  if (fields.artistId === fields.groupArtistId) throw new Error('An artist cannot be a member of itself');

  const existing = await getDocs(
    query(
      collection(db, COLLECTION),
      where('artistId', '==', fields.artistId),
      where('groupArtistId', '==', fields.groupArtistId),
      where('isActive', '==', true),
      limit(1),
    ),
  );
  if (!existing.empty) {
    const existingRec = toRecord(existing.docs[0]!.id, existing.docs[0]!.data());
    throw new Error(`Already a member of this group (role: ${existingRec.role})`);
  }

  const now = Timestamp.now();
  const ref = await addDoc(collection(db, COLLECTION), {
    artistId: fields.artistId,
    groupArtistId: fields.groupArtistId,
    role: fields.role ?? 'member',
    position: fields.position ?? null,
    joinedAt: now,
    leftAt: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function removeArtistFromGroup(membershipId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, COLLECTION, membershipId), {
    isActive: false,
    leftAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateMembership(
  membershipId: string,
  fields: UpdateMembershipFields,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.role !== undefined) update.role = fields.role;
  if (fields.position !== undefined) update.position = fields.position;
  if (fields.isActive !== undefined) update.isActive = fields.isActive;
  if (fields.leftAt !== undefined) update.leftAt = fields.leftAt;
  await updateDoc(doc(db, COLLECTION, membershipId), update);
}

export async function getGroupsForArtist(artistId: string): Promise<ArtistMembershipRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where('artistId', '==', artistId),
      where('isActive', '==', true),
      orderBy('joinedAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
}

export async function getMembersOfGroup(groupArtistId: string): Promise<ArtistMembershipRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where('groupArtistId', '==', groupArtistId),
      where('isActive', '==', true),
      orderBy('joinedAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>));
}

export async function getAllMembershipsForArtist(
  artistId: string,
): Promise<ArtistMembershipRecord[]> {
  const db = getDb();
  if (!db) return [];
  const [asMember, asGroup] = await Promise.all([
    getDocs(query(collection(db, COLLECTION), where('artistId', '==', artistId))),
    getDocs(query(collection(db, COLLECTION), where('groupArtistId', '==', artistId))),
  ]);
  return [
    ...asMember.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>)),
    ...asGroup.docs.map((d) => toRecord(d.id, d.data() as Record<string, unknown>)),
  ];
}

export async function deleteMembership(membershipId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, COLLECTION, membershipId));
}

export async function migrateMemberships(
  sourceArtistId: string,
  destinationArtistId: string,
  batch: ReturnType<typeof writeBatch>,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  const [asMember, asGroup] = await Promise.all([
    getDocs(query(collection(db, COLLECTION), where('artistId', '==', sourceArtistId))),
    getDocs(query(collection(db, COLLECTION), where('groupArtistId', '==', sourceArtistId))),
  ]);

  for (const d of asMember.docs) {
    batch.update(d.ref, { artistId: destinationArtistId, updatedAt: Timestamp.now() });
  }
  for (const d of asGroup.docs) {
    batch.update(d.ref, { groupArtistId: destinationArtistId, updatedAt: Timestamp.now() });
  }
}
