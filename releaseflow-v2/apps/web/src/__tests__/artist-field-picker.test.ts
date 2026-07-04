import { describe, it, expect } from 'vitest';
import {
  appendArtistOption,
  filterArtistsForSearch,
  canCreateArtistFromSearch,
  toArtistOptions,
  type ArtistOption,
} from '@/lib/artist-field-picker-logic';

const catalogue: ArtistOption[] = [
  { id: '1', name: 'Busi Mhlongo' },
  { id: '2', name: 'Black Coffee' },
];

describe('artist-field-picker search logic', () => {
  it('returns no results for empty search', () => {
    expect(filterArtistsForSearch(catalogue, '')).toEqual([]);
    expect(filterArtistsForSearch(catalogue, '   ')).toEqual([]);
  });

  it('filters partial matches on every search value', () => {
    expect(filterArtistsForSearch(catalogue, 'Busi')).toEqual([catalogue[0]]);
    expect(filterArtistsForSearch(catalogue, 'coffee')).toEqual([catalogue[1]]);
  });

  it('does not offer create for empty search', () => {
    expect(canCreateArtistFromSearch(catalogue, '')).toBe(false);
  });

  it('does not offer create when exact match exists', () => {
    expect(canCreateArtistFromSearch(catalogue, 'Busi Mhlongo')).toBe(false);
    expect(canCreateArtistFromSearch(catalogue, 'busi mhlongo')).toBe(false);
    expect(canCreateArtistFromSearch(catalogue, ' BLACK COFFEE ')).toBe(false);
  });

  it('offers create when there is no exact match', () => {
    expect(canCreateArtistFromSearch(catalogue, 'Busi')).toBe(true);
    expect(canCreateArtistFromSearch(catalogue, 'Black Coffee Remix')).toBe(true);
    expect(canCreateArtistFromSearch(catalogue, 'Sun-El Musician')).toBe(true);
  });

  it('supports remix UAT sequence across searches', () => {
    let session = [...catalogue];

    const busiSearch = 'Busi';
    expect(filterArtistsForSearch(session, busiSearch)).toHaveLength(1);
    expect(canCreateArtistFromSearch(session, busiSearch)).toBe(true);

    session = [...session, { id: '3', name: 'Nomfundo Moh' }];

    expect(filterArtistsForSearch(session, 'Black Coffee')).toEqual([{ id: '2', name: 'Black Coffee' }]);
    expect(canCreateArtistFromSearch(session, 'Black Coffee')).toBe(false);

    expect(filterArtistsForSearch(session, 'Sun-El Musician')).toEqual([]);
    expect(canCreateArtistFromSearch(session, 'Sun-El Musician')).toBe(true);
  });
});

describe('organisation artist catalogue helpers', () => {
  it('maps repository records to picker options', () => {
    expect(toArtistOptions([
      { id: 'a1', name: 'Busi Mhlongo' },
      { id: 'a2', name: 'Black Coffee' },
    ])).toEqual([
      { id: 'a1', name: 'Busi Mhlongo' },
      { id: 'a2', name: 'Black Coffee' },
    ]);
  });

  it('appends a created artist without duplicates', () => {
    const created = { id: '3', name: 'Culoe De Song' };
    expect(appendArtistOption(catalogue, created)).toEqual([...catalogue, created]);
    expect(appendArtistOption(catalogue, catalogue[0]!)).toEqual(catalogue);
  });

  it('supports UAT-001 #009 remix album track progression', () => {
    let orgCatalogue: ArtistOption[] = [];

    orgCatalogue = appendArtistOption(orgCatalogue, { id: '1', name: 'Busi Mhlongo' });
    orgCatalogue = appendArtistOption(orgCatalogue, { id: '2', name: 'Black Coffee' });

    expect(filterArtistsForSearch(orgCatalogue, 'Busi Mhlongo')).toHaveLength(1);
    expect(canCreateArtistFromSearch(orgCatalogue, 'Busi Mhlongo')).toBe(false);
    expect(canCreateArtistFromSearch(orgCatalogue, 'Black Coffee')).toBe(false);

    orgCatalogue = appendArtistOption(orgCatalogue, { id: '3', name: 'Culoe De Song' });

    expect(orgCatalogue).toHaveLength(3);
    expect(filterArtistsForSearch(orgCatalogue, 'Black Coffee')).toHaveLength(1);
    expect(filterArtistsForSearch(orgCatalogue, 'Culoe')).toHaveLength(1);
    expect(canCreateArtistFromSearch(orgCatalogue, 'Busi Mhlongo')).toBe(false);
    expect(canCreateArtistFromSearch(orgCatalogue, 'Black Coffee')).toBe(false);
    expect(canCreateArtistFromSearch(orgCatalogue, 'Culoe De Song')).toBe(false);
  });
});