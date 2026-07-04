import { describe, it, expect } from 'vitest';
import { normalizeArtistName } from '@/lib/artist-field-picker-logic';

describe('ArtistRepository contract', () => {
  it('exports canonical repository functions', async () => {
    const mod = await import('@/lib/artist-repository');
    expect(typeof mod.createArtist).toBe('function');
    expect(typeof mod.getArtist).toBe('function');
    expect(typeof mod.listArtists).toBe('function');
    expect(typeof mod.searchArtists).toBe('function');
    expect(typeof mod.updateArtist).toBe('function');
    expect(typeof mod.deleteArtist).toBe('function');
    expect(typeof mod.findArtistByNormalizedName).toBe('function');
  });

  it('exports artist service facade aligned with repository', async () => {
    const mod = await import('@/lib/artist-service');
    expect(typeof mod.createNewArtist).toBe('function');
    expect(typeof mod.fetchArtists).toBe('function');
    expect(typeof mod.fetchArtistSearch).toBe('function');
    expect(typeof mod.fetchArtistByNormalizedName).toBe('function');
    expect(typeof mod.fetchArtist).toBe('function');
    expect(typeof mod.editArtist).toBe('function');
    expect(typeof mod.removeArtist).toBe('function');
  });

  it('normalizes names for duplicate detection', () => {
    expect(normalizeArtistName('  Busi Mhlongo ')).toBe('busi mhlongo');
    expect(normalizeArtistName('BLACK COFFEE')).toBe('black coffee');
    expect(normalizeArtistName('Culoe De Song')).toBe('culoe de song');
    expect(normalizeArtistName('Busi Mhlongo')).toBe(normalizeArtistName('BUSI MHLONGO'));
  });

  it('createNewArtist requires organizationId', async () => {
    const { createNewArtist } = await import('@/lib/artist-service');
    await expect(
      createNewArtist({ name: 'Test', artistType: 'original_artist', organizationId: '' }),
    ).rejects.toThrow('Organization ID is required');
  });

  it('editArtist requires organizationId as first argument', async () => {
    const { editArtist } = await import('@/lib/artist-service');
    expect(editArtist.length).toBe(3);
  });
});