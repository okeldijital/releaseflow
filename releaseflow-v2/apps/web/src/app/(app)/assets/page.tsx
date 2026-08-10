'use client';

/**
 * BUILD-220E — Legacy Assets list redirects to /media-files.
 * Domain/repo/services remain Assets; UI module is Media Files.
 */

import { LegacyMediaFilesRedirect } from '@/app/(app)/media-files/_components/legacy-media-files-redirect';

export default function AssetsListRedirectPage() {
  return <LegacyMediaFilesRedirect fromPath="/assets" />;
}
