import {
  createArtist,
  updateArtist,
  deleteArtist,
  getArtist,
  getArtists,
  getArtistReleases,
  getArtistsByRelease,
  getCreditsByArtist,
  getTrackTitle,
} from './artist-repository';
import type {
  ArtistRecord,
  CreateArtistFields,
  UpdateArtistFields,
  TrackCreditRecord,
} from './artist-repository';

export type { ArtistRecord, CreateArtistFields, UpdateArtistFields } from './artist-repository';

export interface ArtistReadinessResult {
  ready: boolean;
  percentage: number;
  missing: string[];
}

export async function createNewArtist(fields: CreateArtistFields): Promise<string> {
  if (!fields.name.trim()) throw new Error('Artist name is required');
  return createArtist(fields);
}

export async function editArtist(artistId: string, fields: UpdateArtistFields): Promise<void> {
  return updateArtist(artistId, fields);
}

export async function removeArtist(artistId: string): Promise<void> {
  return deleteArtist(artistId);
}

export async function fetchArtist(artistId: string): Promise<ArtistRecord | null> {
  return getArtist(artistId);
}

export async function fetchArtists(): Promise<ArtistRecord[]> {
  return getArtists();
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

export async function checkArtistReadiness(artistId: string): Promise<ArtistReadinessResult> {
  const artist = await getArtist(artistId);
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
