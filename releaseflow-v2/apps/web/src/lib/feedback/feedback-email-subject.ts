/**
 * BUILD-302C — Deterministic feedback email subject generation.
 *
 * Uses resolved FeedbackContext + optional human entity titles.
 * Never uses the user message. Never puts raw IDs in the subject.
 */

import type { FeedbackContext } from './feedback-types';

export interface FeedbackSubjectEntityTitles {
  releaseTitle?: string | null;
  trackTitle?: string | null;
  artistName?: string | null;
  taskTitle?: string | null;
  assignmentTitle?: string | null;
  assetName?: string | null;
  personName?: string | null;
}

const PREFIX = '[ReleaseFlow Feedback]';

function clean(value: string | null | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

/**
 * Build email subject from structured context and resolved titles.
 */
export function buildFeedbackEmailSubject(
  context: FeedbackContext,
  titles: FeedbackSubjectEntityTitles = {},
): string {
  const releaseTitle = clean(titles.releaseTitle);
  const trackTitle = clean(titles.trackTitle);
  const artistName = clean(titles.artistName);
  const taskTitle = clean(titles.taskTitle);
  const assignmentTitle = clean(titles.assignmentTitle);
  const assetName = clean(titles.assetName);
  const personName = clean(titles.personName);

  // Track (with or without release title)
  if (context.trackId || context.page === 'track') {
    if (releaseTitle && trackTitle) {
      return `${PREFIX} ${releaseTitle} — Track: ${trackTitle}`;
    }
    if (trackTitle) {
      return `${PREFIX} Track: ${trackTitle}`;
    }
    if (releaseTitle) {
      return `${PREFIX} ${releaseTitle} — Track`;
    }
    return `${PREFIX} Track`;
  }

  // Release
  if (context.releaseId || context.page === 'release' || context.page === 'release-edit' || context.page === 'release-readiness') {
    if (releaseTitle) return `${PREFIX} ${releaseTitle}`;
    return `${PREFIX} Release`;
  }

  // Artist
  if (context.artistId || context.page === 'artist') {
    if (artistName) return `${PREFIX} Artist: ${artistName}`;
    return `${PREFIX} Artist`;
  }

  // Task
  if (context.taskId || context.page === 'task') {
    if (taskTitle) return `${PREFIX} Task: ${taskTitle}`;
    return `${PREFIX} Task`;
  }

  // Assignment
  if (context.assignmentId || context.page === 'assignment') {
    if (assignmentTitle) return `${PREFIX} Assignment: ${assignmentTitle}`;
    return `${PREFIX} Assignment`;
  }

  // Person
  if (context.personId || context.page === 'person') {
    if (personName) return `${PREFIX} Person: ${personName}`;
    return `${PREFIX} Person`;
  }

  // Asset
  if (context.assetId || context.page === 'asset') {
    if (assetName) return `${PREFIX} Asset: ${assetName}`;
    return `${PREFIX} Asset`;
  }

  // Dashboard / home
  if (context.page === 'dashboard' || context.module === 'dashboard') {
    return `${PREFIX} Dashboard`;
  }
  if (context.page === 'home') {
    return `${PREFIX} Home`;
  }

  // Inbox-like
  if (context.module === 'inbox') {
    const page =
      context.page === 'inbox'
        ? 'Inbox'
        : context.page === 'comments'
          ? 'Comments'
          : context.page === 'notifications'
            ? 'Notifications'
            : context.page === 'my-work'
              ? 'My work'
              : 'Inbox';
    return `${PREFIX} ${page}`;
  }

  // Settings
  if (context.module === 'settings') {
    if (context.page === 'profile') return `${PREFIX} Profile`;
    if (context.page && context.page !== 'settings' && context.page !== 'administration') {
      const section = context.page
        .split(/[-_]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
      return `${PREFIX} Settings: ${section}`;
    }
    return `${PREFIX} Settings`;
  }

  // List pages etc.
  if (context.page === 'releases' || context.module === 'releases') {
    return `${PREFIX} Releases`;
  }
  if (context.page === 'tracks' || context.module === 'tracks') {
    return `${PREFIX} Tracks`;
  }
  if (context.page === 'artists' || context.module === 'artists') {
    return `${PREFIX} Artists`;
  }
  if (context.page === 'tasks' || context.module === 'tasks') {
    return `${PREFIX} Tasks`;
  }
  if (context.page === 'assignments' || context.module === 'assignments') {
    return `${PREFIX} Assignments`;
  }
  if (context.page === 'assets' || context.module === 'assets') {
    return `${PREFIX} Assets`;
  }

  // Generic human-readable page/module
  const label = (context.page || context.module || 'Application')
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
  return `${PREFIX} ${label}`;
}
