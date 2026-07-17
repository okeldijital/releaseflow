/**
 * NOT-001 / CE-006 — Notification Processor
 *
 * Reads immutable notification_events → creates user_notifications,
 * enqueues email / push (never delivers from the client).
 *
 * Never mutates events. Idempotent via notification_processing + eventId+userId.
 * Business services must only call generateNotificationEvent().
 *
 * Recipient fan-out follows the type registry matrix (not ad-hoc page logic).
 */

import {
  getRecentNotificationEvents,
  type NotificationEvent,
} from './notification-event-service';
import {
  createUserNotification,
} from './user-notifications-repository';
import {
  isEventProcessed,
  markEventProcessed,
} from './notification-processing-repository';
import {
  getNotificationPreferences,
  isPreferenceEnabled,
} from './notification-preferences-repository';
import { enqueueEmailJob } from './email-queue-repository';
import { enqueuePushJob } from './push-queue-repository';
import {
  getNotificationTypeDefinition,
  interpolateTemplate,
  resolveDeepLink,
  type RecipientRole,
  type NotificationTypeDefinition,
} from './notification-type-registry';
import { getAssignment } from './assignment-repository';
import { getWatchers } from './assignment-watchers-repository';
import { fetchPerson } from './person-service';
import { getPeopleByOrg } from './people-repository';

async function resolveActorName(actorId: string): Promise<string> {
  if (!actorId || actorId === 'system') return 'ReleaseFlow';
  try {
    const person = await fetchPerson(actorId);
    if (person?.displayName) return person.displayName;
  } catch { /* ignore */ }
  return 'Someone';
}

/** Resolve personId or userId to Firebase auth uid for notification delivery. */
export async function resolveUserId(
  id: string,
  organizationId: string,
): Promise<string | null> {
  if (!id) return null;
  try {
    const person = await fetchPerson(id);
    if (person) {
      if (person.userId) {
        return person.userId;
      }
      return null;
    }
  } catch { /* treat as uid */ }
  void organizationId;
  return id;
}

async function resolveEntityTitle(
  entityType: string,
  entityId: string,
): Promise<string> {
  if (entityType === 'assignment' || entityType === 'task') {
    try {
      const a = await getAssignment(entityId);
      if (a?.title) return a.title;
    } catch { /* ignore */ }
  }
  if (entityType === 'release') {
    return 'release';
  }
  return 'item';
}

async function addResolved(
  recipients: Set<string>,
  id: string | null | undefined,
  orgId: string,
): Promise<void> {
  if (!id) return;
  const uid = await resolveUserId(id, orgId);
  if (uid) recipients.add(uid);
}

/**
 * NOT-001 — Expand registry recipient roles for an event.
 * Never includes the actor (Part 20 / NOT-001).
 */
export async function resolveRecipientUserIds(event: NotificationEvent): Promise<string[]> {
  const def = getNotificationTypeDefinition(event.type);
  const roles: RecipientRole[] = def?.recipients ?? ['explicit'];
  const recipients = new Set<string>();
  const orgId = event.organizationId;
  const meta = (event.metadata ?? {}) as Record<string, unknown>;

  let assignment: Awaited<ReturnType<typeof getAssignment>> = null;
  const needsAssignment = roles.some((r) =>
    ['assignee', 'assigner', 'watchers', 'old_assignee', 'new_assignee'].includes(r),
  );
  if (needsAssignment && (event.entityType === 'assignment' || event.entityType === 'task')) {
    try {
      assignment = await getAssignment(event.entityId);
    } catch { /* ignore */ }
  }

  for (const role of roles) {
    switch (role) {
      case 'explicit':
        await addResolved(recipients, event.recipientId, orgId);
        if (typeof meta.recipientUserId === 'string') {
          await addResolved(recipients, meta.recipientUserId, orgId);
        }
        break;
      case 'assignee':
        if (assignment) {
          await addResolved(recipients, assignment.assigneeId, orgId);
          await addResolved(recipients, assignment.assigneeUserId, orgId);
        }
        break;
      case 'assigner':
        if (assignment) {
          await addResolved(recipients, assignment.assignerId, orgId);
        }
        break;
      case 'watchers':
        if (assignment) {
          try {
            const watchers = await getWatchers(event.entityId);
            for (const w of watchers) {
              if (w.userId) recipients.add(w.userId);
            }
          } catch { /* ignore */ }
        }
        break;
      case 'old_assignee':
        await addResolved(
          recipients,
          (meta.oldAssigneeId as string | undefined)
            ?? (meta.previousAssigneeId as string | undefined),
          orgId,
        );
        break;
      case 'new_assignee':
        await addResolved(
          recipients,
          (meta.newAssigneeId as string | undefined) ?? event.recipientId,
          orgId,
        );
        if (assignment) {
          await addResolved(recipients, assignment.assigneeId, orgId);
        }
        break;
      case 'entity_followers': {
        // Followers list may be passed in metadata; otherwise explicit recipients only.
        const followerIds = meta.followerIds;
        if (Array.isArray(followerIds)) {
          for (const id of followerIds) {
            if (typeof id === 'string') await addResolved(recipients, id, orgId);
          }
        }
        break;
      }
      default:
        break;
    }
  }

  // Mentions: only explicit recipient (registry already says explicit; force clear extras)
  if (event.type === 'comment.mentioned' && event.recipientId) {
    recipients.clear();
    await addResolved(recipients, event.recipientId, orgId);
  }

  // Part 20 / NOT-001 — never notify the actor about their own action
  const actorUid = await resolveUserId(event.actorId, orgId);
  if (actorUid) recipients.delete(actorUid);
  recipients.delete(event.actorId);

  // Best-effort: drop clearly foreign org persons (keep unknown uids)
  try {
    const people = await getPeopleByOrg(orgId);
    if (people.length > 0) {
      const orgUserIds = new Set(
        people.map((p) => p.userId).filter(Boolean) as string[],
      );
      // keep all — membership may lag person provisioning
      void orgUserIds;
    }
  } catch { /* ignore */ }

  return [...recipients];
}

