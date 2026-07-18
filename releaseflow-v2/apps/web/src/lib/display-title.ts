/**
 * EPIC-202 — Suggested display title generation.
 *
 * Format:
 *   [Original Artist(s)] – [Track Title] [feat. Featured…] [(Remix Artists Remix)]
 *
 * Always "feat." — never "ft." or "featuring".
 * Featured credits always appear before remix credits.
 */

export interface DisplayTitleInput {
  trackTitle: string;
  /** Ordered original / primary artist display names */
  originalArtistNames?: string[];
  /** Ordered featured artist display names */
  featuredArtistNames?: string[];
  /** Ordered remix artist display names */
  remixArtistNames?: string[];
  /** When true, treat as remix even if remix list empty */
  isRemix?: boolean;
}

/**
 * Join names with Oxford-style "A, B & C" for remix suffix.
 */
export function joinArtistNames(names: string[], style: 'comma' | 'ampersand' = 'comma'): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length === 0) return '';
  const first = clean[0] ?? '';
  if (clean.length === 1) return first;
  if (style === 'ampersand') {
    if (clean.length === 2) return `${first} & ${clean[1] ?? ''}`;
    const last = clean[clean.length - 1] ?? '';
    return `${clean.slice(0, -1).join(', ')} & ${last}`;
  }
  return clean.join(', ');
}

/**
 * Generate suggested display title from structured artist relationships.
 * Does not embed free-text artists — callers pass resolved names.
 */
export function generateSuggestedDisplayTitle(input: DisplayTitleInput): string {
  const title = input.trackTitle.trim();
  if (!title) return '';

  const originals = (input.originalArtistNames ?? []).map((n) => n.trim()).filter(Boolean);
  const featured = (input.featuredArtistNames ?? []).map((n) => n.trim()).filter(Boolean);
  const remixers = (input.remixArtistNames ?? []).map((n) => n.trim()).filter(Boolean);

  let result =
    originals.length > 0
      ? `${joinArtistNames(originals, 'ampersand')} – ${title}`
      : title;

  if (featured.length > 0) {
    result = `${result} feat. ${joinArtistNames(featured, 'comma')}`;
  }

  if (remixers.length > 0) {
    result = `${result} (${joinArtistNames(remixers, 'ampersand')} Remix)`;
  }

  return result;
}

/**
 * Backward-compatible remix-only helper (title + first remixer).
 * Prefer generateSuggestedDisplayTitle for full EPIC-202 rules.
 */
export function suggestRemixDisplayTitle(trackTitle: string, remixerName: string): string {
  return generateSuggestedDisplayTitle({
    trackTitle,
    remixArtistNames: remixerName ? [remixerName] : [],
    isRemix: true,
  });
}

/**
 * Detect duplicate artist ids in a list (same role).
 * Returns the first duplicate id or null.
 */
export function findDuplicateArtistId(artistIds: string[]): string | null {
  const seen = new Set<string>();
  for (const id of artistIds) {
    if (!id) continue;
    if (seen.has(id)) return id;
    seen.add(id);
  }
  return null;
}

/**
 * EPIC-202A — Single entry point for display titles across the app.
 *
 * Prefer a manually edited stored title; otherwise generate from structured
 * artist relationships. Use includeOriginalPrefix=false for compact list rows
 * (e.g. "Cow Song feat. Lungiswa") when original artists are shown separately.
 */
export function resolveTrackDisplayTitle(opts: {
  title: string;
  displayTitle?: string | null;
  displayTitleEdited?: boolean;
  originalArtistNames?: string[];
  featuredArtistNames?: string[];
  remixArtistNames?: string[];
  isRemix?: boolean;
  /** Default true. Set false for title-only rows (no "Artist – " prefix). */
  includeOriginalPrefix?: boolean;
}): string {
  if (opts.displayTitleEdited && opts.displayTitle?.trim()) {
    return opts.displayTitle.trim();
  }

  const includePrefix = opts.includeOriginalPrefix !== false;
  return generateSuggestedDisplayTitle({
    trackTitle: opts.title,
    originalArtistNames: includePrefix ? opts.originalArtistNames : [],
    featuredArtistNames: opts.featuredArtistNames,
    remixArtistNames: opts.remixArtistNames,
    isRemix: opts.isRemix,
  });
}

/**
 * Compact credit line for track cards:
 *   Busi Mhlongo
 *   feat. Lungiswa Plaatjies
 *   (Osaze Remix)
 * Returns multiline-friendly parts.
 */
export function formatArtistCreditLines(input: {
  originalArtistNames?: string[];
  featuredArtistNames?: string[];
  remixArtistNames?: string[];
}): { primary: string; featured?: string; remix?: string } {
  const originals = (input.originalArtistNames ?? []).map((n) => n.trim()).filter(Boolean);
  const featured = (input.featuredArtistNames ?? []).map((n) => n.trim()).filter(Boolean);
  const remixers = (input.remixArtistNames ?? []).map((n) => n.trim()).filter(Boolean);

  return {
    primary: originals.length > 0 ? joinArtistNames(originals, 'ampersand') : '',
    featured: featured.length > 0 ? `feat. ${joinArtistNames(featured, 'comma')}` : undefined,
    remix: remixers.length > 0 ? `(${joinArtistNames(remixers, 'ampersand')} Remix)` : undefined,
  };
}
