import {
  doc, getDoc, getDocs, updateDoc, writeBatch,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from './firebase';
import type { RecordingType, TrackCredit, TrackStatus } from '@/app/(app)/types';
import { resolveRecordingType } from '@/lib/recording-type';

export class TrackCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrackCreationError';
  }
}

/**
 * BUILD-011 / BUILD-012D — musical work being remixed (recordingType === remix only).
 * Songwriters + ISWC describe the composition, not the sound recording.
 */
export interface OriginalWork {
  title: string;
  primaryArtistId: string;
  featuredArtistIds: string[];
  /** BUILD-012D — composition creators (Artist ids) */
  composerArtistIds?: string[];
  lyricistArtistIds?: string[];
  /** Composition identifier (not the recording ISRC) */
  iswc?: string | null;
}

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
  /** EPIC-202 — ordered Artist entity ids (source of truth also in track_artists) */
  originalArtistIds?: string[];
  featuredArtistIds?: string[];
  remixArtistIds?: string[];
  /**
   * @deprecated BUILD-012D — prefer originalWork.composerArtistIds / lyricistArtistIds.
   * Kept for reading legacy track docs only.
   */
  composerArtistIds?: string[];
  lyricistArtistIds?: string[];
  /** BUILD-011 — nested original song metadata; null/omitted when not a remix */
  originalWork?: OriginalWork | null;
  displayTitle?: string | null;
  displayTitleEdited?: boolean;
  credits?: TrackCredit[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateTrackFields {
  releaseId: string;
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
  originalArtistIds?: string[];
  featuredArtistIds?: string[];
  remixArtistIds?: string[];
  originalWork?: OriginalWork | null;
  displayTitle?: string | null;
  displayTitleEdited?: boolean;
  credits?: TrackCredit[];
  position?: number;
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
  originalArtistIds?: string[];
  featuredArtistIds?: string[];
  remixArtistIds?: string[];
  originalWork?: OriginalWork | null;
  displayTitle?: string | null;
  displayTitleEdited?: boolean;
  credits?: TrackCredit[];
}

/** EPIC-202 — missing array fields load as []. */
export function normalizeArtistIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/** BUILD-011 / BUILD-012D — hydrate nested originalWork; empty/missing → null. */
export function normalizeOriginalWork(value: unknown): OriginalWork | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const title = typeof v.title === 'string' ? v.title : '';
  const primaryArtistId = typeof v.primaryArtistId === 'string' ? v.primaryArtistId : '';
  const featuredArtistIds = normalizeArtistIdArray(v.featuredArtistIds);
  const composerArtistIds = normalizeArtistIdArray(v.composerArtistIds);
  const lyricistArtistIds = normalizeArtistIdArray(v.lyricistArtistIds);
  const iswc = typeof v.iswc === 'string' ? v.iswc.trim() : '';
  if (
    !title.trim() &&
    !primaryArtistId &&
    featuredArtistIds.length === 0 &&
    composerArtistIds.length === 0 &&
    lyricistArtistIds.length === 0 &&
    !iswc
  ) {
    return null;
  }
  return {
    title,
    primaryArtistId,
    featuredArtistIds,
    composerArtistIds,
    lyricistArtistIds,
    iswc: iswc || null,
  };
}

/**
 * BUILD-011 / BUILD-012D — persist shape for originalWork.
 * Non-remix → null (clears prior remix original work on type change).
 * Remix → nested object (never an empty placeholder without remix type).
 */
export function serializeOriginalWork(
  recordingType: RecordingType | undefined,
  originalWork: OriginalWork | null | undefined,
): OriginalWork | null {
  if (resolveRecordingType(recordingType) !== 'remix') return null;
  if (!originalWork) return null;
  return {
    title: originalWork.title.trim(),
    primaryArtistId: originalWork.primaryArtistId || '',
    featuredArtistIds: normalizeArtistIdArray(originalWork.featuredArtistIds),
    composerArtistIds: normalizeArtistIdArray(originalWork.composerArtistIds),
    lyricistArtistIds: normalizeArtistIdArray(originalWork.lyricistArtistIds),
    iswc: originalWork.iswc?.trim() || null,
  };
}

/** Merge legacy top-level composer/lyricist ids into nested originalWork when missing. */
export function mergeLegacySongwritersIntoOriginalWork(
  originalWork: OriginalWork | null,
  legacyComposers?: string[],
  legacyLyricists?: string[],
): OriginalWork | null {
  if (!originalWork) {
    const c = normalizeArtistIdArray(legacyComposers);
    const l = normalizeArtistIdArray(legacyLyricists);
    if (c.length === 0 && l.length === 0) return null;
    return {
      title: '',
      primaryArtistId: '',
      featuredArtistIds: [],
      composerArtistIds: c,
      lyricistArtistIds: l,
      iswc: null,
    };
  }
  const composers =
    (originalWork.composerArtistIds?.length ?? 0) > 0
      ? originalWork.composerArtistIds!
      : normalizeArtistIdArray(legacyComposers);
  const lyricists =
    (originalWork.lyricistArtistIds?.length ?? 0) > 0
      ? originalWork.lyricistArtistIds!
      : normalizeArtistIdArray(legacyLyricists);
  return {
    ...originalWork,
    composerArtistIds: composers,
    lyricistArtistIds: lyricists,
  };
}

