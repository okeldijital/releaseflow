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
    expect(typeof mod.archiveArtist).toBe('function');
    expect(typeof mod.restoreArtist).toBe('function');
    expect(typeof mod.mergeArtists).toBe('function');
    expect(typeof mod.canDeleteArtist).toBe('function');
    expect(typeof mod.getArtistUsage).toBe('function');
    expect(typeof mod.findDuplicateArtists).toBe('function');
  });

  it('archives artist', async () => {
    const mod = await import('@/lib/artist-repository');
    expect(mod.archiveArtist.length).toBe(2);
  });

  it('restores artist', async () => {
    const mod = await import('@/lib/artist-repository');
    expect(mod.restoreArtist.length).toBe(2);
  });

  it('canDeleteArtist returns allowed and references', async () => {
    const mod = await import('@/lib/artist-repository');
    expect(typeof mod.canDeleteArtist).toBe('function');
  });

  it('getArtistUsage returns usage statistics', async () => {
    const mod = await import('@/lib/artist-repository');
    expect(typeof mod.getArtistUsage).toBe('function');
  });

  it('findDuplicateArtists returns matches', async () => {
    const mod = await import('@/lib/artist-repository');
    expect(typeof mod.findDuplicateArtists).toBe('function');
  });

  it('mergeArtists requires 3 arguments', async () => {
    const mod = await import('@/lib/artist-repository');
    expect(mod.mergeArtists.length).toBe(3);
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
    expect(typeof mod.archiveArtist).toBe('function');
    expect(typeof mod.restoreArtist).toBe('function');
    expect(typeof mod.validateDeleteArtist).toBe('function');
    expect(typeof mod.checkDuplicateArtists).toBe('function');
    expect(typeof mod.mergeArtists).toBe('function');
    expect(typeof mod.fetchArtistUsage).toBe('function');
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

describe('ArtistRecord extended fields', () => {
  it('supports stageName, legalName, isni, ipi, notes, contact, aliases', async () => {
    type ArtistRecord = import('@/lib/artist-repository').ArtistRecord;
    const record: ArtistRecord = {
      id: 'a1', name: 'Test', slug: 'test', normalizedName: 'test',
      artistType: 'original_artist', organizationId: 'org1', status: 'active',
      createdAt: new Date(),
      stageName: 'Stage', legalName: 'Legal', isni: '0000',
      ipi: '123', notes: 'Notes', contact: 'email@test.com',
      aliases: ['A'],
    };
    expect(record.stageName).toBe('Stage');
    expect(record.legalName).toBe('Legal');
    expect(record.isni).toBe('0000');
    expect(record.ipi).toBe('123');
    expect(record.notes).toBe('Notes');
    expect(record.contact).toBe('email@test.com');
    expect(record.aliases).toEqual(['A']);
  });

  it('CreateArtistFields includes new optional fields', () => {
    const fields: Record<string, unknown> = {
      name: 'Test', artistType: 'original_artist', organizationId: 'org1',
      stageName: 'Stage', legalName: 'Legal', isni: '0000-0000-0000-0000',
      ipi: '123456789', notes: 'Internal note', contact: 'email@example.com',
      aliases: ['Alias 1', 'Alias 2'],
    };
    expect(fields.stageName).toBe('Stage');
    expect(fields.legalName).toBe('Legal');
    expect(fields.isni).toBe('0000-0000-0000-0000');
    expect(fields.ipi).toBe('123456789');
    expect(fields.notes).toBe('Internal note');
    expect(fields.contact).toBe('email@example.com');
    expect((fields.aliases as string[])).toHaveLength(2);
  });
});

describe('ArtistUsageResult', () => {
  it('contains all usage fields', () => {
    const usage = { tracks: 5, releases: 3, publishingCredits: 8, featuredAppearances: 2, remixes: 1 };
    expect(usage.tracks).toBe(5);
    expect(usage.releases).toBe(3);
    expect(usage.publishingCredits).toBe(8);
    expect(usage.featuredAppearances).toBe(2);
    expect(usage.remixes).toBe(1);
  });
});

describe('ArtistReferenceSummary', () => {
  it('contains reference counts', () => {
    const refs = { tracks: 12, releases: 4, publishingRecords: 2 };
    expect(refs.tracks).toBe(12);
    expect(refs.releases).toBe(4);
    expect(refs.publishingRecords).toBe(2);
  });
});
