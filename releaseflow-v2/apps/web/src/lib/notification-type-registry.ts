/**
 * CE-006 — Notification type registry.
 *
 * Future types extend this registry. UI and processor resolve labels/icons
 * via lookup — no hardcoded switch statements for presentation.
 */

export type NotificationRegistryKey =
  | 'assignment.assigned'
  | 'assignment.accepted'
  | 'assignment.started'
  | 'comment.created'
  | 'comment.reply'
  | 'comment.mentioned'
  | 'review.requested'
  | 'review.approved'
  | 'review.rejected'
  | 'review.changes_requested'
  | 'watcher.added'
  | 'watcher.removed'
  | 'assignment.due_soon'
  | 'assignment.overdue'
  | 'invitation.accepted'
  | 'invitation.revoked'
  | 'assignment.rescheduled'
  | 'assignment.conflict'
  | 'assignment.due_today'
  | 'assignment.due_tomorrow'
  | 'release.ready'
  | 'release.not_ready'
  | 'release.readiness_changed'
  | 'release.blocker_added';

/** Preference toggle keys (user-configurable). */
export type PreferenceKey =
  | 'assignmentAssigned'
  | 'commentMention'
  | 'commentReply'
  | 'reviewRequested'
  | 'reviewOutcome'
  | 'dueReminder'
  | 'overdueReminder'
  | 'invitationAccepted'
  | 'invitationRevoked';

export interface NotificationTypeDefinition {
  key: NotificationRegistryKey;
  /** User-facing title template; `{actor}` and `{entity}` may be interpolated. */
  title: string;
  /** Default message template. */
  message: string;
  /** Preference gate; if falsey prefs skip channel. */
  preferenceKey: PreferenceKey;
  /** Lucide-style path or icon token for UI. */
  icon: 'assignment' | 'comment' | 'mention' | 'review' | 'watcher' | 'due' | 'invitation' | 'system';
  /** Email template id for future worker. */
  emailTemplate: string;
  deepLink: (entityType: string, entityId: string) => string;
}

function assignmentLink(_entityType: string, entityId: string): string {
  return `/assignments/${entityId}`;
}

function peopleLink(_entityType: string, entityId: string): string {
  return `/people/${entityId}`;
}

function genericLink(entityType: string, entityId: string): string {
  if (entityType === 'assignment' || entityType === 'task') return `/assignments/${entityId}`;
  if (entityType === 'release') return `/releases/${entityId}`;
  if (entityType === 'person') return `/people/${entityId}`;
  if (entityType === 'track') return `/tracks/${entityId}`;
  return `/${entityType}s/${entityId}`;
}