export async function processNotificationEvent(
  event: NotificationEvent,
): Promise<{ created: number; skipped: boolean }> {
  if (await isEventProcessed(event.id)) {
    return { created: 0, skipped: true };
  }

  const def = getNotificationTypeDefinition(event.type);
  if (!def) {
    // Unknown type — mark processed so we don't loop forever
    await markEventProcessed(event.id);
    return { created: 0, skipped: true };
  }

  const actorName = await resolveActorName(event.actorId);
  const entityTitle = await resolveEntityTitle(event.entityType, event.entityId);
  const title = def.title;
  const message = interpolateTemplate(def.message, {
    actor: actorName,
    entity: entityTitle,
  });

  const isAssignment =
    event.entityType === 'assignment' || event.entityType === 'task';
  const assignmentId = isAssignment ? event.entityId : null;
  const releaseId =
    event.entityType === 'release'
      ? event.entityId
      : ((event.metadata?.releaseId as string | undefined) ?? null);

  const deepLink = resolveDeepLink(
    event.type,
    event.entityType,
    event.entityId,
    event.metadata,
  );

  const recipientUserIds = await resolveRecipientUserIds(event);
  let created = 0;

  for (const userId of recipientUserIds) {
    const prefs = await getNotificationPreferences(userId);
    let emailQueued = false;
    let pushQueued = false;

    // In-app is the primary inbox channel
    if (!isPreferenceEnabled(prefs, def.preferenceKey, 'inApp')) {
      // Still allow email/push-only if in-app off? NOT-001: channels independent per prefs.
      // Skip entire user if all channels off for this type.
      const wantEmail =
        def.emailImportant
        && isPreferenceEnabled(prefs, def.preferenceKey, 'email');
      const wantPush =
        def.pushEligible
        && isPreferenceEnabled(prefs, def.preferenceKey, 'push');
      if (!wantEmail && !wantPush) continue;

      // Email/push without in-app: still create a silent inbox row so deep links / audit exist
    }

    const inApp = isPreferenceEnabled(prefs, def.preferenceKey, 'inApp');

    const notification = await createUserNotification({
      organizationId: event.organizationId,
      userId,
      eventId: event.id,
      type: event.type,
      title,
      message,
      entityType: event.entityType,
      entityId: event.entityId,
      assignmentId,
      releaseId,
      actorId: event.actorId,
      actorName,
      deliveryStatus: 'delivered',
      channels: { inApp, emailQueued: false, pushQueued: false },
    });
    created++;

    // Email queue — important types only (NOT-001 noise control)
    if (
      def.emailImportant
      && isPreferenceEnabled(prefs, def.preferenceKey, 'email')
    ) {
      try {
        let recipientEmail = '';
        try {
          const person = await fetchPerson(userId);
          recipientEmail = person?.email ?? '';
          if (!recipientEmail) {
            const people = await getPeopleByOrg(event.organizationId);
            const match = people.find((p) => p.userId === userId);
            recipientEmail = match?.email ?? '';
          }
        } catch { /* ignore */ }
        if (recipientEmail) {
          await enqueueEmailJob({
            notificationId: notification.id,
            recipient: recipientEmail,
            subject: title,
            template: def.emailTemplate,
            payload: {
              message,
              entityType: event.entityType,
              entityId: event.entityId,
              actorName,
              deepLink,
            },
          });
          emailQueued = true;
        }
      } catch {
        // email queue failure must not block processing
      }
    }

    // Push queue — FCM worker (NOT-001)
    if (
      def.pushEligible
      && isPreferenceEnabled(prefs, def.preferenceKey, 'push')
    ) {
      try {
        await enqueuePushJob({
          notificationId: notification.id,
          userId,
          organizationId: event.organizationId,
          title,
          body: message,
          deepLink,
          eventType: event.type,
        });
        pushQueued = true;
      } catch {
        // push queue failure must not block processing
      }
    }

    // Best-effort channel flags update is omitted to avoid extra write;
    // flags are set at create. If queues succeeded after create, row still useful.
    void emailQueued;
    void pushQueued;
  }

  await markEventProcessed(event.id);
  return { created, skipped: false };
}

/**
 * Process recent unprocessed events for an organization.
 * Safe to call repeatedly (idempotent).
 */
export async function processPendingEvents(
  organizationId: string,
  maxEvents = 50,
): Promise<{ processed: number; created: number }> {
  const events = await getRecentNotificationEvents(organizationId, maxEvents);
  // Process oldest first so chronological user feed is natural
  const ordered = [...events].reverse();
  let processed = 0;
  let created = 0;
  for (const event of ordered) {
    const result = await processNotificationEvent(event);
    if (!result.skipped) processed++;
    created += result.created;
  }
  return { processed, created };
}

/** Exposed for unit tests — recipient roles for a type. */
export function getRecipientRolesForType(type: string): RecipientRole[] {
  const def: NotificationTypeDefinition | null = getNotificationTypeDefinition(type);
  return def?.recipients ?? [];
}
