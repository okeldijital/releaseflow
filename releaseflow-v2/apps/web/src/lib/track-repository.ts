import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
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

type ReviewEntityType = 'deliverable' | 'specification';

function requireDb(): Firestore {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  return db;
}

async function deleteDocsByQuery(
  db: Firestore,
  collectionName: string,
  field: string,
  value: string,
): Promise<void> {
  const snap = await getDocs(query(collection(db, collectionName), where(field, '==', value)));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

async function deleteReviewsAndRevisionsForEntity(
  db: Firestore,
  entityType: ReviewEntityType,
  entityId: string,
): Promise<void> {
  const reviews = await getDocs(
    query(
      collection(db, 'deliverable_reviews'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
    ),
  );
  await Promise.all(reviews.docs.map((d) => deleteDoc(d.ref)));

  const revisions = await getDocs(
    query(
      collection(db, 'deliverable_revisions'),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
    ),
  );
  await Promise.all(revisions.docs.map((d) => deleteDoc(d.ref)));
}

async function deleteEntityComments(db: Firestore, trackId: string): Promise<void> {
  const { getCommentsByEntity, getReplies } = await import('./comments-repository');
  const comments = await getCommentsByEntity('track', trackId);
  for (const comment of comments) {
    const replies = await getReplies(comment.id);
    await Promise.all(replies.map((reply) => deleteDoc(doc(db, 'entity_comments', reply.id))));
    await deleteDoc(doc(db, 'entity_comments', comment.id));
  }
}

export async function deleteTrack(trackId: string): Promise<void> {
  const db = requireDb();
  if (!trackId) throw new Error('Track ID is required');

  console.log(`[deleteTrack] trackId: ${trackId}`);
  console.log('');

  const trackSnap = await getDoc(doc(db, 'tracks', trackId));
  if (!trackSnap.exists()) throw new Error('Track not found');

  const { getDeliverablesByTrack } = await import('./deliverable-management-repository');
  const { getSpecificationsByTrack } = await import('./specification-repository');
  const { getAssignmentsByEntity, deleteAssignment } = await import('./assignment-repository');
  const { getActivityByEntity, deleteActivityEvent } = await import('./activity-service');
  const { getCreditsByTrack, deleteCredit } = await import('./credit-repository');
  const { getArtistsByTrack, removeArtistFromTrack } = await import('./track-artist-repository');
  const { getPeopleByTrack, removePersonFromTrack } = await import('./track-person-repository');
  const { getRightsByTrack, deleteTrackRight } = await import('./rights-repository');
  const { getTrackOwnerships } = await import('./rights-repository');
  const { getOwnershipsByEntity, deleteOwnership } = await import('./ownership-repository');
  const { getPublishingSplitsByTrack, deletePublishingSplit } = await import('./publishing-repository');
  const { getPerformerRolesByTrack, deletePerformerRole } = await import('./performer-roles-repository');
  const { getDeliveriesByTrack, deleteTrackDelivery } = await import('./distribution-delivery-repository');
  const { getChecklistByTrack } = await import('./checklist-repository');
  const { getTasksByEntity, deleteTask } = await import('./task-service');
  const { getAssetsByTrack } = await import('./asset-lifecycle-service');

  let step = 0;
  const total = 21;

  async function execStep<T>(label: string, query: string, fn: () => Promise<T>): Promise<T> {
    step++;
    console.log(`[${step}/${total}] ${label}`);
    try {
      const result = await fn();
      console.log(`✓ success`);
      console.log('');
      return result;
    } catch (error) {
      console.log(`✗ failure`);
      console.log('');
      console.log(`Collection:`);
      console.log(label);
      console.log('');
      console.log(`Query:`);
      console.log(query);
      console.log('');
      const code = (error as { code?: string })?.code ?? 'unknown';
      const message = error instanceof Error ? error.message : String(error);
      console.log(`Firestore error code:`);
      console.log(code);
      console.log('');
      console.log(`Firestore error message:`);
      console.log(message);
      console.log('');
      if (error instanceof Error && error.stack) {
        console.log(`Stack:`);
        console.log(error.stack);
        console.log('');
      }
      throw error;
    }
  }

  await execStep(
    'production_deliverables',
    'getDeliverablesByTrack(trackId) + delete reviews/revisions + deleteDoc(production_deliverables)',
    async () => {
      const deliverables = await getDeliverablesByTrack(trackId);
      for (const deliverable of deliverables) {
        await deleteReviewsAndRevisionsForEntity(db, 'deliverable', deliverable.id);
        await deleteDoc(doc(db, 'production_deliverables', deliverable.id));
      }
    },
  );

  await execStep(
    'specifications',
    'getSpecificationsByTrack(trackId) + delete reviews/revisions + deleteDoc(specifications)',
    async () => {
      const specifications = await getSpecificationsByTrack(trackId);
      for (const spec of specifications) {
        await deleteReviewsAndRevisionsForEntity(db, 'specification', spec.id);
        await deleteDoc(doc(db, 'specifications', spec.id));
      }
    },
  );

  await execStep(
    'track_assets',
    'getAssetsByTrack(trackId) + deleteDoc(track_assets)',
    async () => {
      const assets = await getAssetsByTrack(trackId);
      await Promise.all(assets.map((asset) => deleteDoc(doc(db, 'track_assets', asset.id))));
    },
  );

  await execStep(
    'assignments',
    'getAssignmentsByEntity(track, trackId) + deleteAssignment()',
    async () => {
      const assignments = await getAssignmentsByEntity('track', trackId);
      await Promise.all(assignments.map((assignment) => deleteAssignment(assignment.id)));
    },
  );

  await execStep(
    'activities',
    'getActivityByEntity(track, trackId) + deleteActivityEvent()',
    async () => {
      const activities = await getActivityByEntity('track', trackId);
      await Promise.all(activities.map((activity) => deleteActivityEvent(activity.id)));
    },
  );

  await execStep(
    'entity_comments',
    'getCommentsByEntity(track, trackId) + getReplies() + deleteDoc(entity_comments)',
    async () => {
      await deleteEntityComments(db, trackId);
    },
  );

  await execStep(
    'notifications',
    'deleteDocsByQuery(notifications, referenceId, trackId)',
    async () => {
      await deleteDocsByQuery(db, 'notifications', 'referenceId', trackId);
    },
  );

  await execStep(
    'credits',
    'getCreditsByTrack(trackId) + deleteCredit()',
    async () => {
      const credits = await getCreditsByTrack(trackId);
      await Promise.all(credits.map((credit) => deleteCredit(credit.id)));
    },
  );

  await execStep(
    'track_credits',
    'deleteDocsByQuery(track_credits, trackId, trackId)',
    async () => {
      await deleteDocsByQuery(db, 'track_credits', 'trackId', trackId);
    },
  );

  await execStep(
    'track_artists',
    'getArtistsByTrack(trackId) + removeArtistFromTrack()',
    async () => {
      const trackArtists = await getArtistsByTrack(trackId);
      await Promise.all(trackArtists.map((record) => removeArtistFromTrack(record.id)));
    },
  );

  await execStep(
    'track_people',
    'getPeopleByTrack(trackId) + removePersonFromTrack()',
    async () => {
      const trackPeople = await getPeopleByTrack(trackId);
      await Promise.all(trackPeople.map((record) => removePersonFromTrack(record.id)));
    },
  );

  await execStep(
    'track_rights',
    'getRightsByTrack(trackId) + deleteTrackRight()',
    async () => {
      const rights = await getRightsByTrack(trackId);
      await Promise.all(rights.map((right) => deleteTrackRight(right.id)));
    },
  );

  await execStep(
    'track_ownerships',
    'getTrackOwnerships(trackId) + deleteDoc(track_ownerships)',
    async () => {
      const trackOwnerships = await getTrackOwnerships(trackId);
      await Promise.all(trackOwnerships.map((ownership) => deleteDoc(doc(db, 'track_ownerships', ownership.id))));
    },
  );

  await execStep(
    'ownerships',
    'getOwnershipsByEntity(track, trackId) + deleteOwnership()',
    async () => {
      const ownerships = await getOwnershipsByEntity('track', trackId);
      await Promise.all(ownerships.map((ownership) => deleteOwnership(ownership.id)));
    },
  );

  await execStep(
    'publishing_splits',
    'getPublishingSplitsByTrack(trackId) + deletePublishingSplit()',
    async () => {
      const publishingSplits = await getPublishingSplitsByTrack(trackId);
      await Promise.all(publishingSplits.map((split) => deletePublishingSplit(split.id)));
    },
  );

  await execStep(
    'performer_roles',
    'getPerformerRolesByTrack(trackId) + deletePerformerRole()',
    async () => {
      const performerRoles = await getPerformerRolesByTrack(trackId);
      await Promise.all(performerRoles.map((role) => deletePerformerRole(role.id)));
    },
  );

  await execStep(
    'track_deliveries',
    'getDeliveriesByTrack(trackId) + deleteTrackDelivery()',
    async () => {
      const deliveries = await getDeliveriesByTrack(trackId);
      await Promise.all(deliveries.map((delivery) => deleteTrackDelivery(delivery.id)));
    },
  );

  await execStep(
    'production_checklists',
    'getChecklistByTrack(trackId) + deleteDoc(production_checklists)',
    async () => {
      const checklists = await getChecklistByTrack(trackId);
      await Promise.all(checklists.map((checklist) => deleteDoc(doc(db, 'production_checklists', checklist.id))));
    },
  );

  await execStep(
    'tasks',
    'getTasksByEntity(track, trackId) + deleteTask()',
    async () => {
      const tasks = await getTasksByEntity('track', trackId);
      await Promise.all(tasks.map((task) => deleteTask(task.id)));
    },
  );

  await execStep(
    'release_tracks',
    'release_tracks where(trackId == trackId) + deleteDoc(ref)',
    async () => {
      const releaseTrackSnap = await getDocs(
        query(collection(db, 'release_tracks'), where('trackId', '==', trackId)),
      );
      await Promise.all(releaseTrackSnap.docs.map((d) => deleteDoc(d.ref)));
    },
  );

  await execStep(
    'tracks',
    'deleteDoc(tracks/trackId)',
    async () => {
      await deleteDoc(doc(db, 'tracks', trackId));
    },
  );
}
