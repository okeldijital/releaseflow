'use client';

export interface ReleaseStatusMeta {
  label: string;
  color: string;
  darkColor: string;
  progress: number;
  order: number;
}

export const RELEASE_STATUS_CONFIG: Record<string, ReleaseStatusMeta> = {
  draft: {
    label: 'Draft',
    color: 'bg-surface-100 text-text-500',
    darkColor: 'dark:bg-surface-800 dark:text-text-400',
    progress: 0,
    order: 0,
  },
  planning: {
    label: 'Planning',
    color: 'bg-info-50 text-info-600',
    darkColor: 'dark:bg-info-500/15 dark:text-info-400',
    progress: 15,
    order: 1,
  },
  in_production: {
    label: 'In Production',
    color: 'bg-info-50 text-info-600',
    darkColor: 'dark:bg-info-500/15 dark:text-info-400',
    progress: 35,
    order: 2,
  },
  on_hold: {
    label: 'On Hold',
    color: 'bg-warning-50 text-warning-700',
    darkColor: 'dark:bg-warning-500/15 dark:text-warning-400',
    progress: 30,
    order: 3,
  },
  ready_for_distribution: {
    label: 'Ready',
    color: 'bg-success-50 text-success-600',
    darkColor: 'dark:bg-success-500/15 dark:text-success-400',
    progress: 75,
    order: 4,
  },
  released: {
    label: 'Released',
    color: 'bg-success-50 text-success-600',
    darkColor: 'dark:bg-success-500/15 dark:text-success-400',
    progress: 100,
    order: 5,
  },
  archived: {
    label: 'Archived',
    color: 'bg-surface-100 text-text-400',
    darkColor: 'dark:bg-surface-800 dark:text-text-500',
    progress: 100,
    order: 6,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-danger-50 text-danger-600',
    darkColor: 'dark:bg-danger-500/15 dark:text-danger-400',
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
