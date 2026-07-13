export interface SoftDeleteFields {
  status: string;
  deletedAt: unknown;
  deletedBy: string;
  deleteReason?: string;
}

export interface RestorableEntity {
  id: string;
  entityType: EntityType;
  title: string;
  status: string;
  deletedAt: unknown;
  deletedBy: string;
  deleteReason?: string | null;
  originalStatus?: string;
}

export type EntityType =
  | 'release'
  | 'track'
  | 'artist'
  | 'label'
  | 'person'
  | 'media_asset'
  | 'assignment';

export interface DependencyCheck {
  entityType: EntityType;
  entityId: string;
  dependencies: { collection: string; count: number }[];
}

export interface RetentionPolicy {
  entityType: EntityType;
  label: string;
  retentionDays: number | null;
}

export const RETENTION_POLICIES: RetentionPolicy[] = [
  { entityType: 'release', label: 'Releases', retentionDays: null },
  { entityType: 'track', label: 'Tracks', retentionDays: null },
  { entityType: 'artist', label: 'Artists', retentionDays: null },
  { entityType: 'label', label: 'Labels', retentionDays: null },
  { entityType: 'person', label: 'People', retentionDays: null },
  { entityType: 'media_asset', label: 'Media', retentionDays: null },
  { entityType: 'assignment', label: 'Assignments', retentionDays: null },
];

export const ENTITY_DISPLAY_NAMES: Record<EntityType, string> = {
  release: 'Release',
  track: 'Track',
  artist: 'Artist',
  label: 'Label',
  person: 'Person',
  media_asset: 'Media Asset',
  assignment: 'Assignment',
};

export const DELETED_STATUS_PREFIX = 'deleted';
