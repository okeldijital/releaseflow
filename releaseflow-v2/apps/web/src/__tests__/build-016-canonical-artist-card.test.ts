/**
 * BUILD-016 — Canonical Artist Card
 *
 * Exactly one ArtistCard, ArtistCardModel, and toArtistCardModels mapper.
 * Artists page and pickers consume the canonical component.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  toArtistCardModel,
  ARTIST_TYPE_LABELS,
  type ArtistCardModel,
} from '@/lib/artist-card-model';
import type { ArtistRecord } from '@/lib/artist-repository';

const root = join(__dirname, '..');
const cardPath = join(root, 'components/artists/ArtistCard.tsx');
const modelPath = join(root, 'lib/artist-card-model.ts');
const servicePath = join(root, 'lib/artist-service.ts');
const artistsPagePath = join(root, 'app/(app)/artists/page.tsx');
const pickerPath = join(root, 'components/artist-field-picker.tsx');

function walkTsx(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkTsx(p, acc);
    else if (/\.(tsx|ts)$/.test(name)) acc.push(p);
  }
  return acc;
}

function baseArtist(over: Partial<ArtistRecord> = {}): ArtistRecord {
  return {
    id: 'a1',
    name: 'Test Artist',
    slug: 'test-artist',
    normalizedName: 'test artist',
    artistType: 'original_artist',
    organizationId: 'org1',
    status: 'active',
    createdAt: null,
    imageUrl: null,
    imagePublicId: null,
    genres: ['House'],
    stageName: 'TA',
    legalName: null,
    ...over,
  };
}

describe('BUILD-016 single ArtistCard component', () => {
  const src = readFileSync(cardPath, 'utf8');

  it('exposes size compact | standard | large only', () => {
    expect(src).toContain("export type ArtistCardSize = 'compact' | 'standard' | 'large'");
    expect(src).toContain('SIZE_STYLES');
  });

  it('implements one layout (image, name, subtitle, stats, menu)', () => {
    expect(src).toContain('aspect-square');
    expect(src).toContain('line-clamp-2');
    expect(src).toContain('EntityOverflowMenu');
    expect(src).toContain('artist.subtitle');
    expect(src).toContain('Releases:');
    expect(src).toContain('Tracks:');
  });

  it('does not fork separate list/table card layouts', () => {
    expect(src).not.toContain('renderListRow');
    expect(src).not.toContain('renderTableRow');
    expect(src).not.toContain('renderCompactRow');
  });

  it('is the only ArtistCard export in the web app', () => {
    const files = walkTsx(root).filter((f) => !f.includes('/__tests__/'));
    const defs = files.filter((f) => {
      const text = readFileSync(f, 'utf8');
      return /export function ArtistCard\b/.test(text) || /export const ArtistCard\b/.test(text);
    });
    expect(defs).toEqual([cardPath]);
  });
});

describe('BUILD-016 ArtistCardModel + mapper', () => {
  const modelSrc = readFileSync(modelPath, 'utf8');
  const serviceSrc = readFileSync(servicePath, 'utf8');

  it('defines exactly one ArtistCardModel interface', () => {
    expect(modelSrc).toContain('export interface ArtistCardModel');
    expect(modelSrc.match(/export interface ArtistCardModel/g)?.length).toBe(1);
  });

  it('defines toArtistCardModel and toArtistCardModels', () => {
    expect(modelSrc).toContain('export function toArtistCardModel');
    expect(modelSrc).toContain('export async function toArtistCardModels');
  });

  it('service re-exports mapper and provides fetchArtistCardModels', () => {
    expect(serviceSrc).toContain('fetchArtistCardModels');
    expect(serviceSrc).toContain('fetchArtistSearchCardModels');
    expect(serviceSrc).toContain("export { toArtistCardModel, toArtistCardModels }");
  });

  it('toArtistCardModel resolves subtitle without inventing labels', () => {
    const known = toArtistCardModel(baseArtist({ artistType: 'producer' }));
    expect(known.subtitle).toBe(ARTIST_TYPE_LABELS.producer);
    expect(known.subtitle).toBe('Producer');

    const unknown = toArtistCardModel(baseArtist({ artistType: 'mystery_role' }));
    expect(unknown.subtitle).toBe('mystery_role');

    const empty = toArtistCardModel(baseArtist({ artistType: '' }));
    expect(empty.subtitle).toBe('');
  });

  it('toArtistCardModel attaches counts, menu actions, and search helpers', () => {
    const model = toArtistCardModel(baseArtist({ status: 'active' }), {
      releases: 12,
      tracks: 43,
    });
    expect(model.releaseCount).toBe(12);
    expect(model.trackCount).toBe(43);
    expect(model.menuActions).toContain('view');
    expect(model.menuActions).toContain('edit');
    expect(model.menuActions).toContain('archive');
    expect(model.menuActions).toContain('delete');
    expect(model.menuActions).not.toContain('restore');
    expect(model.stageName).toBe('TA');

    const archived = toArtistCardModel(baseArtist({ status: 'archived' }));
    expect(archived.menuActions).toContain('restore');
    expect(archived.menuActions).not.toContain('archive');
  });

  it('hides counts when unavailable (null)', () => {
    const model: ArtistCardModel = toArtistCardModel(baseArtist());
    expect(model.releaseCount).toBeNull();
    expect(model.trackCount).toBeNull();
  });

  it('uses MediaUrlService for imagePublicId resolution', () => {
    expect(modelSrc).toContain('MediaUrlService.artist');
    expect(modelSrc).toContain('imagePublicId');
  });
});

describe('BUILD-016 call sites consume ArtistCard', () => {
  it('artists page uses ArtistCard grid, not Avatar rows', () => {
    const page = readFileSync(artistsPagePath, 'utf8');
    expect(page).toContain('ArtistCard');
    expect(page).toContain('artistCards');
    expect(page).toContain('size="standard"');
    expect(page).toContain('data-artist-card-grid');
    expect(page).not.toContain('Avatar');
    expect(page).not.toContain('fetchArtistLinkCounts');
    expect(page).not.toContain('EntityOverflowMenu');
  });

  it('artist search/picker results use ArtistCard compact', () => {
    const picker = readFileSync(pickerPath, 'utf8');
    expect(picker).toContain('ArtistCard');
    expect(picker).toContain('size="compact"');
    expect(picker).toContain('data-artist-search-results');
    expect(picker).toContain('onSelect');
  });

  it('useArtists maps via toArtistCardModels (no page-level mapping)', () => {
    const hook = readFileSync(join(root, 'hooks/useArtist.ts'), 'utf8');
    expect(hook).toContain('toArtistCardModels');
    expect(hook).toContain('artistCards');
    expect(hook).toContain('pickerCardModels');
  });
});

describe('BUILD-016 no parallel artist card components', () => {
  it('no second artist card implementation files', () => {
    const files = walkTsx(join(root, 'components'));
    const suspect = files.filter((f) => {
      const base = f.split('/').pop() ?? '';
      if (base === 'ArtistCard.tsx') return false;
      return /artist[-_]?card/i.test(base);
    });
    expect(suspect).toEqual([]);
  });
});