export const NOTIFICATION_TYPE_REGISTRY: Record<NotificationRegistryKey, NotificationTypeDefinition> = {
  'assignment.assigned': {
    key: 'assignment.assigned',
    title: 'Assignment Assigned',
    message: '{actor} assigned you: {entity}',
    preferenceKey: 'assignmentAssigned',
    icon: 'assignment',
    emailTemplate: 'assignment_assigned',
    deepLink: assignmentLink,
  },
  'assignment.accepted': {
    key: 'assignment.accepted',
    title: 'Assignment Accepted',
    message: '{actor} accepted the assignment',
    preferenceKey: 'assignmentAssigned',
    icon: 'assignment',
    emailTemplate: 'assignment_accepted',
    deepLink: assignmentLink,
  },
  'assignment.started': {
    key: 'assignment.started',
    title: 'Assignment Started',
    message: '{actor} started working on the assignment',
    preferenceKey: 'assignmentAssigned',
    icon: 'assignment',
    emailTemplate: 'assignment_started',
    deepLink: assignmentLink,
  },
  'comment.created': {
    key: 'comment.created',
    title: 'Comment Added',
    message: '{actor} commented on an assignment',
    preferenceKey: 'commentReply',
    icon: 'comment',
    emailTemplate: 'comment_created',
    deepLink: assignmentLink,
  },
  'comment.reply': {
    key: 'comment.reply',
    title: 'Comment Reply',
    message: '{actor} replied to a comment',
    preferenceKey: 'commentReply',
    icon: 'comment',
    emailTemplate: 'comment_reply',
    deepLink: assignmentLink,
  },
  'comment.mentioned': {
    key: 'comment.mentioned',
    title: 'Mention',
    message: '{actor} mentioned you',
    preferenceKey: 'commentMention',
    icon: 'mention',
    emailTemplate: 'comment_mentioned',
    deepLink: assignmentLink,
  },
  'review.requested': {
    key: 'review.requested',
    title: 'Review Requested',
    message: '{actor} submitted work for review',
    preferenceKey: 'reviewRequested',
    icon: 'review',
    emailTemplate: 'review_requested',
    deepLink: assignmentLink,
  },
  'review.approved': {
    key: 'review.approved',
    title: 'Review Approved',
    message: '{actor} approved this assignment',
    preferenceKey: 'reviewOutcome',
    icon: 'review',
    emailTemplate: 'review_approved',
    deepLink: assignmentLink,
  },
  'review.rejected': {
    key: 'review.rejected',
    title: 'Review Rejected',
    message: '{actor} rejected this assignment',
    preferenceKey: 'reviewOutcome',
    icon: 'review',
    emailTemplate: 'review_rejected',
    deepLink: assignmentLink,
  },
  'review.changes_requested': {
    key: 'review.changes_requested',
    title: 'Changes Requested',
    message: '{actor} requested changes',
    preferenceKey: 'reviewOutcome',
    icon: 'review',
    emailTemplate: 'review_changes_requested',
    deepLink: assignmentLink,
  },
  'watcher.added': {
    key: 'watcher.added',
    title: 'Started Watching',
    message: '{actor} is watching this assignment',
    preferenceKey: 'assignmentAssigned',
    icon: 'watcher',
    emailTemplate: 'watcher_added',
    deepLink: assignmentLink,
  },
  'watcher.removed': {
    key: 'watcher.removed',
    title: 'Stopped Watching',
    message: '{actor} stopped watching this assignment',
    preferenceKey: 'assignmentAssigned',
    icon: 'watcher',
    emailTemplate: 'watcher_removed',
    deepLink: assignmentLink,
  },
  'assignment.due_soon': {
    key: 'assignment.due_soon',
    title: 'Assignment Due Soon',
    message: 'Assignment is due soon: {entity}',
    preferenceKey: 'dueReminder',
    icon: 'due',
    emailTemplate: 'assignment_due_soon',
    deepLink: assignmentLink,
  },
  'assignment.overdue': {
    key: 'assignment.overdue',
    title: 'Assignment Overdue',
    message: 'Assignment is overdue: {entity}',
    preferenceKey: 'overdueReminder',
    icon: 'due',
    emailTemplate: 'assignment_overdue',
    deepLink: assignmentLink,
  },
  'invitation.accepted': {
    key: 'invitation.accepted',
    title: 'Invitation Accepted',
    message: '{actor} accepted an invitation',
    preferenceKey: 'invitationAccepted',
    icon: 'invitation',
    emailTemplate: 'invitation_accepted',
    deepLink: peopleLink,
  },
  'invitation.revoked': {
    key: 'invitation.revoked',
    title: 'Invitation Revoked',
    message: 'An invitation was revoked',
    preferenceKey: 'invitationRevoked',
    icon: 'invitation',
    emailTemplate: 'invitation_revoked',
    deepLink: genericLink,
  },
  'assignment.rescheduled': {
    key: 'assignment.rescheduled',
    title: 'Assignment Rescheduled',
    message: '{actor} changed the due date for {entity}',
    preferenceKey: 'assignmentAssigned',
    icon: 'due',
    emailTemplate: 'assignment_rescheduled',
    deepLink: assignmentLink,
  },
  'assignment.conflict': {
    key: 'assignment.conflict',
    title: 'Schedule Conflict',
    message: 'Scheduling conflict detected on {entity}',
    preferenceKey: 'assignmentAssigned',
    icon: 'due',
    emailTemplate: 'assignment_conflict',
    deepLink: assignmentLink,
  },
  'assignment.due_today': {
    key: 'assignment.due_today',
    title: 'Due Today',
    message: 'Assignment due today: {entity}',
    preferenceKey: 'dueReminder',
    icon: 'due',
    emailTemplate: 'assignment_due_today',
    deepLink: assignmentLink,
  },
  'assignment.due_tomorrow': {
    key: 'assignment.due_tomorrow',
    title: 'Due Tomorrow',
    message: 'Assignment due tomorrow: {entity}',
    preferenceKey: 'dueReminder',
    icon: 'due',
    emailTemplate: 'assignment_due_tomorrow',
    deepLink: assignmentLink,
  },
  'release.ready': {
    key: 'release.ready',
    title: 'Release Ready',
    message: 'Release is ready: {entity}',
    preferenceKey: 'assignmentAssigned',
    icon: 'review',
    emailTemplate: 'release_ready',
    deepLink: genericLink,
  },
  'release.not_ready': {
    key: 'release.not_ready',
    title: 'Release Not Ready',
    message: 'Release needs attention: {entity}',
    preferenceKey: 'assignmentAssigned',
    icon: 'review',
    emailTemplate: 'release_not_ready',
    deepLink: genericLink,
  },
  'release.readiness_changed': {
    key: 'release.readiness_changed',
    title: 'Readiness Changed',
    message: 'Release readiness updated: {entity}',
    preferenceKey: 'assignmentAssigned',
    icon: 'system',
    emailTemplate: 'release_readiness_changed',
    deepLink: genericLink,
  },
  'release.blocker_added': {
    key: 'release.blocker_added',
    title: 'Release Blocker',
    message: 'A blocker was added on {entity}',
    preferenceKey: 'assignmentAssigned',
    icon: 'system',
    emailTemplate: 'release_blocker_added',
    deepLink: genericLink,
  },
};

