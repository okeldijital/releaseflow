'use client';

/**
 * BUILD-220D — Legacy list route redirects to /library/artists.
 * Detail: /artists/[id] and /artists/new remain.
 */

import { LegacyLibraryRedirect } from '@/app/(app)/library/_components/legacy-library-redirect';

export default function ArtistsListRedirectPage() {
  return <LegacyLibraryRedirect fromPath="/artists" />;
}
