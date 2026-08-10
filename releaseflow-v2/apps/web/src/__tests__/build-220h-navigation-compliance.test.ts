/**
 * BUILD-220H — Navigation architecture compliance & shell cleanup.
 *
 * Global sidebar = modules only.
 * Module subsections / lifecycle live in PageTabs.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { shouldShowNavSectionHeading } from '@releaseflow/ui';
import {
  RELEASE_PAGE_TABS,
  COLLABORATION_PAGE_TABS,
  LIBRARY_PAGE_TABS,
  CALENDAR_PAGE_TABS,
  MEDIA_FILES_PAGE_TABS,
  LEGACY_COLLABORATION_REDIRECTS,
  LEGACY_LIBRARY_REDIRECTS,
  LEGACY_MEDIA_FILES_REDIRECTS,
  LEGACY_CALENDAR_REDIRECTS,
} from '@/lib/navigation';

const webSrc = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

function exists(rel: string): boolean {
  return existsSync(join(webSrc, rel));
}

/** Admin navItems array body only (excludes collaborator). */
function adminNavSource(): string {
  const layout = read('app/(app)/layout.tsx');
  const start = layout.indexOf('const adminNavItems');
  const end = layout.indexOf('const collaboratorNavSections');
  return layout.slice(start, end);
}

function adminSectionsSource(): string {
  const layout = read('app/(app)/layout.tsx');
  const start = layout.indexOf('const adminNavSections');
  const end = layout.indexOf('const adminNavItems');
  return layout.slice(start, end);
}

