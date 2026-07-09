import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';

export type TrackDeliveryVariant =
  'primary_master' | 'radio_edit' | 'instrumental' | 'clean_version' | 'acapella' | 'stems';

export type TrackDeliveryStatus = 'missing' | 'uploaded' | 'validated';

export interface TrackDeliveryRecord {
  id: string;
  trackId: string;
  releaseId: string;
  organizationId: string;
  variant: TrackDeliveryVariant;
  assetId?: string | null;
  url?: string | null;
  filename?: string | null;
  duration?: number | null;
  status: TrackDeliveryStatus;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface CreateTrackDeliveryFields {
  trackId: string;
  releaseId: string;
  organizationId: string;
  variant: TrackDeliveryVariant;
  assetId?: string | null;
  url?: string | null;
  filename?: string | null;
  duration?: number | null;
  status?: TrackDeliveryStatus;
}

export interface UpdateTrackDeliveryFields {
  variant?: TrackDeliveryVariant;
  assetId?: string | null;
  url?: string | null;
  filename?: string | null;
  duration?: number | null;
  status?: TrackDeliveryStatus;
}

export async function getTrackDelivery(deliveryId: string): Promise<TrackDeliveryRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'track_deliveries', deliveryId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as TrackDeliveryRecord;
}

export async function getDeliveriesByTrack(trackId: string): Promise<TrackDeliveryRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'track_deliveries'),
      where('trackId', '==', trackId),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackDeliveryRecord);
}

export async function getDeliveriesByRelease(releaseId: string): Promise<TrackDeliveryRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'track_deliveries'),
      where('releaseId', '==', releaseId),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackDeliveryRecord);
}

export async function createTrackDelivery(
  fields: CreateTrackDeliveryFields,
): Promise<TrackDeliveryRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const data = {
    trackId: fields.trackId,
    releaseId: fields.releaseId,
    organizationId: fields.organizationId,
    variant: fields.variant,
    assetId: fields.assetId ?? null,
    url: fields.url ?? null,
    filename: fields.filename ?? null,
    duration: fields.duration ?? null,
    status: fields.status ?? 'missing',
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, 'track_deliveries'), data);
  return { id: ref.id, ...data } as TrackDeliveryRecord;
}

export async function updateTrackDelivery(
  deliveryId: string,
  fields: UpdateTrackDeliveryFields,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.variant !== undefined) updateData.variant = fields.variant;
  if (fields.assetId !== undefined) updateData.assetId = fields.assetId;
  if (fields.url !== undefined) updateData.url = fields.url;
  if (fields.filename !== undefined) updateData.filename = fields.filename;
  if (fields.duration !== undefined) updateData.duration = fields.duration;
  if (fields.status !== undefined) updateData.status = fields.status;
  await updateDoc(doc(db, 'track_deliveries', deliveryId), updateData);
}

export async function deleteTrackDelivery(deliveryId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'track_deliveries', deliveryId));
}
