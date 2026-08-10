/**
 * BUILD-220D — Library module navigation (Tracks + Artists).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveActivePageTab,
  isPageTabActive,
} from '@releaseflow/ui';
import {
  LIBRARY_PAGE_TABS,
  COLLABORATION_PAGE_TABS,
  RELEASE_PAGE_TABS,
  LEGACY_LIBRARY_REDIRECTS,
} from '@/lib/navigation';

const webSrc = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

function exists(rel: string): boolean {
  return existsSync(join(webSrc, rel));
}

describe('BUILD-220D tab configuration', () => {
  it('exactly Tracks and Artists with canonical paths', () => {
    expect(LIBRARY_PAGE_TABS.map((t) => t.id)).toEqual(['tracks', 'artists']);
    expect(LIBRARY_PAGE_TABS.map((t) => t.label)).toEqual(['Tracks', 'Artists']);
    expect(LIBRARY_PAGE_TABS.map((t) => t.href)).toEqual([
      '/library/tracks',
      '/library/artists',
    ]);
  });

  it('Library ≠ Media Files / Assets', () => {
    expect(LIBRARY_PAGE_TABS.every((t) => !t.href.includes('/assets'))).toBe(
      true,
    );
  });
});

describe('BUILD-220D routes', () => {
  it('defines library routes', () => {
    expect(exists('app/(app)/library/page.tsx')).toBe(true);
    expect(exists('app/(app)/library/tracks/page.tsx')).toBe(true);
    expect(exists('app/(app)/library/artists/page.tsx')).toBe(true);
  });

  it('default /library → tracks', () => {
    const index = read('app/(app)/library/page.tsx');
    expect(index).toContain('/library/tracks');
    expect(index).toContain('router.replace');
  });

  it('wrappers use shared LibraryModule', () => {
    expect(read('app/(app)/library/tracks/page.tsx')).toContain('LibraryModule');
    expect(read('app/(app)/library/artists/page.tsx')).toContain('LibraryModule');
  });
});

describe('BUILD-220D active state', () => {
  it('/library/tracks → Tracks', () => {
    expect(resolveActivePageTab('/library/tracks', LIBRARY_PAGE_TABS)?.id).toBe(
      'tracks',
    );
  });

  it('/library/artists → Artists', () => {
    expect(resolveActivePageTab('/library/artists', LIBRARY_PAGE_TABS)?.id).toBe(
      'artists',
    );
  });

  it('only one tab active', () => {
    for (const path of ['/library/tracks', '/library/artists']) {
      expect(
        LIBRARY_PAGE_TABS.filter((t) =>
          isPageTabActive(path, t, LIBRARY_PAGE_TABS),
        ),
      ).toHaveLength(1);
    }
  });
});

describe('BUILD-220D shared module reuse', () => {
  it('uses PageTabs + ModulePage + existing views', () => {
    const mod = read('app/(app)/library/_components/library-module.tsx');
    expect(mod).toContain('PageTabs');
    expect(mod).toContain('ModulePage');
    expect(mod).toContain('LIBRARY_PAGE_TABS');
    expect(mod).toContain('TracksView');
    expect(mod).toContain('ArtistsView');
    expect(mod).toMatch(/Library/);
    expect(mod).not.toContain('LibraryTabs');
  });

  it('domain views reuse ArtistCard / track catalogue', () => {
    expect(read('app/(app)/artists/artists-view.tsx')).toContain('ArtistCard');
    expect(read('app/(app)/tracks/tracks-view.tsx')).toContain('TrackRow');
  });
});

describe('BUILD-220D legacy redirects', () => {
  it('maps /tracks and /artists list to library', () => {
    expect(LEGACY_LIBRARY_REDIRECTS['/tracks']).toBe('/library/tracks');
    expect(LEGACY_LIBRARY_REDIRECTS['/artists']).toBe('/library/artists');
  });

  it('list page wrappers redirect and preserve query capability', () => {
    expect(read('app/(app)/tracks/page.tsx')).toContain('LegacyLibraryRedirect');
    expect(read('app/(app)/artists/page.tsx')).toContain('LegacyLibraryRedirect');
    const redirect = read(
      'app/(app)/library/_components/legacy-library-redirect.tsx',
    );
    expect(redirect).toContain('searchParams');
    expect(redirect).toContain('?');
  });
});

describe('BUILD-220D sidebar & internal links', () => {
  it('admin sidebar has single Library module link', () => {
    const layout = read('app/(app)/layout.tsx');
    expect(layout).toContain("label: 'Library'");
    expect(layout).toContain("href: '/library'");
    const adminStart = layout.indexOf('const adminNavItems');
    const adminEnd = layout.indexOf('const collaboratorNavSections');
    const admin = layout.slice(adminStart, adminEnd);
    expect(admin).not.toMatch(/label: 'Tracks'/);
    expect(admin).not.toMatch(/label: 'Artists'/);
  });

  it('command palette points at library catalogue', () => {
    const palette = read('components/command-palette.tsx');
    expect(palette).toContain("url: '/library/tracks'");
    expect(palette).toContain("url: '/library/artists'");
  });

  it('dashboard catalogue link uses library tracks', () => {
    expect(read('app/(app)/dashboard/page.tsx')).toContain(
      'href="/library/tracks"',
    );
  });
});

describe('BUILD-220D does not break prior modules', () => {
  it('releases and collaboration configs remain', () => {
    expect(RELEASE_PAGE_TABS[0]?.href).toBe('/releases');
    expect(COLLABORATION_PAGE_TABS[0]?.href).toBe(
      '/collaboration/assignments',
    );
  });
});
