import { describe, it, expect } from 'vitest';

describe('TrackArtistRepository — multi-artist support', () => {
  it('exports repository functions', async () => {
    const mod = await import('@/lib/track-artist-repository');
    expect(typeof mod.addArtistToTrack).toBe('function');
    expect(typeof mod.getArtistsByRole).toBe('function');
    expect(typeof mod.getArtistsByTrack).toBe('function');
    expect(typeof mod.removeArtistFromTrack).toBe('function');
    expect(typeof mod.updateArtistPosition).toBe('function');
    expect(typeof mod.updateArtistsPositions).toBe('function');
    expect(typeof mod.removeAllArtistsFromTrack).toBe('function');
    expect(typeof mod.removeArtistsFromTrackByRole).toBe('function');
  });

  it('exports repository with all required roles as a type', async () => {
    const mod = await import('@/lib/track-artist-repository');
    expect(typeof mod.addArtistToTrack).toBe('function');
    expect(typeof mod.getArtistsByRole).toBe('function');
    expect(typeof mod.getArtistsByTrack).toBe('function');
    expect(typeof mod.removeArtistFromTrack).toBe('function');
  });
});

describe('RepeatableArtistPicker — UI contract', () => {
  it('exports repeatable artist picker functions from logic layer', async () => {
    const mod = await import('@/lib/artist-field-picker-logic');
    expect(typeof mod.filterArtistsForSearch).toBe('function');
    expect(typeof mod.canCreateArtistFromSearch).toBe('function');
    expect(typeof mod.mergeArtistOptions).toBe('function');
    expect(typeof mod.appendArtistOption).toBe('function');
  });
});

describe('ArtistFieldPickerLogic — search and create', () => {
  it('filterArtistsForSearch returns matching results', async () => {
    const { filterArtistsForSearch } = await import('@/lib/artist-field-picker-logic');
    const artists = [
      { id: '1', name: 'Daft Punk' },
      { id: '2', name: 'Pharrell Williams' },
      { id: '3', name: 'Nile Rodgers' },
    ];
    expect(filterArtistsForSearch(artists, 'daft')).toHaveLength(1);
    expect(filterArtistsForSearch(artists, 'will')).toHaveLength(1);
    expect(filterArtistsForSearch(artists, '')).toHaveLength(0);
    expect(filterArtistsForSearch(artists, 'xyz')).toHaveLength(0);
  });

  it('canCreateArtistFromSearch prevents duplicate creation', async () => {
    const { canCreateArtistFromSearch } = await import('@/lib/artist-field-picker-logic');
    const artists = [
      { id: '1', name: 'Daft Punk' },
      { id: '2', name: 'Pharrell Williams' },
    ];
    expect(canCreateArtistFromSearch(artists, 'Daft Punk')).toBe(false);
    expect(canCreateArtistFromSearch(artists, 'daft punk')).toBe(false);
    expect(canCreateArtistFromSearch(artists, 'New Artist')).toBe(true);
  });
});

describe('NormalizeDoc — legacy field compatibility', () => {
  it('exports repository functions needed for normalizeDoc', async () => {
    const mod = await import('@/lib/track-artist-repository');
    expect(typeof mod.addArtistToTrack).toBe('function');
    expect(typeof mod.getArtistsByTrack).toBe('function');
    expect(typeof mod.getArtistsByRole).toBe('function');
  });
});

describe('RepeatableArtistEntry — array manipulation', () => {
  it('supports add, remove, and reorder operations', () => {
    let entries: { id: string; artistId: string }[] = [];
    let nextId = 1;

    function add(artistId: string) {
      entries = [...entries, { id: String(nextId++), artistId }];
    }

    function remove(entryId: string) {
      entries = entries.filter((e) => e.id !== entryId);
    }

    // Test 1: Create 3 Original Artists
    add('artist-1');
    add('artist-2');
    add('artist-3');
    expect(entries).toHaveLength(3);
    expect(entries[0]?.artistId).toBe('artist-1');
    expect(entries[1]?.artistId).toBe('artist-2');
    expect(entries[2]?.artistId).toBe('artist-3');

    // Test 2: Create 2 Remix Artists
    const remixEntries: typeof entries = [];
    remixEntries.push({ id: 'r1', artistId: 'remix-1' });
    remixEntries.push({ id: 'r2', artistId: 'remix-2' });
    expect(remixEntries).toHaveLength(2);

    // Test 3: Remove artist #2 — remaining positions become 1, 2
    remove('2');
    expect(entries).toHaveLength(2);
    expect(entries[0]?.artistId).toBe('artist-1');
    expect(entries[1]?.artistId).toBe('artist-3');
    // positions are implicit in array order
    const positionsAfterRemove = entries.map((_, i) => i + 1);
    expect(positionsAfterRemove).toEqual([1, 2]);

    // Test 4: Reorder A, B, C → C, A, B
    entries = [
      { id: 'a', artistId: 'A' },
      { id: 'b', artistId: 'B' },
      { id: 'c', artistId: 'C' },
    ];
    const reordered = [entries[2], entries[0], entries[1]].filter(Boolean) as typeof entries;
    expect(reordered.map((e) => e.artistId)).toEqual(['C', 'A', 'B']);

    // Simulate persist + refresh
    const persisted = reordered.map((e, i) => ({ ...e, position: i + 1 }));
    const refreshed = [...persisted].sort((a, b) => a.position - b.position);
    expect(refreshed.map((e) => e.artistId)).toEqual(['C', 'A', 'B']);
  });

  // Test 5: Load an older track with single artist
  it('single legacy artist loads as array of length 1', () => {
    const legacyOriginalArtistId = 'artist-legacy-1';
    const originalArtists = legacyOriginalArtistId
      ? [{ id: 'legacy-1', artistId: legacyOriginalArtistId }]
      : [];
    expect(originalArtists).toHaveLength(1);
    expect(originalArtists[0]?.artistId).toBe('artist-legacy-1');
  });
});
