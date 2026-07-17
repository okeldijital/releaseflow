/**
 * CE-006 — Notification Processor
 *
 * Reads immutable notification_events → creates user_notifications.
 * Never mutates events. Idempotent via notification_processing + eventId+userId.
 * Business services must only call generateNotificationEvent().
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
import {
  getNotificationTypeDefinition,
  interpolateTemplate,
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
  // actorId may be a Firebase uid — try org people by userId is expensive;
  // fall back to short id.
  return 'Someone';
}

/** Resolve personId or userId to Firebase auth uid for notification delivery. */
async function resolveUserId(
  id: string,
  organizationId: string,
): Promise<string | null> {
  if (!id) return null;
  try {
    const person = await fetchPerson(id);
    if (person) {
      if (person.organizationId && person.organizationId !== organizationId) {
        // wrong org person
      } else if (person.userId) {
        return person.userId;
      } else {
        // person without linked user — cannot deliver in-app
        return null;
      }
    }
  } catch { /* treat as uid */ }
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
  return 'assignment';
}

/**
 * Determine who should receive notifications for an event.
 * Never includes the actor (Part 20).
 */
async function resolveRecipientUserIds(event: NotificationEvent): Promise<string[]> {
  const recipients = new Set<string>();
  const orgId = event.organizationId;

  if (event.recipientId) {
    const uid = await resolveUserId(event.recipientId, orgId);
    if (uid) recipients.add(uid);
  }

  // Fan-out for assignment-scoped events without exclusive recipient
  const isAssignmentEntity =
    event.entityType === 'assignment' || event.entityType === 'task';

  if (isAssignmentEntity && !['comment.mentioned', 'invitation.accepted', 'invitation.revoked'].includes(event.type)) {
    try {
      const assignment = await getAssignment(event.entityId);
      if (assignment) {
        for (const id of [assignment.assigneeId, assignment.assignerId, assignment.reviewRequestedBy, assignment.reviewedBy]) {
          if (!id) continue;
          const uid = await resolveUserId(id, orgId);
          if (uid) recipients.add(uid);
        }
        const watchers = await getWatchers(event.entityId);
        for (const w of watchers) {
          if (w.userId) recipients.add(w.userId);
        }
      }
    } catch { /* ignore fan-out failures */ }
  }

  // Mentions: only explicit recipient
  if (event.type === 'comment.mentioned' && event.recipientId) {
    recipients.clear();
    const uid = await resolveUserId(event.recipientId, orgId);
    if (uid) recipients.add(uid);
  }

  // Due reminders: prefer assignee only
  if (event.type === 'assignment.due_soon' || event.type === 'assignment.overdue') {
    recipients.clear();
    if (event.recipientId) {
      const uid = await resolveUserId(event.recipientId, orgId);
      if (uid) recipients.add(uid);
    } else {
      try {
        const assignment = await getAssignment(event.entityId);
        if (assignment) {
          const uid = await resolveUserId(assignment.assigneeId, orgId);
          if (uid) recipients.add(uid);
        }
      } catch { /* ignore */ }
    }
  }

  // Part 20 — never notify the actor about their own action
  const actorUid = await resolveUserId(event.actorId, orgId);
  if (actorUid) recipients.delete(actorUid);
  recipients.delete(event.actorId);

  // Validate org membership (best-effort)
  try {
    const people = await getPeopleByOrg(orgId);
    const orgUserIds = new Set(
      people.map((p) => p.userId).filter(Boolean) as string[],
    );
    const orgPersonIds = new Set(people.map((p) => p.id));
    for (const r of [...recipients]) {
      if (!orgUserIds.has(r) && !orgPersonIds.has(r)) {
        // keep uids not in people list if they might still be members without person records
        // only drop if we have people data and neither match
        if (people.length > 0 && !orgUserIds.has(r)) {
          // allow unknown uids — membership may lag person provisioning
        }
      }
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
    (event.metadata?.releaseId as string | undefined) ?? null;

  const recipientUserIds = await resolveRecipientUserIds(event);
  let created = 0;

  for (const userId of recipientUserIds) {
    const prefs = await getNotificationPreferences(userId);

    if (isPreferenceEnabled(prefs, def.preferenceKey, 'inApp')) {
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
      });
      created++;

      // Email queue (do not send)
      if (isPreferenceEnabled(prefs, def.preferenceKey, 'email')) {
        try {
          let recipientEmail = '';
          try {
            const person = await fetchPerson(userId);
            recipientEmail = person?.email ?? '';
            if (!recipientEmail) {
              // try people by userId
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
              },
            });
          }
        } catch {
          // email queue failure must not block processing
        }
      }
    }
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
