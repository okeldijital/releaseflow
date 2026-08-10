/**
 * BUILD-220A — Module Navigation Foundation & Canonical PageTabs.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PageTabs,
  ModulePage,
  normalizePageTabPath,
  isPathUnderHref,
  resolveActivePageTab,
  isPageTabActive,
  resolveActivePageTabId,
  type PageTab,
} from '@releaseflow/ui';
import {
  RELEASE_PAGE_TABS,
  LIBRARY_PAGE_TABS,
  MEDIA_FILES_PAGE_TABS,
  SETTINGS_PAGE_TABS,
  MODULE_PAGE_TABS,
  COLLABORATION_PAGE_TABS,
} from '@/lib/navigation';

const webSrc = join(__dirname, '..');
const uiRoot = join(__dirname, '../../../../packages/ui/src');

function readWeb(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

function readUi(rel: string): string {
  return readFileSync(join(uiRoot, rel), 'utf8');
}

const releaseTabs = RELEASE_PAGE_TABS;

describe('BUILD-220A configuration contract', () => {
  it('accepts valid tab configuration with id, label, href', () => {
    for (const tab of releaseTabs) {
      expect(tab).toMatchObject({
        id: expect.any(String),
        label: expect.any(String),
        href: expect.any(String),
      });
      expect(tab.href.startsWith('/')).toBe(true);
    }
  });

  it('preserves configured tab order and labels', () => {
    expect(releaseTabs.map((t) => t.id)).toEqual([
      'all',
      'draft',
      'active',
      'archived',
      'schedule',
    ]);
    expect(releaseTabs.map((t) => t.label)).toEqual([
      'All',
      'Draft',
      'Active',
      'Archived',
      'Schedule',
    ]);
  });

  it('uses path-based URLs not query tabs', () => {
    for (const tab of releaseTabs) {
      expect(tab.href).not.toContain('?tab=');
      expect(tab.href).not.toContain('lifecycle=');
    }
    expect(releaseTabs.find((t) => t.id === 'draft')?.href).toBe(
      '/releases/draft',
    );
  });
});

describe('BUILD-220A active-state resolution', () => {
  it('normalizes paths (query, hash, trailing slash)', () => {
    expect(normalizePageTabPath('/releases/draft/?x=1#y')).toBe(
      '/releases/draft',
    );
    expect(normalizePageTabPath('/releases/')).toBe('/releases');
  });

  it('isPathUnderHref is boundary-safe', () => {
    expect(isPathUnderHref('/releases/draft', '/releases')).toBe(true);
    expect(isPathUnderHref('/releases', '/releases')).toBe(true);
    expect(isPathUnderHref('/releases-extra', '/releases')).toBe(false);
    expect(isPathUnderHref('/release', '/releases')).toBe(false);
  });

  it('root tab active only at root route (exact)', () => {
    const active = resolveActivePageTab('/releases', releaseTabs);
    expect(active?.id).toBe('all');
  });

  it('child tab active at child route', () => {
    expect(resolveActivePageTab('/releases/draft', releaseTabs)?.id).toBe(
      'draft',
    );
    expect(resolveActivePageTab('/releases/active', releaseTabs)?.id).toBe(
      'active',
    );
    expect(resolveActivePageTab('/releases/archived', releaseTabs)?.id).toBe(
      'archived',
    );
    expect(resolveActivePageTab('/releases/schedule', releaseTabs)?.id).toBe(
      'schedule',
    );
  });

  it('only one tab active — longest prefix wins over parent', () => {
    const path = '/releases/draft';
    const matches = releaseTabs.filter((t) =>
      isPageTabActive(path, t, releaseTabs),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.id).toBe('draft');
    expect(isPageTabActive(path, releaseTabs[0]!, releaseTabs)).toBe(false);
  });

  it('unrelated routes do not activate release tabs', () => {
    expect(resolveActivePageTab('/artists', releaseTabs)).toBeNull();
    expect(resolveActivePageTab('/dashboard', releaseTabs)).toBeNull();
    expect(resolveActivePageTab('/tracks/xyz', releaseTabs)).toBeNull();
  });

  it('does not use naive includes matching', () => {
    // /releases-extra must not light up /releases
    expect(isPathUnderHref('/releases-extra', '/releases')).toBe(false);
    expect(resolveActivePageTab('/releases-extra', releaseTabs)).toBeNull();
  });

  it('resolveActivePageTabId prefers explicit activeTab', () => {
    expect(
      resolveActivePageTabId(releaseTabs, {
        activeTab: 'archived',
        pathname: '/releases/draft',
      }),
    ).toBe('archived');
  });
});

describe('BUILD-220A PageTabs component surface', () => {
  it('exports PageTabs and pure helpers from design system', () => {
    expect(typeof PageTabs).toBe('function');
    expect(typeof resolveActivePageTab).toBe('function');
    expect(typeof ModulePage).toBe('function');
  });

  it('PageTabs is navigational (href) not content-panel onChange-only', () => {
    const src = readUi('navigation/page-tabs.tsx');
    expect(src).toContain('href={tab.href}');
    expect(src).toContain('onNavigate');
    expect(src).toContain('aria-current');
    expect(src).toContain('role="tablist"');
    // Must not fetch or talk to domain services
    expect(src).not.toContain('getDb');
    expect(src).not.toContain('firestore');
    expect(src).not.toContain('useRelease');
  });

  it('Tabs content-switcher remains separate and unchanged in purpose', () => {
    const tabsSrc = readUi('components/tabs.tsx');
    expect(tabsSrc).toContain('onChange');
    expect(tabsSrc).not.toContain('href');
  });

  it('configuration-driven — no hard-coded release labels in component', () => {
    const src = readUi('navigation/page-tabs.tsx');
    expect(src).not.toContain('Draft');
    expect(src).not.toContain('/releases/draft');
    expect(src).not.toContain('Media Files');
  });
});

describe('BUILD-220A module configs & terminology', () => {
  it('Media Files maps to Assets domain via /media-files UI route', () => {
    expect(MEDIA_FILES_PAGE_TABS[0]?.href).toBe('/media-files');
    expect(MODULE_PAGE_TABS['media-files']).toBe(MEDIA_FILES_PAGE_TABS);
  });

  it('Library is Tracks + Artists, not assets', () => {
    expect(LIBRARY_PAGE_TABS.map((t) => t.id)).toEqual(['tracks', 'artists']);
    expect(LIBRARY_PAGE_TABS.map((t) => t.href)).toEqual([
      '/library/tracks',
      '/library/artists',
    ]);
    expect(LIBRARY_PAGE_TABS.every((t) => !t.href.includes('/assets'))).toBe(
      true,
    );
  });

  it('Settings includes Storage as a settings tab (not sidebar item)', () => {
    const storage = SETTINGS_PAGE_TABS.find((t) => t.id === 'storage');
    expect(storage?.label).toBe('Storage');
    expect(storage?.href).toBeTruthy();
  });

  it('supports all target top-level modules as config keys', () => {
    expect(Object.keys(MODULE_PAGE_TABS).sort()).toEqual(
      [
        'calendar',
        'collaboration',
        'library',
        'media-files',
        'releases',
        'reports',
        'settings',
      ].sort(),
    );
  });

  it('collaboration config points at collaboration module routes', () => {
    const hrefs = COLLABORATION_PAGE_TABS.map((t) => t.href);
    // BUILD-220C canonical paths
    expect(hrefs).toContain('/collaboration/assignments');
    expect(hrefs).toContain('/collaboration/tasks');
    expect(hrefs).toContain('/collaboration/inbox');
    expect(hrefs).toContain('/collaboration/people');
  });
});

describe('BUILD-220A hierarchy & shell impact', () => {
  it('ModulePage documents header → tabs → toolbar → content order', () => {
    const src = readUi('layouts/module-page.tsx');
    expect(src).toContain('header');
    expect(src).toContain('tabs');
    expect(src).toContain('toolbar');
    expect(src).toContain('children');
    // Order in JSX: header, tabs, toolbar, children
    const headerIdx = src.indexOf('{header ?');
    const tabsIdx = src.indexOf('{tabs ?');
    const toolbarIdx = src.indexOf('{toolbar ?');
    const childrenIdx = src.indexOf('{children}');
    expect(headerIdx).toBeLessThan(tabsIdx);
    expect(tabsIdx).toBeLessThan(toolbarIdx);
    expect(toolbarIdx).toBeLessThan(childrenIdx);
  });

  it('does not modify AppShell / Sidebar / Topbar in this build', () => {
    // Structural: BUILD-220A files exist; shell sources still export AppShell unchanged names
    const shell = readUi('layouts/app-shell.tsx');
    expect(shell).toContain('export function AppShell');
    expect(shell).not.toContain('PageTabs');
    const sidebar = readUi('navigation/sidebar.tsx');
    expect(sidebar).not.toContain('PageTabs');
    const topbar = readUi('navigation/topbar.tsx');
    expect(topbar).not.toContain('PageTabs');
  });

  it('does not wire PageTabs into shell layout (module pages own tabs)', () => {
    const layout = readWeb('app/(app)/layout.tsx');
    expect(layout).not.toContain('PageTabs');
    // BUILD-220B wires Releases module — not the shell
    const module = readWeb('app/(app)/releases/_components/releases-module.tsx');
    expect(module).toContain('PageTabs');
    expect(module).toContain('RELEASE_PAGE_TABS');
  });

  it('does not add global search into PageTabs', () => {
    const src = readUi('navigation/page-tabs.tsx');
    expect(src).not.toContain('Search');
    expect(src).not.toContain('onSearch');
  });
});

describe('BUILD-220A accessibility contracts', () => {
  it('exposes tablist/tab roles, aria-selected, keyboard handlers', () => {
    const src = readUi('navigation/page-tabs.tsx');
    expect(src).toContain('role="tablist"');
    expect(src).toContain('role="tab"');
    expect(src).toContain('aria-selected');
    expect(src).toContain('ArrowRight');
    expect(src).toContain('ArrowLeft');
    expect(src).toContain('focus-visible:ring');
  });
});

describe('BUILD-220A typed configuration samples', () => {
  it('optional badge and disabled are supported on contract', () => {
    const withMeta: PageTab[] = [
      {
        id: 'draft',
        label: 'Draft',
        href: '/releases/draft',
        badge: 3,
        disabled: false,
      },
    ];
    expect(resolveActivePageTab('/releases/draft', withMeta)?.badge).toBe(3);
  });
});
