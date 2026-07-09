import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { MediaAsset, MediaAssetType, MediaAssetStatus } from './media-types';

const COLLECTION = 'media_assets';

function toMediaAsset(id: string, data: Record<string, unknown>): MediaAsset {
  return {
    id,
    organizationId: data.organizationId as string,
    releaseId: data.releaseId as string,
    assetType: data.assetType as MediaAssetType,
    title: data.title as string,
    description: data.description as string | undefined,
    storageKey: data.storageKey as string,
    thumbnailUrl: data.thumbnailUrl as string | undefined,
    mimeType: data.mimeType as string,
    fileSize: data.fileSize as number,
    dimensions: data.dimensions as { width: number; height: number } | undefined,
    status: data.status as MediaAssetStatus,
    currentVersionId: data.currentVersionId as string | undefined,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  };
}

export async function createMediaAsset(
  fields: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...fields,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateMediaAsset(
  id: string,
  fields: Partial<Omit<MediaAsset, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, COLLECTION, id), { ...fields, updatedAt: Timestamp.now() });
}

export async function archiveMediaAsset(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, COLLECTION, id), { status: 'archived', updatedAt: Timestamp.now() });
}

export async function deleteMediaAsset(id: string, organizationId?: string, actorId?: string, deleteReason?: string): Promise<void> {
  if (organizationId && actorId) {
    const { softDelete } = await import('@/lib/retention/lifecycle-service');
    await softDelete({ entityType: 'media_asset', entityId: id, organizationId, actorId, deleteReason });
    return;
  }
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function getMediaAsset(id: string): Promise<MediaAsset | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return toMediaAsset(snap.id, snap.data() as Record<string, unknown>);
}

export async function getMediaAssetsByRelease(
  releaseId: string,
  assetType?: MediaAssetType,
): Promise<MediaAsset[]> {
  const db = getDb();
  if (!db) return [];
  const constraints = [where('releaseId', '==', releaseId), orderBy('createdAt', 'desc')];
  if (assetType) constraints.splice(1, 0, where('assetType', '==', assetType));
  const snap = await getDocs(query(collection(db, COLLECTION), ...constraints));
  return snap.docs.map((d) => toMediaAsset(d.id, d.data() as Record<string, unknown>));
}

export async function getMediaAssetsByOrganization(
  organizationId: string,
): Promise<MediaAsset[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, COLLECTION), where('organizationId', '==', organizationId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => toMediaAsset(d.id, d.data() as Record<string, unknown>));
}

export const MEDIA_TYPE_LABELS: Record<MediaAssetType, string> = {
  cover: 'Release Cover',
  booklet: 'Booklet',
  back_cover: 'Back Cover',
  cd_label: 'CD Label',
  vinyl_label: 'Vinyl Label',
  promo_banner: 'Promotional Banner',
  social_artwork: 'Social Media Artwork',
  press_image: 'Press Image',
  marketing_asset: 'Marketing Asset',
};
