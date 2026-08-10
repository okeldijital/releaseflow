'use client';

/**
 * BUILD-220C — When true, tab surfaces suppress their own page H1
 * so ModulePage owns the "Collaboration" title.
 */

import { createContext, useContext } from 'react';

export const CollaborationEmbedContext = createContext(false);

export function useCollaborationEmbed(): boolean {
  return useContext(CollaborationEmbedContext);
}
