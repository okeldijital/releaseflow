import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';

export type AssetLifecycleState = 'requested' | 'assigned' | 'in_progress' | 'delivered' | 'approved' | 'attached';
export type AssetType = 'audio' | 'artwork' | 'video' | 'document' | 'other';

export interface TrackAsset {
  id: string;
  trackId: string;
  organizationId: string;
  name: string;
  type: AssetType;
  lifecycleState: AssetLifecycleState;
  assignedPersonId?: string | null;
  url?: string | null;
  filename?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  notes?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

const VALID_FORWARD_TRANSITIONS: Record<AssetLifecycleState, AssetLifecycleState[]> = {
  requested: ['assigned'],
  assigned: ['in_progress'],
  in_progress: ['delivered'],
  delivered: ['approved'],
  approved: ['attached'],
  attached: [],
};

function isValidTransition(from: AssetLifecycleState, to: AssetLifecycleState): boolean {
  if (to === 'requested' && from !== 'requested') return true;
  return VALID_FORWARD_TRANSITIONS[from]?.includes(to) ?? false;
}

const STATE_LABELS: Record<AssetLifecycleState, string> = {
  requested: 'Requested',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  delivered: 'Delivered',
  approved: 'Approved',
  attached: 'Attached',
};

export function getStateLabel(state: AssetLifecycleState): string {
  return STATE_LABELS[state] || state;
}

async function getTrackAsset(assetId: string): Promise<TrackAsset | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'track_assets', assetId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as TrackAsset;
}

async function transitionAsset(assetId: string, toState: AssetLifecycleState, extra?: Record<string, unknown>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const current = await getTrackAsset(assetId);
  if (!current) throw new Error('Asset not found');

  if (!isValidTransition(current.lifecycleState, toState)) {
    throw new Error(
      `Invalid transition: ${getStateLabel(current.lifecycleState)} → ${getStateLabel(toState)}`,
    );
  }

  const update: Record<string, unknown> = {
    lifecycleState: toState,
    updatedAt: Timestamp.now(),
    ...extra,
  };

  await updateDoc(doc(db, 'track_assets', assetId), update);

  console.log(
    `[asset-lifecycle] ${assetId}: ${getStateLabel(current.lifecycleState)} → ${getStateLabel(toState)}`,
  );
}

export async function createRequestedAsset(
  trackId: string,
  organizationId: string,
  name: string,
  type: AssetType,
  notes?: string,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Timestamp.now();
  const ref = await addDoc(collection(db, 'track_assets'), {
    trackId,
    organizationId,
    name,
    type,
    lifecycleState: 'requested' as AssetLifecycleState,
    assignedPersonId: null,
    url: null,
    filename: null,
    contentType: null,
    sizeBytes: null,
    notes: notes ?? null,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`[asset-lifecycle] Created requested asset ${ref.id} for track ${trackId} (${type}: ${name})`);
  return ref.id;
}

export async function assignAsset(assetId: string, personId: string): Promise<void> {
  await transitionAsset(assetId, 'assigned', { assignedPersonId: personId });
}

export async function startAssetWork(assetId: string): Promise<void> {
  await transitionAsset(assetId, 'in_progress');
}

export async function deliverAsset(
  assetId: string,
  url?: string,
  filename?: string,
  contentType?: string,
  sizeBytes?: number,
): Promise<void> {
  const extra: Record<string, unknown> = {};
  if (url !== undefined) extra.url = url;
  if (filename !== undefined) extra.filename = filename;
  if (contentType !== undefined) extra.contentType = contentType;
  if (sizeBytes !== undefined) extra.sizeBytes = sizeBytes;
  await transitionAsset(assetId, 'delivered', extra);
}

export async function approveAsset(assetId: string): Promise<void> {
  await transitionAsset(assetId, 'approved');
}

export async function attachAsset(assetId: string, releaseId: string): Promise<void> {
  await transitionAsset(assetId, 'attached', { releaseId });
}

export async function rejectAsset(assetId: string, reason?: string): Promise<void> {
  const extra: Record<string, unknown> = {};
  if (reason) extra.notes = reason;
  await transitionAsset(assetId, 'requested', extra);
}

export async function getAssetsByTrack(trackId: string): Promise<TrackAsset[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'track_assets'),
      where('trackId', '==', trackId),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackAsset);
}

export async function getRequestedAssets(trackId: string): Promise<TrackAsset[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'track_assets'),
      where('trackId', '==', trackId),
      where('lifecycleState', '==', 'requested'),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackAsset);
}

export async function getAvailableAssets(trackId: string): Promise<TrackAsset[]> {
  const db = getDb();
  if (!db) return [];
  const all = await getAssetsByTrack(trackId);
  return all.filter((a) =>
    a.lifecycleState === 'delivered' ||
    a.lifecycleState === 'approved' ||
    a.lifecycleState === 'attached',
  );
}
