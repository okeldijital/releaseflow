/**
 * BUILD-220D — Legacy catalogue list → canonical Library path map.
 * Pure data (no React). Detail routes stay under /tracks/[id], /artists/[id].
 */

export const LEGACY_LIBRARY_REDIRECTS: Record<string, string> = {
  '/tracks': '/library/tracks',
  '/artists': '/library/artists',
};
