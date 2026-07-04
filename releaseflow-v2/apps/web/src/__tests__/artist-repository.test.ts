import { describe, it, expect } from 'vitest';
import { normalizeArtistName } from '@/lib/artist-field-picker-logic';
import { mergeArtistCatalogues, type ArtistRecord } from '@/lib/artist-repository';

const mkRecord = (id: string, name: string): ArtistRecord => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  normalizedName: name.toLowerCase(),
  artistType: 'original_artist',
  organizationId: 'org1',
  status: 'active',
  createdAt: null,
});

describe('ArtistRepository contract', () => {
  it('exports canonical repository functions', async () => {
    const mod = await import('@/lib/artist-repository');
    expect(typeof mod.createArtist).toBe('function');
    expect(typeof mod.getArtist).toBe('function');
    expect(typeof mod.listArtists).toBe('function');
    expect(typeof mod.searchArtists).toBe('function');
    expect(typeof mod.updateArtist).toBe('function');
    expect(typeof mod.deleteArtist).toBe('function');
  });

  it('exports artist service facade aligned with repository', async () => {
    const mod = await import('@/lib/artist-service');
    expect(typeof mod.createNewArtist).toBe('function');
    expect(typeof mod.fetchArtists).toBe('function');
    expect(typeof mod.fetchArtistSearch).toBe('function');
    expect(typeof mod.fetchArtist).toBe('function');
    expect(typeof mod.editArtist).toBe('function');
    expect(typeof mod.removeArtist).toBe('function');
  });

  it('normalizes names for duplicate detection', () => {
    expect(normalizeArtistName('  Busi Mhlongo ')).toBe('busi mhlongo');
    expect(normalizeArtistName('BLACK COFFEE')).toBe('black coffee');
    expect(normalizeArtistName('Culoe De Song')).toBe('culoe de song');
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

  it('mergeArtistCatalogues combines sources without duplicate IDs', () => {
    const legacy = [mkRecord('1', 'Busi Mhlongo'), mkRecord('2', 'Black Coffee')];
    const nested = [mkRecord('2', 'Black Coffee'), mkRecord('3', 'Culoe De Song')];
    const merged = mergeArtistCatalogues(legacy, nested);
    expect(merged).toHaveLength(3);
    expect(merged.map((a) => a.id).sort()).toEqual(['1', '2', '3']);
    expect(merged.find((a) => a.id === '2')?.name).toBe('Black Coffee');
  });

  it('mergeArtistCatalogues prefers nested record on ID collision', () => {
    const legacy = [mkRecord('1', 'Legacy Name')];
    const nested = [{ ...mkRecord('1', 'Canonical Name'), artistType: 'remix_artist' }];
    const merged = mergeArtistCatalogues(legacy, nested);
    expect(merged[0]?.name).toBe('Canonical Name');
    expect(merged[0]?.artistType).toBe('remix_artist');
  });
});