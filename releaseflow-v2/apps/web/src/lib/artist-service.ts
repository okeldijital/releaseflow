import {
  createArtist,
  updateArtist,
  deleteArtist,
  getArtist,
  listArtists,
  searchArtists,
  getArtistReleases,
  getCreditsByArtist,
  getTrackTitle,
} from './artist-repository';
import type {
  ArtistRecord,
  CreateArtistFields,
  CreateArtistResult,
  UpdateArtistFields,
  TrackCreditRecord,
} from './artist-repository';

export type {
  ArtistRecord,
  CreateArtistFields,
  CreateArtistResult,
  UpdateArtistFields,
} from './artist-repository';

export interface ArtistReadinessResult {
  ready: boolean;
  percentage: number;
  missing: string[];
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
  return deleteArtist(organizationId, artistId);
}

export async function fetchArtist(organizationId: string, artistId: string): Promise<ArtistRecord | null> {
  return getArtist(organizationId, artistId);
}

export async function fetchArtists(organizationId: string): Promise<ArtistRecord[]> {
  return listArtists(organizationId);
}

export async function fetchArtistSearch(organizationId: string, query: string): Promise<ArtistRecord[]> {
  return searchArtists(organizationId, query);
}

export async function fetchArtistReleases(artistId: string) {
  return getArtistReleases(artistId);
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