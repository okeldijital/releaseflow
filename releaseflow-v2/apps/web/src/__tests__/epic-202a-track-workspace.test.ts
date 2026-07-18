/**
 * EPIC-202A — Featured Artist integration across Track Workspace
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  generateSuggestedDisplayTitle,
  resolveTrackDisplayTitle,
  formatArtistCreditLines,
} from '@/lib/display-title';
import { areTrackArtistsReady } from '@/lib/track-service';

const root = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('EPIC-202A display title consistency', () => {
  it('resolveTrackDisplayTitle prefers edited stored title', () => {
    expect(
      resolveTrackDisplayTitle({
        title: 'Cow Song',
        displayTitle: 'Custom Title',
        displayTitleEdited: true,
        originalArtistNames: ['Madala'],
        featuredArtistNames: ['Lungiswa'],
      }),
    ).toBe('Custom Title');
  });

  it('resolveTrackDisplayTitle generates compact list form without original prefix', () => {
    expect(
      resolveTrackDisplayTitle({
        title: 'Cow Song',
        originalArtistNames: ['Madala Kunene'],
        featuredArtistNames: ['Lungiswa Plaatjies'],
        includeOriginalPrefix: false,
      }),
    ).toBe('Cow Song feat. Lungiswa Plaatjies');
  });

  it('formatArtistCreditLines builds card credit parts', () => {
    const lines = formatArtistCreditLines({
      originalArtistNames: ['Busi Mhlongo'],
      featuredArtistNames: ['Lungiswa Plaatjies'],
      remixArtistNames: ['Osaze'],
    });
    expect(lines.primary).toBe('Busi Mhlongo');
    expect(lines.featured).toBe('feat. Lungiswa Plaatjies');
    expect(lines.remix).toBe('(Osaze Remix)');
  });

  it('full generator still includes original prefix', () => {
    expect(
      generateSuggestedDisplayTitle({
        trackTitle: 'Cow Song',
        originalArtistNames: ['Madala Kunene'],
        featuredArtistNames: ['Lungiswa Plaatjies'],
      }),
    ).toBe('Madala Kunene – Cow Song feat. Lungiswa Plaatjies');
  });
});

describe('EPIC-202A readiness', () => {
  it('requires original artists', () => {
    expect(
      areTrackArtistsReady({
        originalArtistIds: [],
        featuredArtistIds: ['f1'],
        remixArtistIds: [],
      }),
    ).toBe(false);
  });

  it('original only is ready for non-remix', () => {
    expect(
      areTrackArtistsReady({
        originalArtistIds: ['o1'],
        featuredArtistIds: [],
        remixArtistIds: [],
      }),
    ).toBe(true);
  });

  it('featured optional when originals present', () => {
    expect(
      areTrackArtistsReady({
        originalArtistIds: ['o1'],
        featuredArtistIds: ['f1'],
        remixArtistIds: [],
      }),
    ).toBe(true);
  });

  it('remix requires remix artists', () => {
    expect(
      areTrackArtistsReady({
        originalArtistIds: ['o1'],
        featuredArtistIds: [],
        remixArtistIds: [],
        isRemix: true,
      }),
    ).toBe(false);
    expect(
      areTrackArtistsReady({
        originalArtistIds: ['o1'],
        featuredArtistIds: ['f1'],
        remixArtistIds: ['r1'],
        isRemix: true,
      }),
    ).toBe(true);
  });
});

describe('EPIC-202A Track Workspace surfaces', () => {
  it('track workspace uses ArtistRelationshipList and structured credits', () => {
    const src = read('components/track-workspace.tsx');
    expect(src).toContain('ArtistRelationshipList');
    expect(src).toContain('Artist Credits');
    expect(src).toContain('syncTrackArtistCredits');
    expect(src).toContain('areTrackArtistsReady');
    expect(src).toContain('role="featured"');
    expect(src).toContain('Featured Artist');
    expect(src).toContain('track.featured_artist_added');
  });

  it('track service exposes sync and readiness helpers', () => {
    const src = read('lib/track-service.ts');
    expect(src).toContain('syncTrackArtistCredits');
    expect(src).toContain('areTrackArtistsReady');
    expect(src).toContain('track.featured_artist_added');
    expect(src).toContain('track.featured_artist_removed');
    expect(src).toContain('track.featured_artists_reordered');
  });

  it('assignment context includes featured artists', () => {
    const src = read('lib/fetch-assignment-context.ts');
    expect(src).toContain('featuredArtistNames');
    expect(src).toContain('trackDisplayTitle');
    expect(src).toContain('FEATURED_ARTIST');
  });

  it('command palette indexes tracks by artist role', () => {
    const src = read('components/command-palette.tsx');
    expect(src).toContain('Featured Artist');
    expect(src).toContain("type: 'track'");
    expect(src).toContain('featuredArtistIds');
  });

  it('display-title exports resolveTrackDisplayTitle as shared util', () => {
    const src = read('lib/display-title.ts');
    expect(src).toContain('export function resolveTrackDisplayTitle');
    expect(src).toContain('export function formatArtistCreditLines');
  });
});
