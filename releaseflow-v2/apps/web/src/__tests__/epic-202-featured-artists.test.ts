/**
 * EPIC-202 — Featured Artists
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  generateSuggestedDisplayTitle,
  joinArtistNames,
  findDuplicateArtistId,
  suggestRemixDisplayTitle,
} from '@/lib/display-title';
import { normalizeArtistIdArray } from '@/lib/track-repository';

const root = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('EPIC-202 display title', () => {
  it('original only', () => {
    expect(
      generateSuggestedDisplayTitle({
        trackTitle: 'Cow Song',
        originalArtistNames: ['Madala Kunene'],
      }),
    ).toBe('Madala Kunene – Cow Song');
  });

  it('original + featured uses feat.', () => {
    const t = generateSuggestedDisplayTitle({
      trackTitle: 'Cow Song',
      originalArtistNames: ['Madala Kunene'],
      featuredArtistNames: ['Lungiswa Plaatjies'],
    });
    expect(t).toBe('Madala Kunene – Cow Song feat. Lungiswa Plaatjies');
    expect(t).toContain('feat.');
    expect(t).not.toMatch(/\bft\./i);
    expect(t).not.toMatch(/featuring/i);
  });

  it('multiple featured artists', () => {
    expect(
      generateSuggestedDisplayTitle({
        trackTitle: 'Cow Song',
        originalArtistNames: ['Madala Kunene'],
        featuredArtistNames: ['Lungiswa Plaatjies', 'Busi Mhlongo'],
      }),
    ).toBe('Madala Kunene – Cow Song feat. Lungiswa Plaatjies, Busi Mhlongo');
  });

  it('featured before remix', () => {
    const t = generateSuggestedDisplayTitle({
      trackTitle: 'Cow Song',
      originalArtistNames: ['Madala Kunene'],
      featuredArtistNames: ['Lungiswa Plaatjies'],
      remixArtistNames: ['Osaze'],
      isRemix: true,
    });
    expect(t).toBe(
      'Madala Kunene – Cow Song feat. Lungiswa Plaatjies (Osaze Remix)',
    );
    expect(t.indexOf('feat.')).toBeLessThan(t.indexOf('Remix'));
  });

  it('multiple remix artists use ampersand', () => {
    expect(
      generateSuggestedDisplayTitle({
        trackTitle: 'Cow Song',
        originalArtistNames: ['Madala Kunene'],
        featuredArtistNames: ['Lungiswa Plaatjies'],
        remixArtistNames: ['Osaze', 'SizKay', 'Kinn Timo'],
        isRemix: true,
      }),
    ).toBe(
      'Madala Kunene – Cow Song feat. Lungiswa Plaatjies (Osaze, SizKay & Kinn Timo Remix)',
    );
  });

  it('legacy suggestRemixDisplayTitle still works', () => {
    expect(suggestRemixDisplayTitle('Cow Song', 'Osaze')).toBe('Cow Song (Osaze Remix)');
  });

  it('joinArtistNames ampersand style', () => {
    expect(joinArtistNames(['A', 'B'], 'ampersand')).toBe('A & B');
    expect(joinArtistNames(['A', 'B', 'C'], 'ampersand')).toBe('A, B & C');
  });

  it('findDuplicateArtistId', () => {
    expect(findDuplicateArtistId(['a', 'b', 'a'])).toBe('a');
    expect(findDuplicateArtistId(['a', 'b'])).toBeNull();
  });
});

describe('EPIC-202 track storage compatibility', () => {
  it('normalizeArtistIdArray treats missing as empty', () => {
    expect(normalizeArtistIdArray(undefined)).toEqual([]);
    expect(normalizeArtistIdArray(null)).toEqual([]);
    expect(normalizeArtistIdArray(['x', '', 'y'])).toEqual(['x', 'y']);
  });

  it('track repository persists original/featured/remix id arrays', () => {
    const src = read('lib/track-repository.ts');
    expect(src).toContain('originalArtistIds');
    expect(src).toContain('featuredArtistIds');
    expect(src).toContain('remixArtistIds');
    expect(src).toContain('normalizeArtistIdArray');
  });

  it('track_artist repository exposes role queries', async () => {
    const mod = await import('@/lib/track-artist-repository');
    expect(typeof mod.getTracksAsOriginalArtist).toBe('function');
    expect(typeof mod.getTracksAsFeaturedArtist).toBe('function');
    expect(typeof mod.getTracksAsRemixArtist).toBe('function');
    expect(typeof mod.getAllArtistTracks).toBe('function');
  });

  it('shared ArtistRelationshipList exists', () => {
    const src = read('components/artists/artist-relationship-list.tsx');
    expect(src).toContain('ArtistRelationshipList');
    expect(src).toContain('featured');
    expect(src).toContain('remix');
    expect(src).toContain('original');
  });

  it('standalone track create uses featured on remix path', () => {
    const src = read('app/(app)/tracks/new/page.tsx');
    expect(src).toContain('ArtistRelationshipList');
    expect(src).toContain("role=\"featured\"");
    expect(src).toContain('generateSuggestedDisplayTitle');
    expect(src).toContain('FEATURED_ARTIST');
  });
});
