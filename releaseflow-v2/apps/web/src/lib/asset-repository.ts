import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export interface AssetRecord {
  id: string;
  deliverableId: string;
  releaseId?: string | null;
  provider: string;
  url: string;
  filename: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  metadata?: Record<string, unknown> | null;
  uploadedAt: unknown;
  updatedAt?: unknown;
}

export interface CreateAssetFields {
  deliverableId: string;
  releaseId?: string | null;
  provider: string;
  url: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateAssetFields {
  provider?: string;
  url?: string;
  filename?: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  metadata?: Record<string, unknown> | null;
}

export const ASSET_TYPE_RULES: Record<string, { label: string; extensions: string[]; maxSizeMB: number }> = {
  artwork: { label: 'Artwork', extensions: ['jpg', 'jpeg', 'png', 'tiff'], maxSizeMB: 50 },
  audio: { label: 'Audio', extensions: ['wav', 'flac', 'mp3', 'aiff', 'aif'], maxSizeMB: 500 },
  video: { label: 'Video', extensions: ['mp4', 'mov', 'avi'], maxSizeMB: 2000 },
  document: { label: 'Document', extensions: ['pdf', 'doc', 'docx', 'txt'], maxSizeMB: 25 },
  image: { label: 'Image', extensions: ['jpg', 'jpeg', 'png', 'tiff', 'gif', 'webp'], maxSizeMB: 50 },
};

export async function addAsset(fields: CreateAssetFields): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'asset_references'), {
    deliverableId: fields.deliverableId,
    releaseId: fields.releaseId ?? null,
    provider: fields.provider,
    url: fields.url,
    filename: fields.filename,
    contentType: fields.contentType ?? null,
    sizeBytes: fields.sizeBytes ?? null,
    metadata: fields.metadata ?? null,
    uploadedAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateAsset(assetId: string, fields: UpdateAssetFields): Promise<void> {
  const db = getDb();
  if (!db) return;
  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.provider !== undefined) update.provider = fields.provider;
  if (fields.url !== undefined) update.url = fields.url;
  if (fields.filename !== undefined) update.filename = fields.filename;
  if (fields.contentType !== undefined) update.contentType = fields.contentType;
  if (fields.sizeBytes !== undefined) update.sizeBytes = fields.sizeBytes;
  if (fields.metadata !== undefined) update.metadata = fields.metadata;
  await updateDoc(doc(db, 'asset_references', assetId), update);
}

export async function deleteAsset(assetId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'asset_references', assetId));
}

export async function getAsset(assetId: string): Promise<AssetRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'asset_references', assetId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AssetRecord;
}

export async function getAssetsByDeliverable(deliverableId: string): Promise<AssetRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'asset_references'), where('deliverableId', '==', deliverableId), orderBy('uploadedAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AssetRecord);
}

export async function getAssetsByRelease(releaseId: string): Promise<AssetRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'asset_references'), where('releaseId', '==', releaseId), orderBy('uploadedAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AssetRecord);
}

export async function validateAssetRef(filename: string, sizeBytes?: number): Promise<{ valid: boolean; type?: string; error?: string }> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  for (const [type, rules] of Object.entries(ASSET_TYPE_RULES)) {
    if (rules.extensions.includes(ext)) {
      if (sizeBytes && sizeBytes > rules.maxSizeMB * 1024 * 1024) {
        return { valid: false, error: `${rules.label} exceeds max size of ${rules.maxSizeMB}MB` };
      }
      return { valid: true, type };
    }
  }
  return { valid: false, error: `Unsupported file type: .${ext}` };
}

export async function getAssetCountByRelease(releaseId: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const snap = await getDocs(
    query(collection(db, 'asset_references'), where('releaseId', '==', releaseId)),
  );
  return snap.size;
}

export async function checkAssetCompleteness(releaseId: string): Promise<{ hasArtwork: boolean; hasAudio: boolean; total: number; missing: string[] }> {
  const assets = await getAssetsByRelease(releaseId);
  const hasArtwork = assets.some((a) => a.contentType?.startsWith('image/'));
  const hasAudio = assets.some((a) => a.contentType?.startsWith('audio/'));
  const missing: string[] = [];
  if (!hasArtwork) missing.push('artwork');
  if (!hasAudio) missing.push('audio');
  return { hasArtwork, hasAudio, total: assets.length, missing };
}
