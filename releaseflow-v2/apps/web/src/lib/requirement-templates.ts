import type { ReleaseType } from '@/app/(app)/types';

const singleRequirements = [
  'Master WAV',
  'Cover Artwork',
  'Metadata Sheet',
  'ISRC',
  'UPC',
];

const epRequirements = [
  'Master WAV',
  'Cover Artwork',
  'Metadata Sheet',
  'ISRC',
  'UPC',
  'Tracklist',
];

const albumRequirements = [
  'Master WAV',
  'Cover Artwork',
  'Metadata Sheet',
  'ISRC',
  'UPC',
  'Tracklist',
  'Liner Notes',
  'Credits',
];

const remixRequirements = [
  'Master WAV',
  'Cover Artwork',
  'Metadata Sheet',
  'ISRC',
  'UPC',
  'Original Artist Clearance',
];

const templateMap: Record<ReleaseType, string[]> = {
  single: singleRequirements,
  ep: epRequirements,
  album: albumRequirements,
  remix: remixRequirements,
  compilation: singleRequirements,
};

export function getRequirementNamesForReleaseType(type: ReleaseType): string[] {
  return templateMap[type] ?? [];
}
