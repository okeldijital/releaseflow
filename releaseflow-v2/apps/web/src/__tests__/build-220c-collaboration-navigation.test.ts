/**
 * BUILD-220C — Collaboration module navigation migration tests.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveActivePageTab,
  isPageTabActive,
} from '@releaseflow/ui';
import { COLLABORATION_PAGE_TABS, RELEASE_PAGE_TABS } from '@/lib/navigation';
import { LEGACY_COLLABORATION_REDIRECTS } from '@/lib/navigation/legacy-collaboration-redirects';

const webSrc = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

function exists(rel: string): boolean {
  return existsSync(join(webSrc, rel));
}

describe('BUILD-220C tab configuration', () => {
  it('four tabs with correct labels and order', () => {
    expect(COLLABORATION_PAGE_TABS.map((t) => t.id)).toEqual([
      'assignments',
      'tasks',
      'inbox',
      'people',
    ]);
    expect(COLLABORATION_PAGE_TABS.map((t) => t.label)).toEqual([
      'Assignments',
      'Tasks',
      'Inbox',
      'People',
    ]);
  });

  it('canonical hrefs under /collaboration', () => {
    expect(COLLABORATION_PAGE_TABS.map((t) => t.href)).toEqual([
      '/collaboration/assignments',
      '/collaboration/tasks',
      '/collaboration/inbox',
      '/collaboration/people',
    ]);
  });
});

describe('BUILD-220C routes', () => {
  it('defines collaboration route wrappers', () => {
    expect(exists('app/(app)/collaboration/page.tsx')).toBe(true);
    expect(exists('app/(app)/collaboration/assignments/page.tsx')).toBe(true);
    expect(exists('app/(app)/collaboration/tasks/page.tsx')).toBe(true);
    expect(exists('app/(app)/collaboration/inbox/page.tsx')).toBe(true);
    expect(exists('app/(app)/collaboration/people/page.tsx')).toBe(true);
  });

  it('wrappers use shared CollaborationModule', () => {
    for (const route of [
      'app/(app)/collaboration/assignments/page.tsx',
      'app/(app)/collaboration/tasks/page.tsx',
      'app/(app)/collaboration/inbox/page.tsx',
      'app/(app)/collaboration/people/page.tsx',
    ]) {
      expect(read(route)).toContain('CollaborationModule');
    }
  });

  it('default entry redirects to assignments', () => {
    const index = read('app/(app)/collaboration/page.tsx');
    expect(index).toContain('/collaboration/assignments');
    expect(index).toContain('router.replace');
  });
});

describe('BUILD-220C active state', () => {
  const cases: Array<[string, string]> = [
    ['/collaboration/assignments', 'assignments'],
    ['/collaboration/tasks', 'tasks'],
    ['/collaboration/inbox', 'inbox'],
    ['/collaboration/people', 'people'],
  ];

  it.each(cases)('%s → %s active', (path, id) => {
    expect(resolveActivePageTab(path, COLLABORATION_PAGE_TABS)?.id).toBe(id);
  });

  it('only one tab active', () => {
    for (const [path] of cases) {
      const active = COLLABORATION_PAGE_TABS.filter((t) =>
        isPageTabActive(path, t, COLLABORATION_PAGE_TABS),
      );
      expect(active).toHaveLength(1);
    }
  });
});

describe('BUILD-220C shared module reuse', () => {
  it('uses PageTabs + ModulePage + existing domain views', () => {
    const mod = read(
      'app/(app)/collaboration/_components/collaboration-module.tsx',
    );
    expect(mod).toContain('PageTabs');
    expect(mod).toContain('ModulePage');
    expect(mod).toContain('COLLABORATION_PAGE_TABS');
    expect(mod).toContain('AssignmentsView');
    expect(mod).toContain('TasksView');
    expect(mod).toContain('NotificationsView');
    expect(mod).toContain('PeopleView');
    expect(mod).toContain('Collaboration');
    expect(mod).toMatch(/<h1[\s\S]*Collaboration[\s\S]*<\/h1>/);
    expect(mod).not.toContain('CollaborationTabs');
  });

  it('domain views still use canonical cards', () => {
    expect(read('app/(app)/assignments/assignments-view.tsx')).toContain(
      'AssignmentCard',
    );
    expect(read('app/(app)/tasks/tasks-view.tsx')).toContain('TaskCard');
    expect(read('app/(app)/people/people-view.tsx')).toContain('PersonCard');
  });
});

describe('BUILD-220C legacy redirects', () => {
  it('maps list routes to collaboration tabs', () => {
    expect(LEGACY_COLLABORATION_REDIRECTS['/assignments']).toBe(
      '/collaboration/assignments',
    );
    expect(LEGACY_COLLABORATION_REDIRECTS['/tasks']).toBe(
      '/collaboration/tasks',
    );
    expect(LEGACY_COLLABORATION_REDIRECTS['/notifications']).toBe(
      '/collaboration/inbox',
    );
    expect(LEGACY_COLLABORATION_REDIRECTS['/people']).toBe(
      '/collaboration/people',
    );
    expect(LEGACY_COLLABORATION_REDIRECTS['/work']).toBe(
      '/collaboration/assignments',
    );
    expect(LEGACY_COLLABORATION_REDIRECTS['/my-work']).toBe(
      '/collaboration/assignments',
    );
  });

  it('list page wrappers redirect', () => {
    expect(read('app/(app)/assignments/page.tsx')).toContain(
      'LegacyCollaborationRedirect',
    );
    expect(read('app/(app)/tasks/page.tsx')).toContain('/collaboration/tasks');
    expect(read('app/(app)/notifications/page.tsx')).toContain(
      'LegacyCollaborationRedirect',
    );
    expect(read('app/(app)/people/page.tsx')).toContain(
      'LegacyCollaborationRedirect',
    );
  });
});

describe('BUILD-220C sidebar', () => {
  it('admin sidebar has single Collaboration module link', () => {
    const layout = read('app/(app)/layout.tsx');
    expect(layout).toContain("label: 'Collaboration'");
    expect(layout).toContain("href: '/collaboration'");
    // Subsections removed from admin nav (module owns PageTabs)
    const adminBlockStart = layout.indexOf('const adminNavItems');
    const adminBlockEnd = layout.indexOf('const collaboratorNavSections');
    const admin = layout.slice(adminBlockStart, adminBlockEnd);
    expect(admin).not.toMatch(/label: 'Assignments'/);
    expect(admin).not.toMatch(/label: 'Tasks'/);
    expect(admin).not.toMatch(/label: 'Inbox'/);
    expect(admin).not.toMatch(/label: 'People'/);
  });
});

describe('BUILD-220C does not break Releases foundation', () => {
  it('RELEASE_PAGE_TABS still path-based', () => {
    expect(RELEASE_PAGE_TABS.map((t) => t.href)).toContain('/releases/draft');
  });
});
