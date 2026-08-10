'use client';

/**
 * BUILD-220E — When true, Assets catalogue suppresses its own page title
 * so MediaFilesModule owns the "Media Files" heading.
 */

import { createContext, useContext } from 'react';

export const MediaFilesEmbedContext = createContext(false);

export function useMediaFilesEmbed(): boolean {
  return useContext(MediaFilesEmbedContext);
}
