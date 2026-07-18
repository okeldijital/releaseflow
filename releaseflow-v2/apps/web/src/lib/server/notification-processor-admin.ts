/**
 * BUG-005 / NOT-001 / NOT-002 — Server-side notification processor (Admin SDK).
 *
 * Same architecture as the client processor:
 *   notification_events → user_notifications + email_queue
 *
 * Runs with Admin privileges so fan-out is not blocked by per-user
 * notification_preferences / user_notifications list rules.
 * Business services still only write notification_events (client).
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import {
  getNotificationTypeDefinition,
  interpolateTemplate,
  resolveDeepLink,
  type RecipientRole,
} from '@/lib/notification-type-registry';
import { processPendingEmailJobs } from '@/lib/email/email-worker';

const LOG = '[notification-processor-admin]';
const PROCESSOR_VERSION = '2.0.0-admin';

interface NotifEvent {
  id: string;
  type: string;
  organizationId: string;
  actorId: string;
  recipientId?: string | null;
  entityId: string;
  entityType: string;
  metadata?: Record<string, unknown> | null;
}

interface AssignmentDoc {
  title?: string;
  assigneeId?: string;
  assigneeUserId?: string | null;
  assignerId?: string;
  assignerUserId?: string | null;
  reviewRequestedBy?: string | null;
  reviewedBy?: string | null;
}

async function isProcessed(db: Firestore, eventId: string): Promise<boolean> {
  const snap = await db.collection('notification_processing').doc(eventId).get();
  return snap.exists;
}

async function markProcessed(db: Firestore, eventId: string): Promise<void> {
  await db.collection('notification_processing').doc(eventId).set({
    eventId,
    processedAt: FieldValue.serverTimestamp(),
    processorVersion: PROCESSOR_VERSION,
  });
}

async function resolveAuthUid(
  db: Firestore,
  id: string | null | undefined,
  organizationId: string,
): Promise<string | null> {
  if (!id) return null;

  // Person document id
  try {
    const personSnap = await db.collection('people').doc(id).get();
    if (personSnap.exists) {
      const data = personSnap.data() as { userId?: string | null };
      return data.userId || null;
    }
  } catch { /* continue */ }

  // Org people: match id as personId or userId
  try {
    const people = await db
      .collection('people')
      .where('organizationId', '==', organizationId)
      .limit(200)
      .get();
    for (const d of people.docs) {
      const data = d.data() as { userId?: string | null };
      if (d.id === id && data.userId) return data.userId;
      if (data.userId === id) return data.userId;
    }
  } catch { /* continue */ }

  // Treat as auth uid (assigner often stored as uid)
  return id;
}

async function resolveRecipients(
  db: Firestore,
  event: NotifEvent,
): Promise<string[]> {
  const def = getNotificationTypeDefinition(event.type);
  const roles: RecipientRole[] = def?.recipients ?? ['explicit'];
  const recipients = new Set<string>();
  const orgId = event.organizationId;
  const meta = (event.metadata ?? {}) as Record<string, unknown>;

  let assignment: AssignmentDoc | null = null;
  const needsAssignment = roles.some((r) =>
    ['assignee', 'assigner', 'watchers', 'old_assignee', 'new_assignee'].includes(r),
  );
  if (needsAssignment && (event.entityType === 'assignment' || event.entityType === 'task')) {
    const snap = await db.collection('assignments').doc(event.entityId).get();
    if (snap.exists) assignment = snap.data() as AssignmentDoc;
  }

  const add = async (raw?: string | null) => {
    const uid = await resolveAuthUid(db, raw, orgId);
    if (uid) recipients.add(uid);
  };

  for (const role of roles) {
    switch (role) {
      case 'explicit':
        await add(event.recipientId);
        if (typeof meta.recipientUserId === 'string') await add(meta.recipientUserId);
        break;
      case 'assignee':
        if (assignment) {
          await add(assignment.assigneeId);
          await add(assignment.assigneeUserId);
        }
        break;
      case 'assigner':
        if (assignment) {
          await add(assignment.assignerUserId || assignment.assignerId);
        }
        break;
      case 'watchers': {
        try {
          const w = await db
            .collection('assignment_watchers')
            .where('assignmentId', '==', event.entityId)
            .limit(50)
            .get();
          for (const d of w.docs) {
            const data = d.data() as { userId?: string };
            if (data.userId) recipients.add(data.userId);
          }
        } catch { /* ignore */ }
        break;
      }
      case 'old_assignee':
        await add(
          (meta.oldAssigneeId as string | undefined)
            ?? (meta.previousAssigneeId as string | undefined),
        );
        break;
      case 'new_assignee':
        await add((meta.newAssigneeId as string | undefined) ?? event.recipientId);
        if (assignment) await add(assignment.assigneeId);
        break;
      case 'entity_followers': {
        const followerIds = meta.followerIds;
        if (Array.isArray(followerIds)) {
          for (const id of followerIds) {
            if (typeof id === 'string') await add(id);
          }
        }
        break;
      }
      default:
        break;
    }
  }

  if (event.type === 'comment.mentioned' && event.recipientId) {
    recipients.clear();
    await add(event.recipientId);
  }

  // Never notify actor
  const actorUid = await resolveAuthUid(db, event.actorId, orgId);
  if (actorUid) recipients.delete(actorUid);
  recipients.delete(event.actorId);

  return [...recipients];
}

