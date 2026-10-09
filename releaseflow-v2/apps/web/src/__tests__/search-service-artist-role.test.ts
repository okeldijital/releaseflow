import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAllReleases: vi.fn(),
  getTracksByOrg: vi.fn(),
  searchArtists: vi.fn(),
  getTracksByArtist: vi.fn(),
  searchPeople: vi.fn(),
  getTasks: vi.fn(),
}));

vi.mock('@/lib/release-repository', () => ({
  getAllReleases: mocks.getAllReleases,
}));

vi.mock('@/lib/track-repository', () => ({
  getTracksByOrg: mocks.getTracksByOrg,
}));

vi.mock('@/lib/track-artist-repository', () => ({
  getTracksByArtist: mocks.getTracksByArtist,
}));

vi.mock('@/lib/artist-repository', () => ({
  searchArtists: mocks.searchArtists,
}));

vi.mock('@/lib/people-repository', () => ({
  searchPeople: mocks.searchPeople,
}));

vi.mock('@/lib/task-repository', () => ({
  getTasks: mocks.getTasks,
}));

import { search } from '@/lib/search-service';

describe('global search by track artist credit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAllReleases.mockResolvedValue([]);
    mocks.getTracksByOrg.mockResolvedValue([
      {
        id: 'track-1',
        organizationId: 'org-1',
        title: 'Cow Song',
        displayTitle: 'Cow Song feat. Lungiswa Plaatjies',
        isrc: 'ZAX000000001',
        recordingType: 'original',
      },
    ]);
    mocks.searchArtists.mockResolvedValue([
      {
        id: 'artist-1',
        organizationId: 'org-1',
        name: 'Lungiswa Plaatjies',
        stageName: null,
        legalName: 'Lungiswa Plaatjies',
      },
    ]);
    mocks.getTracksByArtist.mockResolvedValue([
      {
        id: 'credit-1',
        organizationId: 'org-1',
        trackId: 'track-1',
        artistId: 'artist-1',
        role: 'FEATURED_ARTIST',
        position: 0,
      },
    ]);
    mocks.searchPeople.mockResolvedValue([]);
    mocks.getTasks.mockResolvedValue([]);
  });

  it('returns the credited track when searching for a featured artist', async () => {
    const results = await search('Lungiswa', 'org-1');
    const trackResult = results.find((result) => result.type === 'track');

    expect(trackResult).toMatchObject({
      id: 'track-1',
      title: 'Cow Song feat. Lungiswa Plaatjies',
      subtitle: 'Featured Artist: Lungiswa Plaatjies',
      url: '/tracks/track-1',
    });
    expect(mocks.getTracksByArtist).toHaveBeenCalledWith('org-1', 'artist-1');
  });
});
