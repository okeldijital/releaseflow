'use client';

/**
 * BUILD-220E — Media Files module chrome.
 *
 * User-facing: Media Files
 * Domain: existing Assets catalogue (unchanged).
 * No PageTabs — single catalogue surface (no artificial subsections).
 * Library (Tracks/Artists) remains a separate module.
 */

import { ModulePage } from '@releaseflow/ui';
import { MediaFilesEmbedContext } from './media-files-embed-context';
import AssetsView from '@/app/(app)/assets/assets-view';

export function MediaFilesModule() {
  const header = (
    <div>
      <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">
        Media Files
      </h1>
      <p className="mt-1 text-sm text-text-400">
        Artwork, masters, videos and production files for your organisation.
      </p>
    </div>
  );

  return (
    <MediaFilesEmbedContext.Provider value={true}>
      <div className="page-transition" data-media-files-module>
        <div className="mx-auto max-w-7xl px-5 sm:px-7 pt-8">
          <ModulePage header={header} />
        </div>
        <AssetsView />
      </div>
    </MediaFilesEmbedContext.Provider>
  );
}
