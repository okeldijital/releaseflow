'use client';

/**
 * BUILD-220D — Shared Library module presentation.
 *
 * Tabs: Tracks | Artists
 * Content reuses existing catalogue views (no second track/artist system).
 * Library = metadata catalogue; Media Files/Assets remain separate.
 */

import { usePathname, useRouter } from 'next/navigation';
import { ModulePage, PageTabs } from '@releaseflow/ui';
import { LIBRARY_PAGE_TABS } from '@/lib/navigation';
import { LibraryEmbedContext } from './library-embed-context';
import TracksView from '@/app/(app)/tracks/tracks-view';
import ArtistsView from '@/app/(app)/artists/artists-view';

export type LibraryTab = 'tracks' | 'artists';

export interface LibraryModuleProps {
  tab: LibraryTab;
}

export function LibraryModule({ tab }: LibraryModuleProps) {
  const pathname = usePathname() || '/library';
  const router = useRouter();

  const header = (
    <div>
      <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">
        Library
      </h1>
      <p className="mt-1 text-sm text-text-400">
        Track and artist metadata for your catalogue.
      </p>
    </div>
  );

  const tabs = (
    <PageTabs
      tabs={LIBRARY_PAGE_TABS}
      pathname={pathname}
      onNavigate={(href) => router.push(href)}
      aria-label="Library sections"
    />
  );

  return (
    <LibraryEmbedContext.Provider value={true}>
      <div className="page-transition" data-library-tab={tab}>
        <div className="mx-auto max-w-7xl px-5 sm:px-7 pt-8">
          <ModulePage header={header} tabs={tabs} />
        </div>
        {tab === 'tracks' ? <TracksView /> : null}
        {tab === 'artists' ? <ArtistsView /> : null}
      </div>
    </LibraryEmbedContext.Provider>
  );
}
