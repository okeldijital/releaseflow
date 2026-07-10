import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { traceMediaBefore, traceMediaError, type TraceOpts } from './media-debug-trace';
import type { MediaAsset, MediaAssetType, MediaAssetStatus } from './media-types';

/**
 * Media assets are stored as an organization subcollection:
 *   organizations/{orgId}/media_assets/{assetId}
 * following ReleaseFlow's multi-tenant architecture.
 */
const SUBCOLLECTION = 'media_assets';

function assetsCol(db: NonNullable<ReturnType<typeof getDb>>, organizationId: string) {
  return collection(db, 'organizations', organizationId, SUBCOLLECTION);
}

function assetDoc(db: NonNullable<ReturnType<typeof getDb>>, organizationId: string, id: string) {
  return doc(db, 'organizations', organizationId, SUBCOLLECTION, id);
}

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
    secureUrl: data.secureUrl as string | undefined,
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
  if (!fields.organizationId) throw new Error('organizationId required');
  const now = Timestamp.now();
  const ref = await addDoc(assetsCol(db, fields.organizationId), {
    ...fields,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateMediaAsset(
  organizationId: string,
  id: string,
  fields: Partial<Omit<MediaAsset, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(assetDoc(db, organizationId, id), { ...fields, updatedAt: Timestamp.now() });
}

export async function archiveMediaAsset(organizationId: string, id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(assetDoc(db, organizationId, id), { status: 'archived', updatedAt: Timestamp.now() });
}

export async function deleteMediaAsset(
  organizationId: string,
  id: string,
  actorId?: string,
  deleteReason?: string,
): Promise<void> {
  if (actorId) {
    const { softDelete } = await import('@/lib/retention/lifecycle-service');
    await softDelete({ entityType: 'media_asset', entityId: id, organizationId, actorId, deleteReason });
    return;
  }
  const db = getDb();
  if (!db) return;
  await deleteDoc(assetDoc(db, organizationId, id));
}

export async function getMediaAsset(organizationId: string, id: string): Promise<MediaAsset | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(assetDoc(db, organizationId, id));
  if (!snap.exists()) return null;
  return toMediaAsset(snap.id, snap.data() as Record<string, unknown>);
}

export async function getMediaAssetsByRelease(
  organizationId: string,
  releaseId: string,
  assetType?: MediaAssetType,
): Promise<MediaAsset[]> {
  const db = getDb();
  if (!db) return [];
  const constraints = [where('releaseId', '==', releaseId), orderBy('createdAt', 'desc')];
  if (assetType) constraints.splice(1, 0, where('assetType', '==', assetType));
  const q = query(assetsCol(db, organizationId), ...constraints);
  const trace: TraceOpts = {
    repo: 'media_assets',
    op: 'getMediaAssetsByRelease',
    organizationId,
    releaseId,
    queryPath: `organizations/${organizationId}/media_assets`,
    constraints: `where(releaseId==${releaseId}), orderBy(createdAt desc)${assetType ? `, where(assetType==${assetType})` : ''}`,
  };
  traceMediaBefore(trace);
  let snap;
  try {
    snap = await getDocs(q);
  } catch (e) {
    traceMediaError(trace, e);
    throw e;
  }
  return snap.docs.map((d) => toMediaAsset(d.id, d.data() as Record<string, unknown>));
}

export async function getMediaAssetsByOrganization(
  organizationId: string,
): Promise<MediaAsset[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(assetsCol(db, organizationId), orderBy('createdAt', 'desc'));
  const trace: TraceOpts = {
    repo: 'media_assets',
    op: 'getMediaAssetsByOrganization',
    organizationId,
    queryPath: `organizations/${organizationId}/media_assets`,
    constraints: 'orderBy(createdAt desc)',
  };
  traceMediaBefore(trace);
  let snap;
  try {
    snap = await getDocs(q);
  } catch (e) {
    traceMediaError(trace, e);
    throw e;
  }
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
