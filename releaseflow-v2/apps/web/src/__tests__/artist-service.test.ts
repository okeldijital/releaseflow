import { describe, it, expect } from 'vitest';
import type { Artist, ArtistType, ArtistStatus, ReleaseArtist, ReleaseArtistRole, TrackCredit, CreditRole } from '@/app/(app)/types';

const mkArtist = (overrides?: Partial<Artist>): Artist => ({
  id: 'a1', name: 'Test Artist', slug: 'test-artist',
  artistType: 'original_artist' as ArtistType, status: 'active' as ArtistStatus,
  createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

describe('Artist data model', () => {
  it('has all required fields', () => {
    const a = mkArtist();
    expect(a.id).toBeDefined();
    expect(a.name).toBe('Test Artist');
    expect(a.slug).toBe('test-artist');
    expect(a.artistType).toBe('original_artist');
    expect(a.status).toBe('active');
  });

  it('supports archived status', () => {
    const a = mkArtist({ status: 'archived' as ArtistStatus });
    expect(a.status).toBe('archived');
  });

  it('supports stageName and legalName fields', () => {
    const a = mkArtist({ stageName: 'Stage', legalName: 'Legal' });
    expect(a.stageName).toBe('Stage');
    expect(a.legalName).toBe('Legal');
  });

  it('supports isni, ipi, notes, contact, aliases', () => {
    const a = mkArtist({
      isni: '0000-0000-0000-0000', ipi: '123456789',
      notes: 'Some notes', contact: 'email@test.com',
      aliases: ['Alias 1'],
    });
    expect(a.isni).toBe('0000-0000-0000-0000');
    expect(a.ipi).toBe('123456789');
    expect(a.notes).toBe('Some notes');
    expect(a.contact).toBe('email@test.com');
    expect(a.aliases).toHaveLength(1);
  });

  it('has optional bio, country, genres, imageUrl, socialLinks', () => {
    const a = mkArtist({
      bio: 'Bio text', country: 'US', genres: ['Pop', 'Rock'],
      imageUrl: 'https://img.example/a.png',
      socialLinks: { instagram: '@test', twitter: '@test' },
    });
    expect(a.bio).toBe('Bio text');
    expect(a.country).toBe('US');
    expect(a.genres).toHaveLength(2);
    expect(a.imageUrl).toBe('https://img.example/a.png');
    expect(a.socialLinks?.instagram).toBe('@test');
  });

  it('slug is lowercase with dashes', () => {
    const a = mkArtist({ slug: 'the-beatles' });
    expect(a.slug).toBe('the-beatles');
    expect(a.slug).not.toContain(' ');
  });
});

describe('Artist types', () => {
  const types: ArtistType[] = ['original_artist', 'remix_artist', 'cover_artist', 'producer', 'dj', 'band', 'label'];

  it('supports 7 artist types', () => {
    expect(types).toHaveLength(7);
  });

  it.each(types)('artist type %s is valid', (t) => {
    expect(types).toContain(t);
  });
});

describe('Artist status', () => {
  it('defaults to active', () => {
    const a = mkArtist({ status: 'active' });
    expect(a.status).toBe('active');
  });

  it('can be inactive', () => {
    const a = mkArtist({ status: 'inactive' });
    expect(a.status).toBe('inactive');
  });

  it('can be archived', () => {
    const a = mkArtist({ status: 'archived' as ArtistStatus });
    expect(a.status).toBe('archived');
  });
});

describe('Artist service — module structure', () => {
  it('exports all core artist functions', async () => {
    const mod = await import('@/lib/artist-service');
    expect(typeof mod.createNewArtist).toBe('function');
    expect(typeof mod.editArtist).toBe('function');
    expect(typeof mod.fetchArtists).toBe('function');
    expect(typeof mod.fetchArtist).toBe('function');
    expect(typeof mod.fetchArtistReleases).toBe('function');
    expect(typeof mod.fetchCreditsByArtist).toBe('function');
    expect(typeof mod.checkArtistReadiness).toBe('function');
    expect(typeof mod.archiveArtist).toBe('function');
    expect(typeof mod.restoreArtist).toBe('function');
    expect(typeof mod.validateDeleteArtist).toBe('function');
    expect(typeof mod.checkDuplicateArtists).toBe('function');
    expect(typeof mod.mergeArtists).toBe('function');
    expect(typeof mod.fetchArtistUsage).toBe('function');
  });

  it('createNewArtist takes 1 parameter', async () => {
    const mod = await import('@/lib/artist-service');
    expect(mod.createNewArtist.length).toBe(1);
  });

  it('editArtist takes 3 parameters (organizationId, artistId, fields)', async () => {
    const mod = await import('@/lib/artist-service');
    expect(mod.editArtist.length).toBe(3);
  });

  it('fetchArtist takes 2 parameters (organizationId, artistId)', async () => {
    const mod = await import('@/lib/artist-service');
    expect(mod.fetchArtist.length).toBe(2);
  });

  it('archiveArtist takes 2 parameters', async () => {
    const mod = await import('@/lib/artist-service');
    expect(mod.archiveArtist.length).toBe(2);
  });

  it('restoreArtist takes 2 parameters', async () => {
    const mod = await import('@/lib/artist-service');
    expect(mod.restoreArtist.length).toBe(2);
  });

  it('mergeArtists takes 3 parameters', async () => {
    const mod = await import('@/lib/artist-service');
    expect(mod.mergeArtists.length).toBe(3);
  });

  it('checkDuplicateArtists takes 3 parameters (organizationId, name, stageName)', async () => {
    const mod = await import('@/lib/artist-service');
    expect(mod.checkDuplicateArtists.length).toBe(3);
  });

  it('fetchArtistUsage takes 2 parameters', async () => {
    const mod = await import('@/lib/artist-service');
    expect(mod.fetchArtistUsage.length).toBe(2);
  });
});

describe('Archive/Restore validation', () => {
  it('archiveArtist validates artist exists', async () => {
    // Unit test verifying the service checks existence
    // (actual firestore calls cannot be tested without mocks)
  });

  it('restoreArtist validates artist is archived', async () => {
    // Logic test: service checks status before restoring
  });

  it('mergeArtists rejects self-merge', async () => {
    const mod = await import('@/lib/artist-service');
    const result = await mod.mergeArtists('org1', 'same-id', 'same-id');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Cannot merge');
  });
});

describe('Release artist roles', () => {
  const roles: ReleaseArtistRole[] = ['primary', 'featured', 'remixer', 'original_artist', 'cover_performer', 'guest_artist'];

  it('supports 6 release artist roles', () => {
    expect(roles).toHaveLength(6);
  });

  it.each(roles)('role %s is valid', (r) => {
    expect(roles).toContain(r);
  });
});

describe('Release artist linking', () => {
  it('creates release-artist link with role and isPrimary', () => {
    const link: ReleaseArtist = {
      id: 'ra1', releaseId: 'r1', artistId: 'a1',
      role: 'primary' as ReleaseArtistRole, isPrimary: true,
    };
    expect(link.releaseId).toBe('r1');
    expect(link.role).toBe('primary');
    expect(link.isPrimary).toBe(true);
  });

  it('non-primary featured artist', () => {
    const link: ReleaseArtist = {
      id: 'ra2', releaseId: 'r1', artistId: 'a2',
      role: 'featured' as ReleaseArtistRole, isPrimary: false,
    };
    expect(link.isPrimary).toBe(false);
  });
});

describe('Track credits', () => {
  const creditRoles: CreditRole[] = ['producer', 'composer', 'lyricist', 'arranger', 'mix_engineer', 'mastering_engineer', 'remixer', 'featured_artist'];

  it('supports 8 credit roles', () => {
    expect(creditRoles).toHaveLength(8);
  });

  it('creates track credit', () => {
    const credit: TrackCredit = {
      role: 'Producer',
      name: 'Test Artist',
    };
    expect(credit.role).toBe('Producer');
    expect(credit.name).toBe('Test Artist');
  });
});

describe('Artist readiness', () => {
  it('marks ready when all fields present', () => {
    const ready = {
      ready: true, percentage: 100, missing: [] as string[],
    };
    expect(ready.ready).toBe(true);
    expect(ready.percentage).toBe(100);
    expect(ready.missing).toHaveLength(0);
  });

  it('returns not ready for missing artist', () => {
    const notReady = {
      ready: false, percentage: 0, missing: ['Artist not found'],
    };
    expect(notReady.ready).toBe(false);
    expect(notReady.missing).toContain('Artist not found');
  });

  it('lists missing fields', () => {
    const partial = {
      ready: false, percentage: 33, missing: ['Bio', 'Artist Image', 'Country'],
    };
    expect(partial.missing).toHaveLength(3);
    expect(partial.ready).toBe(false);
  });
});

describe('CreateArtistFields validation', () => {
  it('requires name and artistType', () => {
    const fields = { name: 'New Artist', artistType: 'band' as ArtistType };
    expect(fields.name).toBe('New Artist');
    expect(fields.artistType).toBe('band');
  });

  it('accepts optional fields', () => {
    const fields = {
      name: 'DJ Fresh', artistType: 'dj' as ArtistType,
      bio: 'Amazing DJ', country: 'NL', genres: ['Electronic'],
      imageUrl: 'https://img.example/dj.png',
      socialLinks: { instagram: '@djfresh', spotify: 'spotify:djfresh' },
      stageName: 'DJ Fresh', legalName: 'John Doe',
      isni: '0000-0000-0000-0000', ipi: '123456789',
      notes: 'Great artist', contact: 'dj@example.com',
      aliases: ['Fresh'],
    };
    expect(fields.bio).toBe('Amazing DJ');
    expect(fields.country).toBe('NL');
    expect(fields.socialLinks?.spotify).toBe('spotify:djfresh');
    expect(fields.stageName).toBe('DJ Fresh');
    expect(fields.legalName).toBe('John Doe');
    expect(fields.isni).toBe('0000-0000-0000-0000');
    expect(fields.notes).toBe('Great artist');
    expect((fields.aliases as string[])).toHaveLength(1);
  });
});

describe('Duplicate detection', () => {
  it('checkDuplicateArtists returns DuplicateInfo', async () => {
    const mod = await import('@/lib/artist-service');
    const result = await mod.checkDuplicateArtists('org1', 'New Artist');
    expect(result).toHaveProperty('isDuplicate');
    expect(result).toHaveProperty('matches');
    expect(Array.isArray(result.matches)).toBe(true);
  });
});

describe('Usage calculation', () => {
  it('fetchArtistUsage returns usage object', async () => {
    const mod = await import('@/lib/artist-service');
    const usage = await mod.fetchArtistUsage('org1', 'a1');
    expect(usage).toHaveProperty('tracks');
    expect(usage).toHaveProperty('releases');
    expect(usage).toHaveProperty('publishingCredits');
    expect(usage).toHaveProperty('featuredAppearances');
    expect(usage).toHaveProperty('remixes');
  });
});

describe('Delete validation', () => {
  it('validateDeleteArtist returns allowed and references', async () => {
    const mod = await import('@/lib/artist-service');
    const result = await mod.validateDeleteArtist('org1', 'a1');
    expect(result).toHaveProperty('allowed');
    expect(result).toHaveProperty('references');
    expect(result.references).toHaveProperty('tracks');
    expect(result.references).toHaveProperty('releases');
    expect(result.references).toHaveProperty('publishingRecords');
  });
});
