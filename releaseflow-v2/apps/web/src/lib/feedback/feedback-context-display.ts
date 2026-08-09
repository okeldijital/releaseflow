/**
 * BUILD-302B — Human-readable context indicator for the feedback panel.
 *
 * Visual only. Context itself always comes from resolveFeedbackContext (302A).
 * No secondary detection; no entity title fetching.
 */

import type { FeedbackContext } from './feedback-types';

export interface FeedbackContextDisplay {
  /** Fixed section label from EPIC: "Feedback about" */
  label: string;
  /** One or more non-editable context lines shown under the label. */
  lines: string[];
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  home: 'Home',
  releases: 'Releases',
  release: 'Release',
  'release-new': 'New release',
  'release-edit': 'Edit release',
  'release-readiness': 'Release readiness',
  tracks: 'Tracks',
  track: 'Track',
  'track-new': 'New track',
  artists: 'Artists',
  artist: 'Artist',
  'artist-new': 'New artist',
  assignments: 'Assignments',
  assignment: 'Assignment',
  'assignment-new': 'New assignment',
  tasks: 'Tasks',
  task: 'Task',
  'task-new': 'New task',
  people: 'People',
  person: 'Person',
  'person-new': 'New person',
  invitations: 'Invitations',
  'person-releases': 'Person releases',
  assets: 'Assets',
  asset: 'Asset',
  inbox: 'Inbox',
  comments: 'Comments',
  notifications: 'Notifications',
  'my-work': 'My work',
  work: 'Work',
  profile: 'Profile',
  settings: 'Settings',
  administration: 'Administration',
  members: 'Members',
  organization: 'Organization',
  security: 'Security',
  reports: 'Reports',
  analytics: 'Analytics',
  campaigns: 'Campaigns',
  campaign: 'Campaign',
  'campaign-new': 'New campaign',
};

function titleCaseSegment(value: string): string {
  if (!value) return value;
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Build non-editable context lines for the feedback panel from FeedbackContext.
 */
export function formatFeedbackContextDisplay(
  context: FeedbackContext,
): FeedbackContextDisplay {
  const lines: string[] = [];

  if (context.releaseId) {
    lines.push(`Release: ${context.releaseId}`);
  }
  if (context.trackId) {
    lines.push(`Track: ${context.trackId}`);
  }
  if (context.artistId) {
    lines.push(`Artist: ${context.artistId}`);
  }
  if (context.assignmentId) {
    lines.push(`Assignment: ${context.assignmentId}`);
  }
  if (context.taskId) {
    lines.push(`Task: ${context.taskId}`);
  }
  if (context.personId) {
    lines.push(`Person: ${context.personId}`);
  }
  if (context.assetId) {
    lines.push(`Asset: ${context.assetId}`);
  }

  if (lines.length === 0) {
    // Settings sections (e.g. /administration/members) prefer the section page label.
    if (
      context.module === 'settings'
      && context.page
      && context.page !== 'settings'
      && context.page !== 'administration'
    ) {
      lines.push(PAGE_LABELS[context.page] || titleCaseSegment(context.page));
    } else {
      const pageLabel =
        PAGE_LABELS[context.page]
        || PAGE_LABELS[context.module]
        || titleCaseSegment(context.page || context.module || 'Application');
      lines.push(pageLabel);
    }
  }

  return {
    label: 'Feedback about',
    lines,
  };
}
