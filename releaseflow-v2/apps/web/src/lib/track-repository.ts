import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { TrackStatus } from '@/app/(app)/types';

export interface TrackRecord {
  id: string;
  organizationId: string;
  title: string;
  version?: string;
  subtitle?: string;
  trackNumber?: number;
  discNumber?: number;
  isrc?: string;
  duration?: number;
  language?: string;
  explicit: boolean;
  genre?: string;
  bpm?: number;
  musicalKey?: string;
  status: TrackStatus;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateTrackFields {
  organizationId: string;
  title: string;
  createdBy: string;
  version?: string;
  subtitle?: string;
  trackNumber?: number;
  discNumber?: number;
  isrc?: string;
  duration?: number;
  language?: string;
  explicit?: boolean;
  genre?: string;
  bpm?: number;
  musicalKey?: string;
}

export interface UpdateTrackFields {
  title?: string;
  version?: string | null;
  subtitle?: string | null;
  trackNumber?: number | null;
  discNumber?: number | null;
  isrc?: string | null;
  duration?: number | null;
  language?: string | null;
  explicit?: boolean;
  genre?: string | null;
  bpm?: number | null;
  musicalKey?: string | null;
  status?: TrackStatus;
}

export async function createTrack(fields: CreateTrackFields): Promise<TrackRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, 'tracks'), {
    organizationId: fields.organizationId,
    title: fields.title,
    version: fields.version ?? null,
    subtitle: fields.subtitle ?? null,
    trackNumber: fields.trackNumber ?? null,
    discNumber: fields.discNumber ?? null,
    isrc: fields.isrc ?? null,
    duration: fields.duration ?? null,
    language: fields.language ?? null,
    explicit: fields.explicit ?? false,
    genre: fields.genre ?? null,
    bpm: fields.bpm ?? null,
    musicalKey: fields.musicalKey ?? null,
    status: 'draft' satisfies TrackStatus,
    createdBy: fields.createdBy,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: docRef.id,
    organizationId: fields.organizationId,
    title: fields.title,
    version: fields.version,
    subtitle: fields.subtitle,
    trackNumber: fields.trackNumber,
    discNumber: fields.discNumber,
    isrc: fields.isrc,
    duration: fields.duration,
    language: fields.language,
    explicit: fields.explicit ?? false,
    genre: fields.genre,
    bpm: fields.bpm,
    musicalKey: fields.musicalKey,
    status: 'draft',
    createdBy: fields.createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateTrack(trackId: string, fields: UpdateTrackFields): Promise<void> {
  const db = getDb();
  if (!db) return;
  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (fields.title !== undefined) update.title = fields.title;
  if (fields.version !== undefined) update.version = fields.version;
  if (fields.subtitle !== undefined) update.subtitle = fields.subtitle;
  if (fields.trackNumber !== undefined) update.trackNumber = fields.trackNumber;
  if (fields.discNumber !== undefined) update.discNumber = fields.discNumber;
  if (fields.isrc !== undefined) update.isrc = fields.isrc;
  if (fields.duration !== undefined) update.duration = fields.duration;
  if (fields.language !== undefined) update.language = fields.language;
  if (fields.explicit !== undefined) update.explicit = fields.explicit;
  if (fields.genre !== undefined) update.genre = fields.genre;
  if (fields.bpm !== undefined) update.bpm = fields.bpm;
  if (fields.musicalKey !== undefined) update.musicalKey = fields.musicalKey;
  if (fields.status !== undefined) update.status = fields.status;
  await updateDoc(doc(db, 'tracks', trackId), update);
}

export async function getTrack(trackId: string): Promise<TrackRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'tracks', trackId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as TrackRecord;
}

export async function getTracksByOrg(orgId: string): Promise<TrackRecord[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(
    collection(db, 'tracks'),
    where('organizationId', '==', orgId),
    orderBy('title', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackRecord);
}

export async function archiveTrack(trackId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'tracks', trackId), {
    status: 'archived',
    updatedAt: Timestamp.now(),
  });
}
