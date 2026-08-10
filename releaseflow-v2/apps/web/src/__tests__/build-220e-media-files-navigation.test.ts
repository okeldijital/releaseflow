/**
 * BUILD-220E — Media Files module (Assets domain UI surface).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  MEDIA_FILES_PAGE_TABS,
  LIBRARY_PAGE_TABS,
  LEGACY_MEDIA_FILES_REDIRECTS,
} from '@/lib/navigation';

const webSrc = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

function exists(rel: string): boolean {
  return existsSync(join(webSrc, rel));
}

describe('BUILD-220E routes', () => {
  it('canonical /media-files exists', () => {
    expect(exists('app/(app)/media-files/page.tsx')).toBe(true);
    expect(read('app/(app)/media-files/page.tsx')).toContain('MediaFilesModule');
  });

  it('/assets list redirects to /media-files with query support', () => {
    expect(LEGACY_MEDIA_FILES_REDIRECTS['/assets']).toBe('/media-files');
    expect(read('app/(app)/assets/page.tsx')).toContain('LegacyMediaFilesRedirect');
    const redirect = read(
      'app/(app)/media-files/_components/legacy-media-files-redirect.tsx',
    );
    expect(redirect).toContain('searchParams');
  });
});

describe('BUILD-220E module chrome', () => {
  it('uses ModulePage + AssetsView without inventing tabs', () => {
    const mod = read(
      'app/(app)/media-files/_components/media-files-module.tsx',
    );
    expect(mod).toContain('ModulePage');
    expect(mod).toContain('AssetsView');
    expect(mod).toContain('Media Files');
    // No PageTabs import/usage (comment may mention PageTabs)
    expect(mod).not.toMatch(/import\s*\{[^}]*PageTabs/);
    expect(mod).not.toContain('<PageTabs');
    expect(mod).not.toContain('MediaFileCard');
    expect(mod).not.toContain('MediaFileRepository');
  });

  it('catalogue config points at /media-files', () => {
    expect(MEDIA_FILES_PAGE_TABS.map((t) => t.href)).toEqual(['/media-files']);
  });
});

describe('BUILD-220E domain preservation', () => {
  it('assets view still uses asset-entity-repository', () => {
    const view = read('app/(app)/assets/assets-view.tsx');
    expect(view).toContain('asset-entity-repository');
    expect(view).toContain('getAssetsByOrg');
    expect(view).toContain('createAsset');
    expect(view).toContain('Upload Asset');
  });

  it('does not create parallel media-file domain files', () => {
    expect(exists('lib/media-file-repository.ts')).toBe(false);
    expect(exists('lib/media-file-service.ts')).toBe(false);
  });
});

describe('BUILD-220E navigation', () => {
  it('sidebar exposes Media Files → /media-files', () => {
    const layout = read('app/(app)/layout.tsx');
    expect(layout).toContain("label: 'Media Files'");
    expect(layout).toContain("href: '/media-files'");
  });

  it('command palette includes Media Files', () => {
    expect(read('components/command-palette.tsx')).toContain(
      "url: '/media-files'",
    );
    expect(read('components/command-palette.tsx')).toContain('Media Files');
  });
});

describe('BUILD-220E library boundary', () => {
  it('Library remains Tracks + Artists only', () => {
    expect(LIBRARY_PAGE_TABS.map((t) => t.id)).toEqual(['tracks', 'artists']);
    expect(LIBRARY_PAGE_TABS.every((t) => !t.href.includes('media'))).toBe(
      true,
    );
    expect(LIBRARY_PAGE_TABS.every((t) => !t.href.includes('asset'))).toBe(
      true,
    );
  });
});
