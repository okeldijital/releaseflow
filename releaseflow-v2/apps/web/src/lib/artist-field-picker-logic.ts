export interface ArtistOption {
  id: string;
  name: string;
  stageName?: string;
  imageUrl?: string | null;
  artistType?: string;
  status?: string;
  aliases?: string[];
}

export function normalizeArtistName(name: string): string {
  return name.trim().toLowerCase();
}

export function mergeArtistOptions(base: ArtistOption[], extras: ArtistOption[]): ArtistOption[] {
  const byId = new Map<string, ArtistOption>();
  for (const a of base) byId.set(a.id, a);
  for (const a of extras) byId.set(a.id, a);
  return Array.from(byId.values());
}

export function appendArtistOption(catalogue: ArtistOption[], created: ArtistOption): ArtistOption[] {
  if (catalogue.some((a) => a.id === created.id)) return catalogue;
  return [...catalogue, created];
}

export function toArtistOptions(records: { id: string; name: string; stageName?: string | null; imageUrl?: string | null; artistType?: string; status?: string; aliases?: string[] | null }[]): ArtistOption[] {
  return records.map((r) => ({
    id: r.id,
    name: r.name,
    stageName: r.stageName ?? undefined,
    imageUrl: r.imageUrl ?? null,
    artistType: r.artistType,
    status: r.status,
    aliases: r.aliases ?? undefined,
  }));
}

export function findArtistByName(artists: ArtistOption[], name: string): ArtistOption | undefined {
  const norm = normalizeArtistName(name);
  if (!norm) return undefined;
  return artists.find((a) => normalizeArtistName(a.name) === norm);
}

export function filterArtistsForSearch(artists: ArtistOption[], search: string): ArtistOption[] {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return [];
  return artists.filter((artist) => {
    if (artist.name.toLowerCase().includes(normalizedSearch)) return true;
    if (artist.stageName?.toLowerCase().includes(normalizedSearch)) return true;
    if (artist.aliases?.some((a) => a.toLowerCase().includes(normalizedSearch))) return true;
    return false;
  });
}

export function canCreateArtistFromSearch(catalogue: ArtistOption[], search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return false;
  const hasExactMatch = catalogue.some(
    (artist) => normalizeArtistName(artist.name) === normalizedSearch,
  );
  return !hasExactMatch;
}