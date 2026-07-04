import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, writeBatch,
  collection, query, where, orderBy, Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { RecordingType, TrackStatus } from '@/app/(app)/types';
import { resolveRecordingType } from '@/lib/recording-type';

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
  recordingType?: RecordingType;
  originalArtistId?: string | null;
  remixerArtistId?: string | null;
  primaryArtistId?: string | null;
  featuredArtistIds?: string[] | null;
  displayTitle?: string | null;
  displayTitleEdited?: boolean;
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
  recordingType?: RecordingType;
  originalArtistId?: string | null;
  remixerArtistId?: string | null;
  primaryArtistId?: string | null;
  featuredArtistIds?: string[] | null;
  displayTitle?: string | null;
  displayTitleEdited?: boolean;
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
  recordingType?: RecordingType;
  originalArtistId?: string | null;
  remixerArtistId?: string | null;
  primaryArtistId?: string | null;
  featuredArtistIds?: string[] | null;
  displayTitle?: string | null;
  displayTitleEdited?: boolean;
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
    recordingType: fields.recordingType ?? 'original',
    originalArtistId: fields.originalArtistId ?? null,
    remixerArtistId: fields.remixerArtistId ?? null,
    primaryArtistId: fields.primaryArtistId ?? null,
    featuredArtistIds: fields.featuredArtistIds ?? null,
    displayTitle: fields.displayTitle ?? null,
    displayTitleEdited: fields.displayTitleEdited ?? false,
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
    recordingType: fields.recordingType ?? 'original',
    originalArtistId: fields.originalArtistId,
    remixerArtistId: fields.remixerArtistId,
    primaryArtistId: fields.primaryArtistId,
    featuredArtistIds: fields.featuredArtistIds,
    displayTitle: fields.displayTitle,
    displayTitleEdited: fields.displayTitleEdited,
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
  if (fields.recordingType !== undefined) update.recordingType = fields.recordingType;
  if (fields.originalArtistId !== undefined) update.originalArtistId = fields.originalArtistId;
  if (fields.remixerArtistId !== undefined) update.remixerArtistId = fields.remixerArtistId;
  if (fields.primaryArtistId !== undefined) update.primaryArtistId = fields.primaryArtistId;
  if (fields.featuredArtistIds !== undefined) update.featuredArtistIds = fields.featuredArtistIds;
  if (fields.displayTitle !== undefined) update.displayTitle = fields.displayTitle;
  if (fields.displayTitleEdited !== undefined) update.displayTitleEdited = fields.displayTitleEdited;
  await updateDoc(doc(db, 'tracks', trackId), update);
}

export async function getTrack(trackId: string): Promise<TrackRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'tracks', trackId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    recordingType: resolveRecordingType(data.recordingType),
  } as TrackRecord;
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
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      recordingType: resolveRecordingType(data.recordingType),
    } as TrackRecord;
  });
}

export async function archiveTrack(trackId: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  await updateDoc(doc(db, 'tracks', trackId), {
    status: 'archived',
    updatedAt: Timestamp.now(),
  });
}

function requireDb(): Firestore {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  return db;
}

export async function deleteTrack(trackId: string): Promise<void> {
  const db = requireDb();
  if (!trackId) throw new Error('Track ID is required');

  const trackRef = doc(db, 'tracks', trackId);
  const trackSnap = await getDoc(trackRef);
  if (!trackSnap.exists()) throw new Error('Track not found');

  const batch = writeBatch(db);

  const trackIdCollections = [
    'release_tracks',
    'track_artists',
    'track_people',
    'credits',
    'track_credits',
    'track_ownerships',
    'track_rights',
    'publishing_splits',
    'performer_roles',
    'track_deliveries',
    'track_assets',
    'production_deliverables',
    'specifications',
    'production_checklists',
  ];

  for (const name of trackIdCollections) {
    const snap = await getDocs(query(collection(db, name), where('trackId', '==', trackId)));
    snap.docs.forEach((d) => batch.delete(d.ref));
  }

  const entityCollections = [
    'assignments',
    'activity_events',
    'entity_comments',
    'ownerships',
    'tasks',
  ];

  for (const name of entityCollections) {
    const snap = await getDocs(
      query(
        collection(db, name),
        where('entityType', '==', 'track'),
        where('entityId', '==', trackId),
      ),
    );
    snap.docs.forEach((d) => batch.delete(d.ref));
  }

  const notifSnap = await getDocs(
    query(collection(db, 'notifications'), where('referenceId', '==', trackId)),
  );
  notifSnap.docs.forEach((d) => batch.delete(d.ref));

  batch.delete(trackRef);

  await batch.commit();
}
