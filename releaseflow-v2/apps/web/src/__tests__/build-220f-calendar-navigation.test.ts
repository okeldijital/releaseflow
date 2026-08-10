/**
 * BUILD-220F — Calendar module navigation (Schedule | Deadlines | Releases).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveActivePageTab,
  isPageTabActive,
} from '@releaseflow/ui';
import {
  CALENDAR_PAGE_TABS,
  RELEASE_PAGE_TABS,
  LIBRARY_PAGE_TABS,
  MEDIA_FILES_PAGE_TABS,
  COLLABORATION_PAGE_TABS,
  LEGACY_CALENDAR_REDIRECTS,
} from '@/lib/navigation';

const webSrc = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

function exists(rel: string): boolean {
  return existsSync(join(webSrc, rel));
}

describe('BUILD-220F tab configuration', () => {
  it('exactly Schedule, Deadlines, Releases with canonical paths', () => {
    expect(CALENDAR_PAGE_TABS.map((t) => t.id)).toEqual([
      'schedule',
      'deadlines',
      'releases',
    ]);
    expect(CALENDAR_PAGE_TABS.map((t) => t.label)).toEqual([
      'Schedule',
      'Deadlines',
      'Releases',
    ]);
    expect(CALENDAR_PAGE_TABS.map((t) => t.href)).toEqual([
      '/calendar/schedule',
      '/calendar/deadlines',
      '/calendar/releases',
    ]);
  });

  it('Calendar Releases ≠ Releases Schedule', () => {
    const calReleases = CALENDAR_PAGE_TABS.find((t) => t.id === 'releases');
    const relSchedule = RELEASE_PAGE_TABS.find((t) => t.id === 'schedule');
    expect(calReleases?.href).toBe('/calendar/releases');
    expect(relSchedule?.href).toBe('/releases/schedule');
    expect(calReleases?.href).not.toBe(relSchedule?.href);
  });
});

describe('BUILD-220F routes', () => {
  it('defines calendar routes', () => {
    expect(exists('app/(app)/calendar/page.tsx')).toBe(true);
    expect(exists('app/(app)/calendar/schedule/page.tsx')).toBe(true);
    expect(exists('app/(app)/calendar/deadlines/page.tsx')).toBe(true);
    expect(exists('app/(app)/calendar/releases/page.tsx')).toBe(true);
  });

  it('default /calendar → schedule', () => {
    const index = read('app/(app)/calendar/page.tsx');
    expect(index).toContain('/calendar/schedule');
    expect(index).toContain('router.replace');
  });

  it('wrappers use shared CalendarModule', () => {
    expect(read('app/(app)/calendar/schedule/page.tsx')).toContain(
      'CalendarModule',
    );
    expect(read('app/(app)/calendar/deadlines/page.tsx')).toContain(
      'CalendarModule',
    );
    expect(read('app/(app)/calendar/releases/page.tsx')).toContain(
      'CalendarModule',
    );
  });

  it('/releases/schedule remains independent', () => {
    expect(exists('app/(app)/releases/schedule/page.tsx')).toBe(true);
    const page = read('app/(app)/releases/schedule/page.tsx');
    expect(page).toContain('ReleasesModule');
    expect(page).not.toContain('CalendarModule');
  });
});

describe('BUILD-220F active state', () => {
  it.each([
    ['/calendar/schedule', 'schedule'],
    ['/calendar/deadlines', 'deadlines'],
    ['/calendar/releases', 'releases'],
  ] as const)('%s → %s', (path, id) => {
    expect(resolveActivePageTab(path, CALENDAR_PAGE_TABS)?.id).toBe(id);
  });

  it('only one tab active', () => {
    for (const path of [
      '/calendar/schedule',
      '/calendar/deadlines',
      '/calendar/releases',
    ]) {
      expect(
        CALENDAR_PAGE_TABS.filter((t) =>
          isPageTabActive(path, t, CALENDAR_PAGE_TABS),
        ),
      ).toHaveLength(1);
    }
  });

  it('nested calendar path does not activate wrong tab via includes()', () => {
    // boundary-safe: /calendar/releases-extra must not match releases
    expect(
      resolveActivePageTab('/calendar/releases-extra', CALENDAR_PAGE_TABS),
    ).toBeNull();
  });

  it('/releases/schedule does not activate Calendar tabs', () => {
    expect(
      resolveActivePageTab('/releases/schedule', CALENDAR_PAGE_TABS),
    ).toBeNull();
    expect(
      resolveActivePageTab('/releases/schedule', RELEASE_PAGE_TABS)?.id,
    ).toBe('schedule');
  });

  it('/calendar/releases does not activate Releases module schedule tab', () => {
    expect(
      resolveActivePageTab('/calendar/releases', RELEASE_PAGE_TABS),
    ).toBeNull();
  });
});

describe('BUILD-220F shared module reuse', () => {
  it('uses PageTabs + ModulePage + existing ScheduleView', () => {
    const mod = read(
      'app/(app)/calendar/_components/calendar-module.tsx',
    );
    expect(mod).toContain('PageTabs');
    expect(mod).toContain('ModulePage');
    expect(mod).toContain('CALENDAR_PAGE_TABS');
    expect(mod).toContain('ScheduleView');
    expect(mod).toMatch(/Calendar/);
    expect(mod).not.toContain('CalendarTabs');
    expect(mod).not.toContain('CalendarCard');
    expect(mod).not.toContain('NewCalendar');
  });

  it('reuses schedule-view and schedule-service (no parallel domain)', () => {
    expect(exists('app/(app)/schedule/schedule-view.tsx')).toBe(true);
    const view = read('app/(app)/schedule/schedule-view.tsx');
    expect(view).toContain('schedule-service');
    expect(view).toContain('loadScheduleAssignments');
    expect(view).toContain('loadScheduleMilestones');
    expect(view).toContain("surface === 'deadlines'");
    expect(exists('lib/calendar-repository.ts')).toBe(false);
    expect(exists('lib/calendar-service.ts')).toBe(false);
    expect(exists('lib/deadline-repository.ts')).toBe(false);
  });

  it('does not invent CalendarTabs or CalendarCard components', () => {
    expect(exists('components/calendar/CalendarCard.tsx')).toBe(false);
    expect(exists('components/calendar/CalendarTabs.tsx')).toBe(false);
  });
});

describe('BUILD-220F legacy redirects', () => {
  it('maps /schedule → /calendar/schedule', () => {
    expect(LEGACY_CALENDAR_REDIRECTS['/schedule']).toBe(
      '/calendar/schedule',
    );
  });

  it('list page wrapper redirects and preserves query', () => {
    expect(read('app/(app)/schedule/page.tsx')).toContain(
      'LegacyCalendarRedirect',
    );
    const redirect = read(
      'app/(app)/calendar/_components/legacy-calendar-redirect.tsx',
    );
    expect(redirect).toContain('searchParams');
    expect(redirect).toContain('?');
  });
});

describe('BUILD-220F sidebar & command palette', () => {
  it('admin sidebar has single Calendar module link', () => {
    const layout = read('app/(app)/layout.tsx');
    expect(layout).toContain("label: 'Calendar'");
    expect(layout).toContain("href: '/calendar'");
    // Sidebar must not list Schedule/Deadlines/Releases as Calendar children
    const calSection = layout.indexOf("key: 'calendar'");
    expect(calSection).toBeGreaterThan(-1);
    // Releases section still has its own Schedule → /releases/schedule
    expect(layout).toContain("href: '/releases/schedule'");
  });

  it('collaborator nav points at Calendar not raw /schedule', () => {
    const layout = read('app/(app)/layout.tsx');
    expect(layout).toContain("href: '/calendar'");
    // Bottom nav Calendar
    const bottomStart = layout.indexOf('collaboratorBottomNavItems');
    const bottom = layout.slice(bottomStart, bottomStart + 1200);
    expect(bottom).toContain("href: '/calendar'");
    expect(bottom).not.toContain("href: '/schedule'");
  });

  it('command palette points at canonical Calendar routes', () => {
    const palette = read('components/command-palette.tsx');
    expect(palette).toContain("url: '/calendar'");
    expect(palette).toContain("url: '/calendar/schedule'");
    expect(palette).toContain("url: '/calendar/deadlines'");
    expect(palette).toContain("url: '/calendar/releases'");
    expect(palette).not.toContain("url: '/schedule'");
  });

  it('dashboard and home links use canonical calendar schedule', () => {
    expect(read('app/(app)/dashboard/page.tsx')).toContain(
      'href="/calendar/schedule"',
    );
    expect(read('app/(app)/home/page.tsx')).toContain(
      "href: '/calendar/schedule'",
    );
  });
});

describe('BUILD-220F does not break prior modules', () => {
  it('prior EPIC-220 configs remain', () => {
    expect(RELEASE_PAGE_TABS[0]?.href).toBe('/releases');
    expect(COLLABORATION_PAGE_TABS[0]?.href).toBe(
      '/collaboration/assignments',
    );
    expect(LIBRARY_PAGE_TABS.map((t) => t.id)).toEqual(['tracks', 'artists']);
    expect(MEDIA_FILES_PAGE_TABS[0]?.href).toBe('/media-files');
  });
});