export async function createTrack(fields: CreateTrackFields): Promise<TrackRecord> {
  if (!fields.releaseId) {
    throw new TrackCreationError('A track cannot exist without a release.');
  }

  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const now = Timestamp.now();

  const positionSnap = await getDocs(
    query(collection(db, 'release_tracks'), where('releaseId', '==', fields.releaseId)),
  );
  const position = fields.position ?? (positionSnap.size + 1);

  const batch = writeBatch(db);

  const recordingType = fields.recordingType ?? 'original';
  const originalWork = serializeOriginalWork(recordingType, fields.originalWork);

  const trackRef = doc(collection(db, 'tracks'));
  batch.set(trackRef, {
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
    recordingType,
    originalArtistId: fields.originalArtistId ?? null,
    remixerArtistId: fields.remixerArtistId ?? null,
    primaryArtistId: fields.primaryArtistId ?? null,
    originalArtistIds: normalizeArtistIdArray(fields.originalArtistIds),
    featuredArtistIds: normalizeArtistIdArray(fields.featuredArtistIds),
    remixArtistIds: normalizeArtistIdArray(fields.remixArtistIds),
    // BUILD-012D — songwriters live only under originalWork (not top-level)
    // BUILD-011: only store nested object for remix; null for other types
    originalWork,
    displayTitle: fields.displayTitle ?? null,
    displayTitleEdited: fields.displayTitleEdited ?? false,
    credits: fields.credits ?? null,
    status: 'draft' satisfies TrackStatus,
    createdBy: fields.createdBy,
    createdAt: now,
    updatedAt: now,
  });

  const releaseTrackRef = doc(collection(db, 'release_tracks'));
  batch.set(releaseTrackRef, {
    releaseId: fields.releaseId,
    trackId: trackRef.id,
    position,
    createdAt: now,
  });

  await batch.commit();

  return {
    id: trackRef.id,
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
    recordingType,
    originalArtistId: fields.originalArtistId,
    remixerArtistId: fields.remixerArtistId,
    primaryArtistId: fields.primaryArtistId,
    originalArtistIds: normalizeArtistIdArray(fields.originalArtistIds),
    featuredArtistIds: normalizeArtistIdArray(fields.featuredArtistIds),
    remixArtistIds: normalizeArtistIdArray(fields.remixArtistIds),
    originalWork,
    displayTitle: fields.displayTitle,
    displayTitleEdited: fields.displayTitleEdited,
    credits: fields.credits,
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
  if (fields.originalArtistIds !== undefined) {
    update.originalArtistIds = normalizeArtistIdArray(fields.originalArtistIds);
  }
  if (fields.featuredArtistIds !== undefined) {
    update.featuredArtistIds = normalizeArtistIdArray(fields.featuredArtistIds);
  }
  if (fields.remixArtistIds !== undefined) {
    update.remixArtistIds = normalizeArtistIdArray(fields.remixArtistIds);
  }
  if (fields.originalWork !== undefined) {
    if (fields.originalWork === null) {
      update.originalWork = null;
    } else {
      // Explicit originalWork payload is always the remix nested shape; honour recordingType when provided.
      const typeForSerialize =
        fields.recordingType !== undefined ? fields.recordingType : 'remix';
      update.originalWork = serializeOriginalWork(typeForSerialize, fields.originalWork);
    }
  } else if (fields.recordingType !== undefined && resolveRecordingType(fields.recordingType) !== 'remix') {
    // Leaving remix without explicit originalWork payload → clear nested object.
    update.originalWork = null;
  }
  if (fields.displayTitle !== undefined) update.displayTitle = fields.displayTitle;
  if (fields.displayTitleEdited !== undefined) update.displayTitleEdited = fields.displayTitleEdited;
  if (fields.credits !== undefined) update.credits = fields.credits;
  await updateDoc(doc(db, 'tracks', trackId), update);
}

export async function getTrack(trackId: string): Promise<TrackRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'tracks', trackId));
  if (!snap.exists()) return null;
  const data = snap.data();
  const recordingType = resolveRecordingType(data.recordingType);
  return {
    id: snap.id,
    ...data,
    recordingType,
    originalArtistIds: normalizeArtistIdArray(data.originalArtistIds),
    featuredArtistIds: normalizeArtistIdArray(data.featuredArtistIds),
    remixArtistIds: normalizeArtistIdArray(data.remixArtistIds),
    originalWork:
      recordingType === 'remix'
        ? mergeLegacySongwritersIntoOriginalWork(
            normalizeOriginalWork(data.originalWork),
            normalizeArtistIdArray(data.composerArtistIds),
            normalizeArtistIdArray(data.lyricistArtistIds),
          )
        : null,
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
    const recordingType = resolveRecordingType(data.recordingType);
    return {
      id: d.id,
      ...data,
      recordingType,
      originalArtistIds: normalizeArtistIdArray(data.originalArtistIds),
      featuredArtistIds: normalizeArtistIdArray(data.featuredArtistIds),
      remixArtistIds: normalizeArtistIdArray(data.remixArtistIds),
      originalWork:
        recordingType === 'remix'
          ? mergeLegacySongwritersIntoOriginalWork(
              normalizeOriginalWork(data.originalWork),
              normalizeArtistIdArray(data.composerArtistIds),
              normalizeArtistIdArray(data.lyricistArtistIds),
            )
          : null,
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

export async function deleteTrack(trackId: string, organizationId?: string, actorId?: string, deleteReason?: string): Promise<void> {
  if (organizationId && actorId) {
    const { softDelete } = await import('@/lib/retention/lifecycle-service');
    await softDelete({ entityType: 'track', entityId: trackId, organizationId, actorId, deleteReason });
    return;
  }

  const db = getDb();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const batch = writeBatch(db);

  const releaseTracksSnap = await getDocs(
    query(collection(db, 'release_tracks'), where('trackId', '==', trackId)),
  );
  for (const doc of releaseTracksSnap.docs) {
    batch.delete(doc.ref);
  }

  batch.delete(doc(db, 'tracks', trackId));
  await batch.commit();
}
