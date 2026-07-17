/**
 * NOT-001 / CE-006 — Notification type registry.
 *
 * Future types extend this registry. UI and processor resolve labels/icons
 * via lookup — no hardcoded switch statements for presentation.
 *
 * Notifications are derived from domain events. Pages never author them.
 */

/** Inbox filter categories (Notification Center). */
export type NotificationCategory =
  | 'assignment'
  | 'release'
  | 'comment'
  | 'review'
  | 'schedule'
  | 'system';

export type NotificationRegistryKey =
  | 'assignment.assigned'
  | 'assignment.accepted'
  | 'assignment.started'
  | 'assignment.completed'
  | 'assignment.reassigned'
  | 'assignment.archived'
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
  | 'release.created'
  | 'release.date_changed'
  | 'release.approved'
  | 'release.published'
  | 'release.delayed'
  | 'release.ready'
  | 'release.not_ready'
  | 'release.readiness_changed'
  | 'release.blocker_added';

/**
 * Preference toggle keys (user-configurable).
 * NOT-001: per-category gates; channel master switches live on preferences record.
 */
export type PreferenceKey =
  | 'assignmentAssigned'
  | 'assignmentLifecycle'
  | 'commentMention'
  | 'commentReply'
  | 'reviewRequested'
  | 'reviewOutcome'
  | 'dueReminder'
  | 'overdueReminder'
  | 'invitationAccepted'
  | 'invitationRevoked'
  | 'releaseUpdates';

/**
 * Who should receive this event (before excluding actor).
 * Processor expands roles against the assignment / event metadata.
 */
export type RecipientRole =
  | 'assignee'
  | 'assigner'
  | 'watchers'
  | 'old_assignee'
  | 'new_assignee'
  | 'explicit'
  | 'entity_followers';

export interface NotificationTypeDefinition {
  key: NotificationRegistryKey;
  /** User-facing title template; `{actor}` and `{entity}` may be interpolated. */
  title: string;
  /** Default message template. */
  message: string;
  /** Preference gate; if falsey prefs skip channel. */
  preferenceKey: PreferenceKey;
  /** Inbox filter category. */
  category: NotificationCategory;
  /** Lucide-style path or icon token for UI. */
  icon: 'assignment' | 'comment' | 'mention' | 'review' | 'watcher' | 'due' | 'invitation' | 'system' | 'release';
  /** Email template id for worker. */
  emailTemplate: string;
  /**
   * When true, email may be enqueued if user enabled email for this type.
   * When false, email is skipped even if channel master is on (noise control).
   */
  emailImportant: boolean;
  /** Push is eligible when user enabled push (FCM worker). */
  pushEligible: boolean;
  /** Recipient roles for fan-out (NOT-001 matrix). */
  recipients: RecipientRole[];
  deepLink: (entityType: string, entityId: string, metadata?: Record<string, unknown> | null) => string;
}

function assignmentLink(_entityType: string, entityId: string): string {
  return `/assignments/${entityId}`;
}

function assignmentCommentsLink(_entityType: string, entityId: string): string {
  return `/assignments/${entityId}?tab=comments`;
}

function assignmentReviewLink(_entityType: string, entityId: string): string {
  return `/assignments/${entityId}?tab=review`;
}

