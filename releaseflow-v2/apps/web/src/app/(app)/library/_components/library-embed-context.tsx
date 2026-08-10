'use client';

/**
 * BUILD-220D — When true, track/artist catalogue views suppress page titles
 * so ModulePage owns the "Library" heading.
 */

import { createContext, useContext } from 'react';

export const LibraryEmbedContext = createContext(false);

export function useLibraryEmbed(): boolean {
  return useContext(LibraryEmbedContext);
}
