import {
  createArtist,
  updateArtist,
  deleteArtist as repoDeleteArtist,
  archiveArtist as repoArchiveArtist,
  restoreArtist as repoRestoreArtist,
  getArtist,
  listArtists,
  searchArtists,
  findArtistByNormalizedName,
  getArtistReleases,
  addArtistToRelease,
  removeArtistFromRelease,
  getArtistLinkCounts,
  getCreditsByArtist,
  getTrackTitle,
  getArtistUsage,
  canDeleteArtist,
  findDuplicateArtists,
  mergeArtists as repoMergeArtists,
} from './artist-repository';
import type {
  ArtistRecord,
  CreateArtistFields,
  CreateArtistResult,
  UpdateArtistFields,
  TrackCreditRecord,
  ArtistUsageResult,
  ArtistReferenceSummary,
} from './artist-repository';

export type {
  ArtistRecord,
  CreateArtistFields,
  CreateArtistResult,
  UpdateArtistFields,
  TrackCreditRecord,
  ArtistUsageResult,
  ArtistReferenceSummary,
} from './artist-repository';

export interface ArtistReadinessResult {
  ready: boolean;
  percentage: number;
  missing: string[];
}

export interface DuplicateInfo {
  isDuplicate: boolean;
  matches: ArtistRecord[];
}

export interface MergeResult {
  success: boolean;
  message: string;
}

export async function createNewArtist(fields: CreateArtistFields): Promise<CreateArtistResult> {
  if (!fields.name.trim()) throw new Error('Artist name is required');
  if (!fields.organizationId) throw new Error('Organization ID is required');
  return createArtist(fields);
}

export async function editArtist(
  organizationId: string,
  artistId: string,
  fields: UpdateArtistFields,
): Promise<void> {
  return updateArtist(organizationId, artistId, fields);
}

export async function removeArtist(organizationId: string, artistId: string): Promise<void> {
  return repoDeleteArtist(organizationId, artistId);
}

export async function fetchArtist(organizationId: string, artistId: string): Promise<ArtistRecord | null> {
  return getArtist(organizationId, artistId);
}

export async function fetchArtists(organizationId: string, includeArchived?: boolean): Promise<ArtistRecord[]> {
  return listArtists(organizationId, { includeArchived });
}

/**
 * BUILD-016 — Catalogue with canonical card enrichment (counts + image resolution).
 */
export async function fetchArtistCardModels(
  organizationId: string,
  opts?: { includeArchived?: boolean },
) {
  const { toArtistCardModels } = await import('./artist-card-model');
  const artists = await listArtists(organizationId, {
    includeArchived: opts?.includeArchived,
  });
  return toArtistCardModels(organizationId, artists);
}

export async function fetchArtistSearch(organizationId: string, query: string): Promise<ArtistRecord[]> {
  return searchArtists(organizationId, query);
}

export async function fetchArtistSearchCardModels(
  organizationId: string,
  query: string,
) {
  const { toArtistCardModels } = await import('./artist-card-model');
  const artists = await searchArtists(organizationId, query);
  return toArtistCardModels(organizationId, artists, { includeCounts: false });
}

export type { ArtistCardModel } from './artist-card-model';
export { toArtistCardModel, toArtistCardModels } from './artist-card-model';

export async function fetchArtistByNormalizedName(
  organizationId: string,
  name: string,
): Promise<ArtistRecord | null> {
  return findArtistByNormalizedName(organizationId, name);
}

export async function fetchArtistReleases(artistId: string) {
  return getArtistReleases(artistId);
}

export async function fetchArtistLinkCounts(organizationId: string) {
  return getArtistLinkCounts(organizationId);
}

export async function linkArtistToRelease(
  releaseId: string,
  artistId: string,
  role?: string,
  isPrimary?: boolean,
): Promise<void> {
  return addArtistToRelease({ releaseId, artistId, role, isPrimary });
}

export async function unlinkArtistFromRelease(
  releaseId: string,
  artistId: string,
): Promise<void> {
  return removeArtistFromRelease(releaseId, artistId);
}

export async function fetchCreditsByArtist(artistId: string): Promise<TrackCreditRecord[]> {
  return getCreditsByArtist(artistId);
}

export async function fetchTrackTitle(trackId: string): Promise<string | null> {
  return getTrackTitle(trackId);
}

export async function checkArtistReadiness(
  organizationId: string,
  artistId: string,
): Promise<ArtistReadinessResult> {
  const artist = await getArtist(organizationId, artistId);
  if (!artist) return { ready: false, percentage: 0, missing: ['Artist not found'] };

  const checks: [boolean, string][] = [
    [!artist.name, 'Name'],
    [!artist.bio, 'Bio'],
    [!artist.imageUrl, 'Artist Image'],
    [!artist.country, 'Country'],
    [!artist.genres || artist.genres.length === 0, 'Genre'],
    [!artist.socialLinks || Object.values(artist.socialLinks).every((v) => !v), 'Social Links'],
  ];

  const total = checks.length;
  const passed = checks.filter(([fail]) => !fail).length;
  const missing = checks.filter(([fail]) => fail).map(([, label]) => label);

  return {
    ready: missing.length === 0,
    percentage: Math.round((passed / total) * 100),
    missing,
  };
}

export async function archiveArtist(organizationId: string, artistId: string): Promise<void> {
  const artist = await getArtist(organizationId, artistId);
  if (!artist) throw new Error('Artist not found');
  if (artist.status === 'archived') throw new Error('Artist is already archived');
  return repoArchiveArtist(organizationId, artistId);
}

export async function restoreArtist(organizationId: string, artistId: string): Promise<void> {
  const artist = await getArtist(organizationId, artistId);
  if (!artist) throw new Error('Artist not found');
  if (artist.status !== 'archived') throw new Error('Artist is not archived');
  return repoRestoreArtist(organizationId, artistId);
}

export async function validateDeleteArtist(
  organizationId: string,
  artistId: string,
): Promise<{ allowed: boolean; references: ArtistReferenceSummary }> {
  return canDeleteArtist(organizationId, artistId);
}

export async function checkDuplicateArtists(
  organizationId: string,
  name: string,
  stageName?: string,
): Promise<DuplicateInfo> {
  const matches = await findDuplicateArtists(organizationId, name, stageName);
  return {
    isDuplicate: matches.length > 0,
    matches,
  };
}

export async function mergeArtists(
  organizationId: string,
  sourceArtistId: string,
  destinationArtistId: string,
): Promise<MergeResult> {
  if (sourceArtistId === destinationArtistId) {
    return { success: false, message: 'Cannot merge an artist with itself' };
  }

  const source = await getArtist(organizationId, sourceArtistId);
  if (!source) return { success: false, message: 'Source artist not found' };

  const destination = await getArtist(organizationId, destinationArtistId);
  if (!destination) return { success: false, message: 'Destination artist not found' };

  try {
    await repoMergeArtists(organizationId, sourceArtistId, destinationArtistId);
    return { success: true, message: `Successfully merged "${source.name}" into "${destination.name}"` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Merge failed',
    };
  }
}

export async function fetchArtistUsage(
  organizationId: string,
  artistId: string,
): Promise<ArtistUsageResult> {
  return getArtistUsage(organizationId, artistId);
}
