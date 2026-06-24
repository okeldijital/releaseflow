import type { ReleaseType, StageStatus } from '@/app/(app)/types';

export interface StageTemplate {
  name: string;
  order: number;
  assignedRole?: string;
}

const singleStages: StageTemplate[] = [
  { name: 'Master Recording', order: 1, assignedRole: 'producer' },
  { name: 'Mixing', order: 2, assignedRole: 'mixing_engineer' },
  { name: 'Mastering', order: 3, assignedRole: 'mastering_engineer' },
  { name: 'Artwork Design', order: 4, assignedRole: 'designer' },
  { name: 'Distribution Prep', order: 5, assignedRole: 'distributor' },
  { name: 'Release', order: 6 },
];

const epStages: StageTemplate[] = [
  { name: 'Master Recording', order: 1, assignedRole: 'producer' },
  { name: 'Mixing', order: 2, assignedRole: 'mixing_engineer' },
  { name: 'Mastering', order: 3, assignedRole: 'mastering_engineer' },
  { name: 'Artwork Design', order: 4, assignedRole: 'designer' },
  { name: 'Marketing Prep', order: 5, assignedRole: 'marketing' },
  { name: 'Distribution Prep', order: 6, assignedRole: 'distributor' },
  { name: 'Release', order: 7 },
];

const albumStages: StageTemplate[] = [
  { name: 'Songwriting', order: 1, assignedRole: 'songwriter' },
  { name: 'Pre-Production', order: 2, assignedRole: 'producer' },
  { name: 'Recording', order: 3, assignedRole: 'producer' },
  { name: 'Mixing', order: 4, assignedRole: 'mixing_engineer' },
  { name: 'Mastering', order: 5, assignedRole: 'mastering_engineer' },
  { name: 'Artwork Design', order: 6, assignedRole: 'designer' },
  { name: 'Marketing Campaign', order: 7, assignedRole: 'marketing' },
  { name: 'Distribution Prep', order: 8, assignedRole: 'distributor' },
  { name: 'Release', order: 9 },
];

const remixStages: StageTemplate[] = [
  { name: 'Stem Preparation', order: 1, assignedRole: 'producer' },
  { name: 'Remix Production', order: 2, assignedRole: 'remixer' },
  { name: 'Mix Review', order: 3, assignedRole: 'mixing_engineer' },
  { name: 'Mastering', order: 4, assignedRole: 'mastering_engineer' },
  { name: 'Distribution Prep', order: 5, assignedRole: 'distributor' },
  { name: 'Release', order: 6 },
];

const templateMap: Record<ReleaseType, StageTemplate[]> = {
  single: singleStages,
  ep: epStages,
  album: albumStages,
  remix: remixStages,
  compilation: singleStages,
};

export function getStageTemplatesForReleaseType(type: ReleaseType): StageTemplate[] {
  return templateMap[type] ?? [];
}

export const initialStageStatus: StageStatus = 'not_started';