describe('BUILD-220H admin sidebar modules only', () => {
  it('contains exactly the approved top-level destinations', () => {
    const admin = adminNavSource();
    const hrefs = [...admin.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(hrefs).toEqual([
      '/dashboard',
      '/releases',
      '/collaboration',
      '/library',
      '/media-files',
      '/calendar',
      '/administration',
    ]);
  });

  it('labels are module names (not lifecycle / filter labels)', () => {
    const admin = adminNavSource();
    const labels = [...admin.matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(labels).toEqual([
      'Dashboard',
      'Releases',
      'Collaboration',
      'Library',
      'Media Files',
      'Calendar',
      'Administration',
    ]);
  });

  it('must not list Releases lifecycle as sidebar children', () => {
    const admin = adminNavSource();
    for (const banned of [
      'All Releases',
      'Draft Releases',
      'Active Releases',
      'Archived Releases',
    ]) {
      expect(admin).not.toContain(`label: '${banned}'`);
    }
    // Schedule as a Releases child is prohibited in sidebar
    expect(admin).not.toContain("href: '/releases/draft'");
    expect(admin).not.toContain("href: '/releases/active'");
    expect(admin).not.toContain("href: '/releases/archived'");
    expect(admin).not.toContain("href: '/releases/schedule'");
  });

  it('must not list Collaboration subsections as sidebar children', () => {
    const admin = adminNavSource();
    for (const banned of ['Assignments', 'Tasks', 'Inbox', 'People']) {
      expect(admin).not.toMatch(new RegExp(`label:\\s*'${banned}'`));
    }
    expect(admin).not.toContain("href: '/collaboration/assignments'");
    expect(admin).not.toContain("href: '/collaboration/tasks'");
  });

  it('must not list Library / Calendar subsections as sidebar children', () => {
    const admin = adminNavSource();
    expect(admin).not.toMatch(/label:\s*'Tracks'/);
    expect(admin).not.toMatch(/label:\s*'Artists'/);
    expect(admin).not.toMatch(/label:\s*'Deadlines'/);
    expect(admin).not.toContain("href: '/library/tracks'");
    expect(admin).not.toContain("href: '/calendar/schedule'");
  });

  it('has no duplicate hrefs in admin sidebar', () => {
    const admin = adminNavSource();
    const hrefs = [...admin.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('uses a flat modules section without repeating module names as headings', () => {
    const sections = adminSectionsSource();
    // One flat section key; empty label avoids RELEASES → Releases
    expect(sections).toContain("key: 'modules'");
    expect(sections).toMatch(/label:\s*''/);
    expect(sections).not.toContain("key: 'releases'");
    expect(sections).not.toContain("key: 'library'");
    expect(sections).not.toContain("key: 'calendar'");
  });
});

describe('BUILD-220H section heading normalization', () => {
  it('hides heading for empty section label', () => {
    expect(shouldShowNavSectionHeading('', [{ label: 'Releases' }])).toBe(false);
    expect(shouldShowNavSectionHeading('   ', [{ label: 'Releases' }])).toBe(
      false,
    );
  });

  it('hides heading when single child matches section label', () => {
    expect(
      shouldShowNavSectionHeading('Releases', [{ label: 'Releases' }]),
    ).toBe(false);
    expect(
      shouldShowNavSectionHeading('LIBRARY', [{ label: 'Library' }]),
    ).toBe(false);
  });

  it('keeps heading for multi-item sections', () => {
    expect(
      shouldShowNavSectionHeading('Main', [
        { label: 'Home' },
        { label: 'Profile' },
      ]),
    ).toBe(true);
  });

  it('keeps heading when single child label differs', () => {
    // Would still be wrong architecture if used for lifecycle, but rule is precise
    expect(
      shouldShowNavSectionHeading('Releases', [{ label: 'Draft Releases' }]),
    ).toBe(true);
  });
});

describe('BUILD-220H module PageTabs ownership', () => {
  it('Releases owns All/Draft/Active/Archived/Schedule', () => {
    expect(RELEASE_PAGE_TABS.map((t) => t.id)).toEqual([
      'all',
      'draft',
      'active',
      'archived',
      'schedule',
    ]);
    expect(RELEASE_PAGE_TABS.map((t) => t.href)).toEqual([
      '/releases',
      '/releases/draft',
      '/releases/active',
      '/releases/archived',
      '/releases/schedule',
    ]);
  });

  it('Collaboration owns Assignments/Tasks/Inbox/People', () => {
    expect(COLLABORATION_PAGE_TABS.map((t) => t.label)).toEqual([
      'Assignments',
      'Tasks',
      'Inbox',
      'People',
    ]);
  });

  it('Library owns Tracks/Artists', () => {
    expect(LIBRARY_PAGE_TABS.map((t) => t.id)).toEqual(['tracks', 'artists']);
  });

  it('Calendar owns Schedule/Deadlines/Releases', () => {
    expect(CALENDAR_PAGE_TABS.map((t) => t.id)).toEqual([
      'schedule',
      'deadlines',
      'releases',
    ]);
  });

  it('Media Files has no artificial multi-tabs', () => {
    expect(MEDIA_FILES_PAGE_TABS.map((t) => t.href)).toEqual(['/media-files']);
  });

  it('modules still use shared PageTabs / ModulePage', () => {
    for (const path of [
      'app/(app)/releases/_components/releases-module.tsx',
      'app/(app)/collaboration/_components/collaboration-module.tsx',
      'app/(app)/library/_components/library-module.tsx',
      'app/(app)/calendar/_components/calendar-module.tsx',
    ]) {
      const src = read(path);
      expect(src).toContain('PageTabs');
      expect(src).toContain('ModulePage');
    }
    const media = read(
      'app/(app)/media-files/_components/media-files-module.tsx',
    );
    expect(media).toContain('ModulePage');
    expect(media).not.toMatch(/import\s*\{[^}]*PageTabs/);
  });
});

describe('BUILD-220H legacy routes remain', () => {
  it('legacy redirect maps still exist', () => {
    expect(LEGACY_COLLABORATION_REDIRECTS['/assignments']).toBe(
      '/collaboration/assignments',
    );
    expect(LEGACY_LIBRARY_REDIRECTS['/tracks']).toBe('/library/tracks');
    expect(LEGACY_MEDIA_FILES_REDIRECTS['/assets']).toBe('/media-files');
    expect(LEGACY_CALENDAR_REDIRECTS['/schedule']).toBe('/calendar/schedule');
  });

  it('legacy list page wrappers still redirect', () => {
    expect(read('app/(app)/schedule/page.tsx')).toContain(
      'LegacyCalendarRedirect',
    );
    expect(read('app/(app)/assets/page.tsx')).toContain(
      'LegacyMediaFilesRedirect',
    );
    expect(read('app/(app)/tracks/page.tsx')).toContain('LegacyLibraryRedirect');
    expect(read('app/(app)/assignments/page.tsx')).toContain(
      'LegacyCollaborationRedirect',
    );
  });

  it('canonical module routes still exist', () => {
    expect(exists('app/(app)/releases/draft/page.tsx')).toBe(true);
    expect(exists('app/(app)/releases/schedule/page.tsx')).toBe(true);
    expect(exists('app/(app)/collaboration/tasks/page.tsx')).toBe(true);
    expect(exists('app/(app)/library/tracks/page.tsx')).toBe(true);
    expect(exists('app/(app)/calendar/deadlines/page.tsx')).toBe(true);
    expect(exists('app/(app)/media-files/page.tsx')).toBe(true);
  });
});

describe('BUILD-220H collaborator navigation preserved', () => {
  it('keeps task-oriented collaborator destinations', () => {
    const layout = read('app/(app)/layout.tsx');
    const start = layout.indexOf('const collaboratorNavItems');
    const end = layout.indexOf('const collaboratorBottomNavItems');
    const collab = layout.slice(start, end);
    expect(collab).toContain("label: 'Home'");
    expect(collab).toContain("label: 'My Assignments'");
    expect(collab).toContain("label: 'Tasks'");
    expect(collab).toContain("label: 'Comments'");
    expect(collab).toContain("label: 'Profile'");
  });

  it('bottom nav remains Home / Work / Calendar / Comments / Profile', () => {
    const layout = read('app/(app)/layout.tsx');
    const start = layout.indexOf('const collaboratorBottomNavItems');
    const end = layout.indexOf('/* ─── Route / nav rules');
    const bottom = layout.slice(start, end);
    const hrefs = [...bottom.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(hrefs).toEqual([
      '/home',
      '/collaboration/assignments',
      '/calendar',
      '/comments',
      '/profile',
    ]);
  });
});
