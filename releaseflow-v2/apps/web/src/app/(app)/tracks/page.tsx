'use client';

/**
 * BUILD-220D — Legacy list route redirects to /library/tracks.
 * Detail: /tracks/[id] and /tracks/new remain.
 */

import { LegacyLibraryRedirect } from '@/app/(app)/library/_components/legacy-library-redirect';

export default function TracksListRedirectPage() {
  return <LegacyLibraryRedirect fromPath="/tracks" />;
}
