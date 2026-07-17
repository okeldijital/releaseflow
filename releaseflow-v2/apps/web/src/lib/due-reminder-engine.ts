/**
 * CE-006 — Due Reminder Engine
 *
 * Generates notification_events only (never user notifications directly).
 * - assignment.due_soon: within 24h of due (and on due day)
 * - assignment.overdue: past due and not completed
 *
 * Dedupes via metadata.reminderKey checked against recent events.
 */

import { collection, getDocs, query, where, limit } from '@firebase/firestore';
import { getDb } from './firebase';
import { listAssignments } from './assignment-repository';
import type { AssignmentRecord } from './assignment-repository';
import { generateSystemNotificationEvent } from './notification-event-service';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  return null;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function reminderEventExists(
  organizationId: string,
  assignmentId: string,
  reminderKey: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  // Scan recent assignment events (limited) and match metadata client-side
  const snap = await getDocs(
    query(
      collection(db, 'notification_events'),
      where('organizationId', '==', organizationId),
      where('entityId', '==', assignmentId),
      limit(40),
    ),
  );
  return snap.docs.some((d) => {
    const data = d.data() as { type?: string; metadata?: { reminderKey?: string } };
    return (
      (
        data.type === 'assignment.due_soon'
        || data.type === 'assignment.overdue'
        || data.type === 'assignment.due_today'
        || data.type === 'assignment.due_tomorrow'
      ) && data.metadata?.reminderKey === reminderKey
    );
  });
}

function isActiveAssignment(a: AssignmentRecord): boolean {
  return !['completed', 'cancelled', 'archived', 'declined'].includes(a.status);
}

/**
 * Scan org assignments and emit due/overdue events.
 * @param actorId — authenticated user id (rules require actorId == auth.uid)
 */
export async function runDueReminderEngine(
  organizationId: string,
  actorId: string,
): Promise<{ dueSoon: number; overdue: number }> {
  const assignments = await listAssignments(organizationId);
  const now = new Date();
  const ms24h = 24 * 60 * 60 * 1000;
  let dueSoon = 0;
  let overdue = 0;

  for (const a of assignments) {
    if (!isActiveAssignment(a) || !a.dueDate) continue;
    const due = toDate(a.dueDate);
    if (!due) continue;

    const diff = due.getTime() - now.getTime();

    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayDiffMs = dueDay.getTime() - nowDay.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (dayDiffMs === 0) {
      // CE-007 — due today
      const key = `due_today:${a.id}:${dayKey(now)}`;
      if (!(await reminderEventExists(organizationId, a.id, key))) {
        await generateSystemNotificationEvent({
          type: 'assignment.due_today',
          organizationId,
          actorId,
          recipientId: a.assigneeId,
          entityId: a.id,
          entityType: 'assignment',
          metadata: { reminderKey: key, dueDate: due.toISOString(), title: a.title },
        });
        dueSoon++;
      }
    } else if (dayDiffMs === oneDay) {
      const key = `due_tomorrow:${a.id}:${dayKey(due)}`;
      if (!(await reminderEventExists(organizationId, a.id, key))) {
        await generateSystemNotificationEvent({
          type: 'assignment.due_tomorrow',
          organizationId,
          actorId,
          recipientId: a.assigneeId,
          entityId: a.id,
          entityType: 'assignment',
          metadata: { reminderKey: key, dueDate: due.toISOString(), title: a.title },
        });
        dueSoon++;
      }
    }

    if (diff < 0) {
      const key = `overdue:${a.id}:${dayKey(now)}`;
      if (!(await reminderEventExists(organizationId, a.id, key))) {
        await generateSystemNotificationEvent({
          type: 'assignment.overdue',
          organizationId,
          actorId,
          recipientId: a.assigneeId,
          entityId: a.id,
          entityType: 'assignment',
          metadata: {
            reminderKey: key,
            dueDate: due.toISOString(),
            title: a.title,
          },
        });
        overdue++;
      }
    } else if (diff <= ms24h && dayDiffMs > oneDay) {
      const key = `due_soon:${a.id}:${dayKey(due)}`;
      if (!(await reminderEventExists(organizationId, a.id, key))) {
        await generateSystemNotificationEvent({
          type: 'assignment.due_soon',
          organizationId,
          actorId,
          recipientId: a.assigneeId,
          entityId: a.id,
          entityType: 'assignment',
          metadata: {
            reminderKey: key,
            dueDate: due.toISOString(),
            title: a.title,
          },
        });
        dueSoon++;
      }
    }
  }

  return { dueSoon, overdue };
}
