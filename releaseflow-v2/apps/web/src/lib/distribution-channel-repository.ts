import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export type DistributionChannel =
  'spotify' | 'apple_music' | 'youtube_music' | 'deezer' | 'amazon_music'
  | 'tidal' | 'beatport' | 'bandcamp' | 'soundcloud';

export type DistributionChannelStatus =
  'planned' | 'submitted' | 'delivered' | 'live' | 'rejected';

export interface DistributionChannelRecord {
  id: string;
  releaseId: string;
  organizationId: string;
  channel: DistributionChannel;
  status: DistributionChannelStatus;
  deliveryDate?: string | null;
  publicationDate?: string | null;
  notes?: string | null;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface CreateDistributionChannelFields {
  releaseId: string;
  organizationId: string;
  channel: DistributionChannel;
  status?: DistributionChannelStatus;
  deliveryDate?: string | null;
  publicationDate?: string | null;
  notes?: string | null;
}

export interface UpdateDistributionChannelFields {
  channel?: DistributionChannel;
  status?: DistributionChannelStatus;
  deliveryDate?: string | null;
  publicationDate?: string | null;
  notes?: string | null;
}

export async function getDistributionChannel(channelId: string): Promise<DistributionChannelRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'distribution_channels', channelId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as DistributionChannelRecord;
}

export async function getChannelsByRelease(releaseId: string): Promise<DistributionChannelRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'distribution_channels'),
      where('releaseId', '==', releaseId),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DistributionChannelRecord);
}

export async function createDistributionChannel(
  fields: CreateDistributionChannelFields,
): Promise<DistributionChannelRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const data = {
    releaseId: fields.releaseId,
    organizationId: fields.organizationId,
    channel: fields.channel,
    status: fields.status ?? 'planned',
    deliveryDate: fields.deliveryDate ?? null,
    publicationDate: fields.publicationDate ?? null,
    notes: fields.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, 'distribution_channels'), data);
  return { id: ref.id, ...data } as DistributionChannelRecord;
}

export async function updateDistributionChannel(
  channelId: string,
  fields: UpdateDistributionChannelFields,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.channel !== undefined) updateData.channel = fields.channel;
  if (fields.status !== undefined) updateData.status = fields.status;
  if (fields.deliveryDate !== undefined) updateData.deliveryDate = fields.deliveryDate;
  if (fields.publicationDate !== undefined) updateData.publicationDate = fields.publicationDate;
  if (fields.notes !== undefined) updateData.notes = fields.notes;
  await updateDoc(doc(db, 'distribution_channels', channelId), updateData);
}

export async function deleteDistributionChannel(channelId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'distribution_channels', channelId));
}