export function getNotificationTypeDefinition(
  type: string,
): NotificationTypeDefinition | null {
  if (type in NOTIFICATION_TYPE_REGISTRY) {
    return NOTIFICATION_TYPE_REGISTRY[type as NotificationRegistryKey];
  }
  return null;
}

export function interpolateTemplate(
  template: string,
  vars: { actor?: string; entity?: string },
): string {
  return template
    .replace(/\{actor\}/g, vars.actor ?? 'Someone')
    .replace(/\{entity\}/g, vars.entity ?? 'item');
}

export function resolveDeepLink(
  type: string,
  entityType: string,
  entityId: string,
): string {
  const def = getNotificationTypeDefinition(type);
  if (def) return def.deepLink(entityType, entityId);
  return genericLink(entityType, entityId);
}

export const PREFERENCE_LABELS: Record<PreferenceKey, string> = {
  assignmentAssigned: 'Assignment updates',
  commentMention: 'Mentions',
  commentReply: 'Comments & replies',
  reviewRequested: 'Review requests',
  reviewOutcome: 'Review outcomes',
  dueReminder: 'Due soon reminders',
  overdueReminder: 'Overdue reminders',
  invitationAccepted: 'Invitation accepted',
  invitationRevoked: 'Invitation revoked',
};

export const DEFAULT_PREFERENCE_FLAGS: Record<PreferenceKey, boolean> = {
  assignmentAssigned: true,
  commentMention: true,
  commentReply: true,
  reviewRequested: true,
  reviewOutcome: true,
  dueReminder: true,
  overdueReminder: true,
  invitationAccepted: true,
  invitationRevoked: true,
};
