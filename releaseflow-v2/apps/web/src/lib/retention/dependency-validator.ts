import {
  getDocs, collection, query, where, limit,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { EntityType } from './retention-types';

export interface DependencySummary {
  entityType: EntityType;
  entityId: string;
  dependencies: { collection: string; label: string; count: number }[];
  canPurge: boolean;
}

async function countWhere(collectionName: string, field: string, value: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const snap = await getDocs(query(collection(db, collectionName), where(field, '==', value), limit(1000)));
  return snap.size;
}

export async function validateReleaseDependencies(releaseId: string): Promise<DependencySummary> {
  const [tracks, media, assets, deliverables, activities, tasks] = await Promise.all([
    countWhere('release_tracks', 'releaseId', releaseId),
    countWhere('media_assets', 'releaseId', releaseId),
    countWhere('asset_references', 'releaseId', releaseId),
    countWhere('deliverables', 'releaseId', releaseId),
    countWhere('activity_events', 'entityId', releaseId),
    countWhere('tasks', 'releaseId', releaseId),
  ]);
  const dependencies = [
    ...(tracks > 0 ? [{ collection: 'release_tracks', label: 'Tracks', count: tracks }] : []),
    ...(media > 0 ? [{ collection: 'media_assets', label: 'Media Assets', count: media }] : []),
    ...(assets > 0 ? [{ collection: 'asset_references', label: 'Assets', count: assets }] : []),
    ...(deliverables > 0 ? [{ collection: 'deliverables', label: 'Deliverables', count: deliverables }] : []),
    ...(activities > 0 ? [{ collection: 'activity_events', label: 'Activities', count: activities }] : []),
    ...(tasks > 0 ? [{ collection: 'tasks', label: 'Tasks', count: tasks }] : []),
  ];
  return {
    entityType: 'release',
    entityId: releaseId,
    dependencies,
    canPurge: dependencies.length === 0,
  };
}

export async function validateTrackDependencies(trackId: string): Promise<DependencySummary> {
  const [artists, people, activities, assignments, deliveries] = await Promise.all([
    countWhere('track_artists', 'trackId', trackId),
    countWhere('track_people', 'trackId', trackId),
    countWhere('activity_events', 'entityId', trackId),
    countWhere('assignments', 'entityId', trackId),
    countWhere('track_deliveries', 'trackId', trackId),
  ]);
  const dependencies = [
    ...(artists > 0 ? [{ collection: 'track_artists', label: 'Artist Links', count: artists }] : []),
    ...(people > 0 ? [{ collection: 'track_people', label: 'Person Links', count: people }] : []),
    ...(activities > 0 ? [{ collection: 'activity_events', label: 'Activities', count: activities }] : []),
    ...(assignments > 0 ? [{ collection: 'assignments', label: 'Assignments', count: assignments }] : []),
    ...(deliveries > 0 ? [{ collection: 'track_deliveries', label: 'Deliveries', count: deliveries }] : []),
  ];
  return {
    entityType: 'track',
    entityId: trackId,
    dependencies,
    canPurge: dependencies.length === 0,
  };
}

export async function validateArtistDependencies(orgId: string, artistId: string): Promise<DependencySummary> {
  const [trackArtists] = await Promise.all([
    countWhere('track_artists', 'artistId', artistId),
  ]);
  const dependencies = [
    ...(trackArtists > 0 ? [{ collection: 'track_artists', label: 'Track Appearances', count: trackArtists }] : []),
  ];
  return {
    entityType: 'artist',
    entityId: artistId,
    dependencies,
    canPurge: dependencies.length === 0,
  };
}

export async function validatePersonDependencies(personId: string): Promise<DependencySummary> {
  const [memberships, activities, assignments] = await Promise.all([
    countWhere('person_memberships', 'personId', personId),
    countWhere('activity_events', 'entityId', personId),
    countWhere('assignments', 'assigneeId', personId),
  ]);
  const dependencies = [
    ...(memberships > 0 ? [{ collection: 'person_memberships', label: 'Organization Memberships', count: memberships }] : []),
    ...(activities > 0 ? [{ collection: 'activity_events', label: 'Activities', count: activities }] : []),
    ...(assignments > 0 ? [{ collection: 'assignments', label: 'Assignments', count: assignments }] : []),
  ];
  return {
    entityType: 'person',
    entityId: personId,
    dependencies,
    canPurge: dependencies.length === 0,
  };
}

export async function validateWorkDependencies(workId: string): Promise<DependencySummary> {
  const [splits, publishers, tracks, activities] = await Promise.all([
    countWhere('work_splits', 'workId', workId),
    countWhere('work_publishers', 'workId', workId),
    countWhere('work_tracks', 'workId', workId),
    countWhere('activity_events', 'entityId', workId),
  ]);
  const dependencies = [
    ...(splits > 0 ? [{ collection: 'work_splits', label: 'Writer Splits', count: splits }] : []),
    ...(publishers > 0 ? [{ collection: 'work_publishers', label: 'Publishers', count: publishers }] : []),
    ...(tracks > 0 ? [{ collection: 'work_tracks', label: 'Linked Tracks', count: tracks }] : []),
    ...(activities > 0 ? [{ collection: 'activity_events', label: 'Activities', count: activities }] : []),
  ];
  return {
    entityType: 'work',
    entityId: workId,
    dependencies,
    canPurge: dependencies.length === 0,
  };
}

export async function validateAssignmentDependencies(assignmentId: string): Promise<DependencySummary> {
  const [activities] = await Promise.all([
    countWhere('activity_events', 'entityId', assignmentId),
  ]);
  const dependencies = [
    ...(activities > 0 ? [{ collection: 'activity_events', label: 'Activities', count: activities }] : []),
  ];
  return {
    entityType: 'assignment',
    entityId: assignmentId,
    dependencies,
    canPurge: dependencies.length === 0,
  };
}

export const ENTITY_DEPENDENCY_VALIDATORS: Record<string, (id: string, orgId?: string) => Promise<DependencySummary>> = {
  release: (id: string) => validateReleaseDependencies(id),
  track: (id: string) => validateTrackDependencies(id),
  artist: (id: string, orgId?: string) => validateArtistDependencies(orgId ?? '', id),
  person: (id: string) => validatePersonDependencies(id),
  work: (id: string) => validateWorkDependencies(id),
  assignment: (id: string) => validateAssignmentDependencies(id),
};