function releaseLink(_entityType: string, entityId: string): string {
  return `/releases/${entityId}`;
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
    title: 'New Assignment',
    message: '{actor} assigned you: {entity}',
    preferenceKey: 'assignmentAssigned',
    category: 'assignment',
    icon: 'assignment',
    emailTemplate: 'assignment_assigned',
    emailImportant: true,
    pushEligible: true,
    recipients: ['assignee', 'explicit'],
    deepLink: assignmentLink,
  },
  'assignment.accepted': {
    key: 'assignment.accepted',
    title: 'Assignment Accepted',
    message: '{actor} accepted: {entity}',
    preferenceKey: 'assignmentLifecycle',
    category: 'assignment',
    icon: 'assignment',
    emailTemplate: 'assignment_accepted',
    emailImportant: false,
    pushEligible: true,
    recipients: ['assigner', 'watchers'],
    deepLink: assignmentLink,
  },
  'assignment.started': {
    key: 'assignment.started',
    title: 'Assignment Started',
    message: '{actor} started: {entity}',
    preferenceKey: 'assignmentLifecycle',
    category: 'assignment',
    icon: 'assignment',
    emailTemplate: 'assignment_started',
    emailImportant: false,
    pushEligible: true,
    recipients: ['assigner', 'watchers'],
    deepLink: assignmentLink,
  },
  'assignment.completed': {
    key: 'assignment.completed',
    title: 'Assignment Completed',
    message: '{actor} completed: {entity}',
    preferenceKey: 'assignmentLifecycle',
    category: 'assignment',
    icon: 'assignment',
    emailTemplate: 'assignment_completed',
    emailImportant: true,
    pushEligible: true,
    recipients: ['assigner', 'watchers'],
    deepLink: assignmentLink,
  },
  'assignment.reassigned': {
    key: 'assignment.reassigned',
    title: 'Assignment Reassigned',
    message: '{actor} reassigned: {entity}',
    preferenceKey: 'assignmentAssigned',
    category: 'assignment',
    icon: 'assignment',
    emailTemplate: 'assignment_reassigned',
    emailImportant: true,
    pushEligible: true,
    recipients: ['old_assignee', 'new_assignee', 'assigner'],
    deepLink: assignmentLink,
  },
  'assignment.archived': {
    key: 'assignment.archived',
    title: 'Assignment Archived',
    message: '{entity} was archived',
    preferenceKey: 'assignmentLifecycle',
    category: 'assignment',
    icon: 'assignment',
    emailTemplate: 'assignment_archived',
    emailImportant: false,
    pushEligible: false,
    recipients: ['watchers'],
    deepLink: assignmentLink,
  },
  'comment.created': {
    key: 'comment.created',
    title: 'New Comment',
    message: '{actor} commented on {entity}',
    preferenceKey: 'commentReply',
    category: 'comment',
    icon: 'comment',
    emailTemplate: 'comment_created',
    emailImportant: false,
    pushEligible: true,
    recipients: ['assignee', 'assigner', 'watchers'],
    deepLink: assignmentCommentsLink,
  },
  'comment.reply': {
    key: 'comment.reply',
    title: 'Comment Reply',
    message: '{actor} replied on {entity}',
    preferenceKey: 'commentReply',
    category: 'comment',
    icon: 'comment',
    emailTemplate: 'comment_reply',
    emailImportant: false,
    pushEligible: true,
    recipients: ['assignee', 'assigner', 'watchers'],
    deepLink: assignmentCommentsLink,
  },
  'comment.mentioned': {
    key: 'comment.mentioned',
    title: 'Mention',
    message: '{actor} mentioned you on {entity}',
    preferenceKey: 'commentMention',
    category: 'comment',
    icon: 'mention',
    emailTemplate: 'comment_mentioned',
    emailImportant: true,
    pushEligible: true,
    recipients: ['explicit'],
    deepLink: assignmentCommentsLink,
  },
  'review.requested': {
    key: 'review.requested',
    title: 'Review Requested',
    message: '{actor} submitted {entity} for review',
    preferenceKey: 'reviewRequested',
    category: 'review',
    icon: 'review',
    emailTemplate: 'review_requested',
    emailImportant: true,
    pushEligible: true,
    recipients: ['assigner', 'watchers'],
    deepLink: assignmentReviewLink,
  },
  'review.approved': {
    key: 'review.approved',
    title: 'Review Approved',
    message: '{actor} approved {entity}',
    preferenceKey: 'reviewOutcome',
    category: 'review',
    icon: 'review',
    emailTemplate: 'review_approved',
    emailImportant: true,
    pushEligible: true,
    recipients: ['assignee', 'watchers'],
    deepLink: assignmentLink,
  },
  'review.rejected': {
    key: 'review.rejected',
    title: 'Review Rejected',
    message: '{actor} rejected {entity}',
    preferenceKey: 'reviewOutcome',
    category: 'review',
    icon: 'review',
    emailTemplate: 'review_rejected',
    emailImportant: true,
    pushEligible: true,
    recipients: ['assignee', 'watchers'],
    deepLink: assignmentReviewLink,
  },
  'review.changes_requested': {
    key: 'review.changes_requested',
    title: 'Changes Requested',
    message: '{actor} requested changes on {entity}',
    preferenceKey: 'reviewOutcome',
    category: 'review',
    icon: 'review',
    emailTemplate: 'review_changes_requested',
    emailImportant: true,
    pushEligible: true,
    recipients: ['assignee', 'watchers'],
    deepLink: assignmentReviewLink,
  },
  'watcher.added': {
    key: 'watcher.added',
    title: 'Started Watching',
    message: '{actor} is watching {entity}',
    preferenceKey: 'assignmentLifecycle',
    category: 'assignment',
    icon: 'watcher',
    emailTemplate: 'watcher_added',
    emailImportant: false,
    pushEligible: false,
    recipients: ['explicit'],
    deepLink: assignmentLink,
  },
  'watcher.removed': {
    key: 'watcher.removed',
    title: 'Stopped Watching',
    message: '{actor} stopped watching {entity}',
    preferenceKey: 'assignmentLifecycle',
    category: 'assignment',
    icon: 'watcher',
    emailTemplate: 'watcher_removed',
    emailImportant: false,
    pushEligible: false,
    recipients: ['explicit'],
    deepLink: assignmentLink,
  },
  'assignment.due_soon': {
    key: 'assignment.due_soon',
    title: 'Assignment Due Soon',
    message: 'Due soon: {entity}',
    preferenceKey: 'dueReminder',
    category: 'schedule',
    icon: 'due',
    emailTemplate: 'assignment_due_soon',
    emailImportant: false,
    pushEligible: true,
    recipients: ['assignee', 'explicit'],
    deepLink: assignmentLink,
  },
  'assignment.overdue': {
    key: 'assignment.overdue',
    title: 'Assignment Overdue',
    message: 'Overdue: {entity}',
    preferenceKey: 'overdueReminder',
    category: 'schedule',
    icon: 'due',
    emailTemplate: 'assignment_overdue',
    emailImportant: true,
    pushEligible: true,
    recipients: ['assignee', 'explicit'],
    deepLink: assignmentLink,
  },
  'invitation.accepted': {
    key: 'invitation.accepted',
    title: 'Invitation Accepted',
    message: '{actor} accepted an invitation',
    preferenceKey: 'invitationAccepted',
    category: 'system',
    icon: 'invitation',
    emailTemplate: 'invitation_accepted',
    emailImportant: true,
    pushEligible: false,
    recipients: ['explicit'],
    deepLink: peopleLink,
  },
  'invitation.revoked': {
    key: 'invitation.revoked',
    title: 'Invitation Revoked',
    message: 'An invitation was revoked',
    preferenceKey: 'invitationRevoked',
    category: 'system',
    icon: 'invitation',
    emailTemplate: 'invitation_revoked',
    emailImportant: false,
    pushEligible: false,
    recipients: ['explicit'],
    deepLink: genericLink,
  },
  'assignment.rescheduled': {
    key: 'assignment.rescheduled',
    title: 'Assignment Rescheduled',
    message: '{actor} changed the due date for {entity}',
    preferenceKey: 'assignmentLifecycle',
    category: 'schedule',
    icon: 'due',
    emailTemplate: 'assignment_rescheduled',
    emailImportant: false,
    pushEligible: true,
    recipients: ['assignee', 'watchers'],
    deepLink: assignmentLink,
  },
  'assignment.conflict': {
    key: 'assignment.conflict',
    title: 'Schedule Conflict',
    message: 'Scheduling conflict on {entity}',
    preferenceKey: 'assignmentLifecycle',
    category: 'schedule',
    icon: 'due',
    emailTemplate: 'assignment_conflict',
    emailImportant: false,
    pushEligible: true,
    recipients: ['assignee', 'assigner'],
    deepLink: assignmentLink,
  },
  'assignment.due_today': {
    key: 'assignment.due_today',
    title: 'Due Today',
    message: 'Due today: {entity}',
    preferenceKey: 'dueReminder',
    category: 'schedule',
    icon: 'due',
    emailTemplate: 'assignment_due_today',
    emailImportant: false,
    pushEligible: true,
    recipients: ['assignee', 'explicit'],
    deepLink: assignmentLink,
  },
  'assignment.due_tomorrow': {
    key: 'assignment.due_tomorrow',
    title: 'Due Tomorrow',
    message: 'Due tomorrow: {entity}',
    preferenceKey: 'dueReminder',
    category: 'schedule',
    icon: 'due',
    emailTemplate: 'assignment_due_tomorrow',
    emailImportant: false,
    pushEligible: true,
    recipients: ['assignee', 'explicit'],
    deepLink: assignmentLink,
  },
  'release.created': {
    key: 'release.created',
    title: 'Release Created',
    message: '{actor} created release: {entity}',
    preferenceKey: 'releaseUpdates',
    category: 'release',
    icon: 'release',
    emailTemplate: 'release_created',
    emailImportant: false,
    pushEligible: true,
    recipients: ['entity_followers', 'explicit'],
    deepLink: releaseLink,
  },
  'release.date_changed': {
    key: 'release.date_changed',
    title: 'Release Date Changed',
    message: '{actor} changed the date for {entity}',
    preferenceKey: 'releaseUpdates',
    category: 'release',
    icon: 'release',
    emailTemplate: 'release_date_changed',
    emailImportant: true,
    pushEligible: true,
    recipients: ['entity_followers', 'explicit'],
    deepLink: releaseLink,
  },
  'release.approved': {
    key: 'release.approved',
    title: 'Release Approved',
    message: '{entity} was approved',
    preferenceKey: 'releaseUpdates',
    category: 'release',
    icon: 'release',
    emailTemplate: 'release_approved',
    emailImportant: true,
    pushEligible: true,
    recipients: ['entity_followers', 'explicit'],
    deepLink: releaseLink,
  },
  'release.published': {
    key: 'release.published',
    title: 'Release Published',
    message: '{entity} was published',
    preferenceKey: 'releaseUpdates',
    category: 'release',
    icon: 'release',
    emailTemplate: 'release_published',
    emailImportant: true,
    pushEligible: true,
    recipients: ['entity_followers', 'explicit'],
    deepLink: releaseLink,
  },
  'release.delayed': {
    key: 'release.delayed',
    title: 'Release Delayed',
    message: '{entity} was delayed',
    preferenceKey: 'releaseUpdates',
    category: 'release',
    icon: 'release',
    emailTemplate: 'release_delayed',
    emailImportant: true,
    pushEligible: true,
    recipients: ['entity_followers', 'explicit'],
    deepLink: releaseLink,
  },
  'release.ready': {
    key: 'release.ready',
    title: 'Release Ready',
    message: 'Release is ready: {entity}',
    preferenceKey: 'releaseUpdates',
    category: 'release',
    icon: 'review',
    emailTemplate: 'release_ready',
    emailImportant: true,
    pushEligible: true,
    recipients: ['entity_followers', 'explicit'],
    deepLink: releaseLink,
  },
  'release.not_ready': {
    key: 'release.not_ready',
    title: 'Release Not Ready',
    message: 'Release needs attention: {entity}',
    preferenceKey: 'releaseUpdates',
    category: 'release',
    icon: 'review',
    emailTemplate: 'release_not_ready',
    emailImportant: false,
    pushEligible: true,
    recipients: ['entity_followers', 'explicit'],
    deepLink: releaseLink,
  },
  'release.readiness_changed': {
    key: 'release.readiness_changed',
    title: 'Readiness Changed',
    message: 'Release readiness updated: {entity}',
    preferenceKey: 'releaseUpdates',
    category: 'release',
    icon: 'system',
    emailTemplate: 'release_readiness_changed',
    emailImportant: false,
    pushEligible: false,
    recipients: ['entity_followers', 'explicit'],
    deepLink: releaseLink,
  },
  'release.blocker_added': {
    key: 'release.blocker_added',
    title: 'Release Blocker',
    message: 'A blocker was added on {entity}',
    preferenceKey: 'releaseUpdates',
    category: 'release',
    icon: 'system',
    emailTemplate: 'release_blocker_added',
    emailImportant: true,
    pushEligible: true,
    recipients: ['entity_followers', 'explicit'],
    deepLink: releaseLink,
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

export function getNotificationCategory(type: string): NotificationCategory {
  return getNotificationTypeDefinition(type)?.category ?? 'system';
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
  metadata?: Record<string, unknown> | null,
): string {
  const def = getNotificationTypeDefinition(type);
  if (def) return def.deepLink(entityType, entityId, metadata);
  return genericLink(entityType, entityId);
}

export const PREFERENCE_LABELS: Record<PreferenceKey, string> = {
  assignmentAssigned: 'New assignments & reassignments',
  assignmentLifecycle: 'Assignment status updates',
  commentMention: 'Mentions',
  commentReply: 'Comments & replies',
  reviewRequested: 'Review requests',
  reviewOutcome: 'Review outcomes',
  dueReminder: 'Due soon reminders',
  overdueReminder: 'Overdue reminders',
  invitationAccepted: 'Invitation accepted',
  invitationRevoked: 'Invitation revoked',
  releaseUpdates: 'Release updates',
};

export const DEFAULT_PREFERENCE_FLAGS: Record<PreferenceKey, boolean> = {
  assignmentAssigned: true,
  assignmentLifecycle: true,
  commentMention: true,
  commentReply: true,
  reviewRequested: true,
  reviewOutcome: true,
  dueReminder: true,
  overdueReminder: true,
  invitationAccepted: true,
  invitationRevoked: true,
  releaseUpdates: true,
};

/** Category chips for Notification Center filters. */
export const INBOX_FILTERS: { id: 'all' | NotificationCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'assignment', label: 'Assignments' },
  { id: 'release', label: 'Releases' },
  { id: 'comment', label: 'Comments' },
  { id: 'review', label: 'Reviews' },
  { id: 'schedule', label: 'Schedule' },
];