async function resolveActorName(db: Firestore, actorId: string): Promise<string> {
  if (!actorId || actorId === 'system') return 'ReleaseFlow';
  try {
    const p = await db.collection('people').doc(actorId).get();
    if (p.exists) {
      const data = p.data() as { displayName?: string };
      if (data.displayName) return data.displayName;
    }
  } catch { /* ignore */ }
  try {
    const u = await db.collection('users').doc(actorId).get();
    if (u.exists) {
      const data = u.data() as { displayName?: string };
      if (data.displayName) return data.displayName;
    }
  } catch { /* ignore */ }
  return 'Someone';
}

async function resolveEntityTitle(
  db: Firestore,
  entityType: string,
  entityId: string,
): Promise<string> {
  if (entityType === 'assignment' || entityType === 'task') {
    const snap = await db.collection('assignments').doc(entityId).get();
    if (snap.exists) {
      const t = (snap.data() as AssignmentDoc).title;
      if (t) return t;
    }
  }
  return 'item';
}

async function getPrefs(
  db: Firestore,
  userId: string,
): Promise<{
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  preferences: Record<string, boolean>;
}> {
  try {
    const snap = await db.collection('notification_preferences').doc(userId).get();
    if (!snap.exists) {
      return {
        inAppEnabled: true,
        emailEnabled: true,
        pushEnabled: false,
        preferences: {},
      };
    }
    const data = snap.data() as Record<string, unknown>;
    return {
      inAppEnabled: (data.inAppEnabled as boolean) ?? true,
      emailEnabled: (data.emailEnabled as boolean) ?? true,
      pushEnabled: (data.pushEnabled as boolean) ?? false,
      preferences: (data.preferences as Record<string, boolean>) ?? {},
    };
  } catch {
    return {
      inAppEnabled: true,
      emailEnabled: true,
      pushEnabled: false,
      preferences: {},
    };
  }
}

function prefOn(
  prefs: Awaited<ReturnType<typeof getPrefs>>,
  key: string,
  channel: 'inApp' | 'email' | 'push',
): boolean {
  if (channel === 'inApp' && !prefs.inAppEnabled) return false;
  if (channel === 'email' && !prefs.emailEnabled) return false;
  if (channel === 'push' && !prefs.pushEnabled) return false;
  return prefs.preferences[key] !== false;
}

async function createInboxIfMissing(
  db: Firestore,
  fields: {
    organizationId: string;
    userId: string;
    eventId: string;
    type: string;
    title: string;
    message: string;
    entityType: string;
    entityId: string;
    assignmentId: string | null;
    releaseId: string | null;
    actorId: string;
    actorName: string;
  },
): Promise<string> {
  const existing = await db
    .collection('user_notifications')
    .where('userId', '==', fields.userId)
    .where('eventId', '==', fields.eventId)
    .limit(1)
    .get();
  if (!existing.empty) return existing.docs[0]!.id;

  const ref = await db.collection('user_notifications').add({
    organizationId: fields.organizationId,
    userId: fields.userId,
    eventId: fields.eventId,
    type: fields.type,
    title: fields.title,
    message: fields.message,
    entityType: fields.entityType,
    entityId: fields.entityId,
    assignmentId: fields.assignmentId,
    releaseId: fields.releaseId,
    actorId: fields.actorId,
    actorName: fields.actorName,
    isRead: false,
    readAt: null,
    createdAt: FieldValue.serverTimestamp(),
    deliveryStatus: 'delivered',
    channels: { inApp: true, emailQueued: false, pushQueued: false },
  });
  return ref.id;
}

async function enqueueEmailAdmin(
  db: Firestore,
  fields: {
    organizationId: string;
    recipientUid: string;
    recipientEmail: string;
    notificationId: string;
    eventId: string;
    eventType: string;
    template: string;
    subject: string;
    payload: Record<string, unknown>;
  },
): Promise<string | null> {
  const email = fields.recipientEmail.trim().toLowerCase();
  if (!email) return null;
  const dedupeKey = `${fields.eventId}:${fields.recipientUid}`;

  const byNotif = await db
    .collection('email_queue')
    .where('notificationId', '==', fields.notificationId)
    .limit(1)
    .get();
  if (!byNotif.empty) return byNotif.docs[0]!.id;

  const ref = await db.collection('email_queue').add({
    organizationId: fields.organizationId,
    recipientUid: fields.recipientUid,
    recipientEmail: email,
    recipient: email,
    notificationId: fields.notificationId,
    eventId: fields.eventId,
    eventType: fields.eventType,
    template: fields.template,
    subject: fields.subject,
    payload: fields.payload,
    status: 'pending',
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
    sentAt: null,
    failedAt: null,
    lastError: null,
    dedupeKey,
  });
  return ref.id;
}

