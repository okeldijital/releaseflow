/**
 * BUILD-220C — Legacy list → canonical Collaboration path map.
 * Pure data (no React) for redirects and tests.
 */

export const LEGACY_COLLABORATION_REDIRECTS: Record<string, string> = {
  '/assignments': '/collaboration/assignments',
  '/tasks': '/collaboration/tasks',
  '/notifications': '/collaboration/inbox',
  '/people': '/collaboration/people',
  '/work': '/collaboration/assignments',
  '/my-work': '/collaboration/assignments',
};
