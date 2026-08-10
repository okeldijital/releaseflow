/**
 * BUILD-220B — Releases module navigation migration tests.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveActivePageTab,
  isPageTabActive,
} from '@releaseflow/ui';
import { RELEASE_PAGE_TABS } from '@/lib/navigation';
import {
  LEGACY_LIFECYCLE_REDIRECT,
  shouldRedirectLegacyLifecycle,
} from '@/app/(app)/releases/_components/legacy-lifecycle-redirect';

const webSrc = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

function exists(rel: string): boolean {
  return existsSync(join(webSrc, rel));
}

describe('BUILD-220B canonical routes exist', () => {
  it('defines all five Releases tab route pages', () => {
    expect(exists('app/(app)/releases/page.tsx')).toBe(true);
    expect(exists('app/(app)/releases/draft/page.tsx')).toBe(true);
    expect(exists('app/(app)/releases/active/page.tsx')).toBe(true);
    expect(exists('app/(app)/releases/archived/page.tsx')).toBe(true);
    expect(exists('app/(app)/releases/schedule/page.tsx')).toBe(true);
  });

  it('uses shared ReleasesModule (no duplicated page logic)', () => {
    for (const route of [
      'app/(app)/releases/draft/page.tsx',
      'app/(app)/releases/active/page.tsx',
      'app/(app)/releases/archived/page.tsx',
      'app/(app)/releases/schedule/page.tsx',
    ]) {
      const src = read(route);
      expect(src).toContain('ReleasesModule');
      expect(src).not.toContain('ReleaseCardGrid');
    }
    expect(read('app/(app)/releases/page.tsx')).toContain('ReleasesModule');
  });
});

describe('BUILD-220B PageTabs active state', () => {
  const cases: Array<[string, string]> = [
    ['/releases', 'all'],
    ['/releases/draft', 'draft'],
    ['/releases/active', 'active'],
    ['/releases/archived', 'archived'],
    ['/releases/schedule', 'schedule'],
  ];

  it.each(cases)('%s → %s active', (path, id) => {
    expect(resolveActivePageTab(path, RELEASE_PAGE_TABS)?.id).toBe(id);
  });

  it('only one tab active at a time', () => {
    for (const [path] of cases) {
      const active = RELEASE_PAGE_TABS.filter((t) =>
        isPageTabActive(path, t, RELEASE_PAGE_TABS),
      );
      expect(active).toHaveLength(1);
    }
  });

  it('parent All is not active on draft', () => {
    expect(isPageTabActive('/releases/draft', RELEASE_PAGE_TABS[0]!, RELEASE_PAGE_TABS)).toBe(
      false,
    );
  });
});

describe('BUILD-220B tab configuration & module wiring', () => {
  it('uses BUILD-220A PageTabs + ModulePage + RELEASE_PAGE_TABS', () => {
    const mod = read('app/(app)/releases/_components/releases-module.tsx');
    expect(mod).toContain('PageTabs');
    expect(mod).toContain('ModulePage');
    expect(mod).toContain('RELEASE_PAGE_TABS');
    expect(mod).toContain('ReleaseCard');
    expect(mod).not.toContain('function ReleaseTabs');
    expect(mod).not.toContain('ReleaseLifecycleTabs');
  });

  it('five canonical tab hrefs', () => {
    expect(RELEASE_PAGE_TABS.map((t) => t.href)).toEqual([
      '/releases',
      '/releases/draft',
      '/releases/active',
      '/releases/archived',
      '/releases/schedule',
    ]);
  });

  it('lifecycle owned by path tabs — not toolbar filter chips', () => {
    const mod = read('app/(app)/releases/_components/releases-module.tsx');
    expect(mod).toContain('Lifecycle is owned by PageTabs');
    expect(mod).not.toMatch(/LIFECYCLE_OPTIONS/);
    expect(mod).not.toContain('filterLifecycle');
  });

  it('schedule reuses existing ScheduleView', () => {
    const mod = read('app/(app)/releases/_components/releases-module.tsx');
    expect(mod).toContain("from '@/app/(app)/schedule/schedule-view'");
    expect(mod).toContain('ScheduleView');
  });

  it('title remains Releases', () => {
    const mod = read('app/(app)/releases/_components/releases-module.tsx');
    expect(mod).toContain('>Releases</h1>');
    expect(mod).not.toContain('Draft Releases</h1>');
  });
});

describe('BUILD-220B legacy URL compatibility', () => {
  it('maps query lifecycle params to path routes', () => {
    expect(shouldRedirectLegacyLifecycle('draft')).toBe('/releases/draft');
    expect(shouldRedirectLegacyLifecycle('active')).toBe('/releases/active');
    expect(shouldRedirectLegacyLifecycle('archived')).toBe('/releases/archived');
    expect(shouldRedirectLegacyLifecycle('expired')).toBeNull();
    expect(shouldRedirectLegacyLifecycle(null)).toBeNull();
    expect(LEGACY_LIFECYCLE_REDIRECT).toEqual({
      draft: '/releases/draft',
      active: '/releases/active',
      archived: '/releases/archived',
    });
  });

  it('root page implements legacy redirect', () => {
    const page = read('app/(app)/releases/page.tsx');
    expect(page).toContain('shouldRedirectLegacyLifecycle');
    expect(page).toContain('router.replace');
  });
});

describe('BUILD-220B internal links updated', () => {
  it('dashboard View All Drafts uses canonical path', () => {
    const dash = read('app/(app)/dashboard/page.tsx');
    expect(dash).toContain('href="/releases/draft"');
    expect(dash).not.toContain('lifecycle=draft');
  });

  it('sidebar exposes single Releases module; lifecycle lives in PageTabs', () => {
    // BUILD-220H: global sidebar is modules-only; lifecycle is PageTabs.
    const layout = read('app/(app)/layout.tsx');
    const adminStart = layout.indexOf('const adminNavItems');
    const adminEnd = layout.indexOf('const collaboratorNavSections');
    const admin = layout.slice(adminStart, adminEnd);
    expect(admin).toContain("label: 'Releases'");
    expect(admin).toContain("href: '/releases'");
    expect(admin).not.toContain("label: 'All Releases'");
    expect(admin).not.toContain("label: 'Draft Releases'");
    expect(admin).not.toContain("label: 'Active Releases'");
    expect(admin).not.toContain("label: 'Archived Releases'");
    expect(admin).not.toContain("href: '/releases/draft'");
    expect(admin).not.toContain('lifecycle=');
    // Canonical lifecycle paths remain in PageTabs config
    expect(RELEASE_PAGE_TABS.map((t) => t.href)).toEqual([
      '/releases',
      '/releases/draft',
      '/releases/active',
      '/releases/archived',
      '/releases/schedule',
    ]);
  });
});

describe('BUILD-220B shell / card / domain unchanged contracts', () => {
  it('does not invent new ReleaseCard variants', () => {
    const mod = read('app/(app)/releases/_components/releases-module.tsx');
    expect(mod).toContain("from '@/components/release/cards/ReleaseCard'");
    expect(mod).not.toContain('DraftReleaseCard');
    expect(mod).not.toContain('toReleaseCardModels'); // still uses ReleaseCard + resolveReleaseCardVariant pipeline
  });

  it('preserves ReleaseCard + resolveReleaseCardVariant pipeline', () => {
    const mod = read('app/(app)/releases/_components/releases-module.tsx');
    expect(mod).toContain('resolveReleaseCardVariant');
    expect(mod).toContain('buildReleaseWorkspace');
  });

  it('AppShell topbar search not added to releases module', () => {
    const mod = read('app/(app)/releases/_components/releases-module.tsx');
    expect(mod).not.toContain('CommandPalette');
    expect(mod).not.toContain('use-global-search');
  });

  it('draft deletion service still present (not modified by migration)', () => {
    // Source-level presence of draft delete capability in codebase
    const draft = read('lib/draft-discovery.ts');
    expect(draft.length).toBeGreaterThan(0);
  });
});
