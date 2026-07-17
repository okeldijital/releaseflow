'use client';

export interface ReleaseStatusMeta {
  label: string;
  color: string;
  progress: number;
  order: number;
}

export const RELEASE_STATUS_CONFIG: Record<string, ReleaseStatusMeta> = {
  draft: {
    label: 'Draft',
    color: 'bg-surface-100 text-text-500',
    progress: 0,
    order: 0,
  },
  planning: {
    label: 'Planning',
    color: 'bg-info-50 text-info-600',
    progress: 15,
    order: 1,
  },
  in_production: {
    label: 'In Production',
    color: 'bg-info-50 text-info-600',
    progress: 35,
    order: 2,
  },
  on_hold: {
    label: 'On Hold',
    color: 'bg-warning-50 text-warning-700',
    progress: 30,
    order: 3,
  },
  ready_for_distribution: {
    label: 'Ready',
    color: 'bg-success-50 text-success-600',
    progress: 75,
    order: 4,
  },
  released: {
    label: 'Released',
    color: 'bg-success-50 text-success-600',
    progress: 100,
    order: 5,
  },
  archived: {
    label: 'Archived',
    color: 'bg-surface-100 text-text-400',
    progress: 100,
    order: 6,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-danger-50 text-danger-600',
    progress: 0,
    order: 7,
  },
};

export const RELEASE_TYPE_LABELS: Record<string, string> = {
  single: 'Single',
  ep: 'EP',
  album: 'Album',
  remix: 'Remix',
  compilation: 'Compilation',
};