async function resolveRecipientEmail(
  db: Firestore,
  userId: string,
  organizationId: string,
): Promise<string> {
  try {
    const userSnap = await db.collection('users').doc(userId).get();
    if (userSnap.exists) {
      const email = (userSnap.data() as { email?: string }).email;
      if (email) return email;
    }
  } catch { /* continue */ }
  try {
    const people = await db
      .collection('people')
      .where('organizationId', '==', organizationId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    if (!people.empty) {
      const email = (people.docs[0]!.data() as { email?: string }).email;
      if (email) return email;
    }
  } catch { /* continue */ }
  return '';
}

export async function processNotificationEventAdmin(
  db: Firestore,
  event: NotifEvent,
): Promise<{ created: number; skipped: boolean; emails: number }> {
  if (await isProcessed(db, event.id)) {
    return { created: 0, skipped: true, emails: 0 };
  }

  const def = getNotificationTypeDefinition(event.type);
  if (!def) {
    await markProcessed(db, event.id);
    return { created: 0, skipped: true, emails: 0 };
  }

  const actorName = await resolveActorName(db, event.actorId);
  const entityTitle = await resolveEntityTitle(db, event.entityType, event.entityId);
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

  const recipients = await resolveRecipients(db, event);
  console.log(LOG, 'recipients', {
    eventId: event.id,
    type: event.type,
    actorId: event.actorId,
    recipientCount: recipients.length,
    recipients,
  });

  let created = 0;
  let emails = 0;
  let failures = 0;

  for (const userId of recipients) {
    try {
      const prefs = await getPrefs(db, userId);
      const wantInApp = prefOn(prefs, def.preferenceKey, 'inApp');
      const wantEmail =
        def.emailImportant && prefOn(prefs, def.preferenceKey, 'email');
      const wantPush =
        def.pushEligible && prefOn(prefs, def.preferenceKey, 'push');

      if (!wantInApp && !wantEmail && !wantPush) continue;

      const notificationId = await createInboxIfMissing(db, {
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

      console.log(LOG, 'inbox written', {
        eventId: event.id,
        notificationId,
        recipientUid: userId,
      });

      if (wantEmail) {
        const recipientEmail = await resolveRecipientEmail(
          db,
          userId,
          event.organizationId,
        );
        if (recipientEmail) {
          const emailId = await enqueueEmailAdmin(db, {
            organizationId: event.organizationId,
            recipientUid: userId,
            recipientEmail,
            notificationId,
            eventId: event.id,
            eventType: event.type,
            template: def.emailTemplate,
            subject: title,
            payload: {
              title,
              message,
              actorName,
              entityTitle,
              deepLink,
              entityType: event.entityType,
              entityId: event.entityId,
            },
          });
          if (emailId) {
            emails++;
            console.log(LOG, 'email queued', {
              eventId: event.id,
              emailQueueId: emailId,
              recipientUid: userId,
            });
          }
        }
      }
    } catch (err) {
      failures++;
      console.error(LOG, 'recipient fan-out failed', {
        eventId: event.id,
        userId,
        err,
      });
    }
  }

  // BUG-005: if we had recipients but wrote nothing due to failures, leave
  // unprocessed so a later run can retry.
  if (recipients.length > 0 && created === 0 && failures > 0) {
    console.warn(LOG, 'leaving event unprocessed for retry', {
      eventId: event.id,
      failures,
    });
    return { created: 0, skipped: false, emails: 0 };
  }

  await markProcessed(db, event.id);
  console.log(LOG, 'event processed', {
    eventId: event.id,
    type: event.type,
    created,
    emails,
  });
  return { created, skipped: false, emails };
}

export async function processPendingEventsAdmin(
  db: Firestore,
  organizationId: string,
  maxEvents = 40,
): Promise<{ processed: number; created: number; emails: number }> {
  const snap = await db
    .collection('notification_events')
    .where('organizationId', '==', organizationId)
    .orderBy('createdAt', 'desc')
    .limit(maxEvents)
    .get();

  const ordered = [...snap.docs].reverse();
  let processed = 0;
  let created = 0;
  let emails = 0;

  for (const d of ordered) {
    const data = d.data() as Omit<NotifEvent, 'id'>;
    const event: NotifEvent = { id: d.id, ...data };
    const result = await processNotificationEventAdmin(db, event);
    if (!result.skipped) processed++;
    created += result.created;
    emails += result.emails;
  }

  // Drain email queue via same Admin path (NOT-002)
  try {
    await processPendingEmailJobs(db, 30);
  } catch (err) {
    console.warn(LOG, 'email worker drain failed', err);
  }

  return { processed, created, emails };
}
