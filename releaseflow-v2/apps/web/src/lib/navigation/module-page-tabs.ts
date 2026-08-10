/**
 * BUILD-220A / BUILD-220B — Module PageTabs configurations.
 *
 * Releases tabs are wired in BUILD-220B. Other modules remain config-only
 * until subsequent migrations.
 *
 * Terminology (EPIC-220):
 * - Media Files → existing Assets domain (file/media assets)
 * - Library → structured catalogue metadata (Tracks + Artists)
 * - Media Files ≠ Library
 */

import type { PageTab } from '@releaseflow/ui';

/** Releases module tabs (path-based). */
export const RELEASE_PAGE_TABS: PageTab[] = [
  { id: 'all', label: 'All', href: '/releases' },
  { id: 'draft', label: 'Draft', href: '/releases/draft' },
  { id: 'active', label: 'Active', href: '/releases/active' },
  { id: 'archived', label: 'Archived', href: '/releases/archived' },
  { id: 'schedule', label: 'Schedule', href: '/releases/schedule' },
];

/**
 * Collaboration module — BUILD-220C canonical tabs.
 * Inbox reuses the existing notifications surface (not a new product).
 * Comments remains a separate collaborator surface (MUX-002), not a Collaboration tab.
 */
export const COLLABORATION_PAGE_TABS: PageTab[] = [
  { id: 'assignments', label: 'Assignments', href: '/collaboration/assignments' },
  { id: 'tasks', label: 'Tasks', href: '/collaboration/tasks' },
  { id: 'inbox', label: 'Inbox', href: '/collaboration/inbox' },
  { id: 'people', label: 'People', href: '/collaboration/people' },
];

/**
 * Media Files — BUILD-220E user-facing module for the Assets domain.
 * Single catalogue surface (no artificial tabs). Canonical UI route: /media-files.
 * Domain/repo/types remain Assets.
 */
export const MEDIA_FILES_PAGE_TABS: PageTab[] = [
  { id: 'all', label: 'All', href: '/media-files' },
];

/**
 * Library — BUILD-220D Tracks + Artists catalogue (metadata), not file storage.
 * Media Files / Assets remain a separate module.
 */
export const LIBRARY_PAGE_TABS: PageTab[] = [
  { id: 'tracks', label: 'Tracks', href: '/library/tracks' },
  { id: 'artists', label: 'Artists', href: '/library/artists' },
];

/**
 * Calendar — BUILD-220F top-level module.
 * Schedule / Deadlines / Releases are PageTabs (not sidebar items).
 * Distinct from Releases → Schedule (/releases/schedule).
 */
export const CALENDAR_PAGE_TABS: PageTab[] = [
  { id: 'schedule', label: 'Schedule', href: '/calendar/schedule' },
  { id: 'deadlines', label: 'Deadlines', href: '/calendar/deadlines' },
  { id: 'releases', label: 'Releases', href: '/calendar/releases' },
];

/**
 * Reports — future hub; administration reports exist under /administration/*.
 * Config only; not mounted in BUILD-220A.
 */
export const REPORTS_PAGE_TABS: PageTab[] = [
  { id: 'reports', label: 'Reports', href: '/administration/reports' },
  { id: 'analytics', label: 'Analytics', href: '/administration/analytics' },
];

/**
 * Settings tabs — Storage lives under Settings (not a top-level sidebar item).
 * Path contract for future migration; routes not created/rewired in BUILD-220A.
 * Existing administration pages remain the live settings surfaces until migrated.
 */
export const SETTINGS_PAGE_TABS: PageTab[] = [
  { id: 'organization', label: 'Organization', href: '/settings/organization' },
  { id: 'users', label: 'Users', href: '/settings/users' },
  { id: 'permissions', label: 'Permissions', href: '/settings/permissions' },
  { id: 'storage', label: 'Storage', href: '/settings/storage' },
  { id: 'integrations', label: 'Integrations', href: '/settings/integrations' },
];

/** All foundation module tab maps keyed by module id (for discovery/tests). */
export const MODULE_PAGE_TABS = {
  releases: RELEASE_PAGE_TABS,
  collaboration: COLLABORATION_PAGE_TABS,
  'media-files': MEDIA_FILES_PAGE_TABS,
  library: LIBRARY_PAGE_TABS,
  calendar: CALENDAR_PAGE_TABS,
  reports: REPORTS_PAGE_TABS,
  settings: SETTINGS_PAGE_TABS,
} as const;

export type ModulePageTabKey = keyof typeof MODULE_PAGE_TABS;
