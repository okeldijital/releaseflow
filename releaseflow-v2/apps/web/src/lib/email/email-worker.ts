/**
 * NOT-002 — Email worker (server-only).
 *
 * Reads pending email_queue docs via Admin SDK, renders templates, sends via
 * Resend, updates status. Never invoked from UI business logic except via API.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail, buildEmailParams } from './email-service';
import { renderNotificationEmailHtml } from './notification-email-templates';

const LOG = '[email-worker]';
const MAX_ATTEMPTS = 5;

export interface EmailWorkerResult {
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
}

interface QueueDoc {
  organizationId?: string;
  recipientUid?: string;
  recipientEmail?: string;
  recipient?: string;
  notificationId?: string;
  eventId?: string;
  eventType?: string;
  template?: string;
  subject?: string;
  payload?: Record<string, unknown>;
  status?: string;
  attempts?: number;
}

/**
 * Process up to `limit` pending email jobs.
 */
export async function processPendingEmailJobs(
  db: Firestore,
  limit = 25,
): Promise<EmailWorkerResult> {
  const result: EmailWorkerResult = {
    claimed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  const snap = await db
    .collection('email_queue')
    .where('status', '==', 'pending')
    .limit(limit)
    .get();

  for (const doc of snap.docs) {
    const data = doc.data() as QueueDoc;
    const attempts = data.attempts ?? 0;
    if (attempts >= MAX_ATTEMPTS) {
      await doc.ref.update({
        status: 'failed',
        failedAt: FieldValue.serverTimestamp(),
        lastError: 'Max attempts exceeded',
      });
      result.failed++;
      continue;
    }

    // Claim
    try {
      await doc.ref.update({
        status: 'sending',
        attempts: attempts + 1,
      });
      result.claimed++;
    } catch (err) {
      console.warn(LOG, 'claim failed', doc.id, err);
      result.skipped++;
      continue;
    }

    const to = (data.recipientEmail || data.recipient || '').trim();
    if (!to) {
      await doc.ref.update({
        status: 'failed',
        failedAt: FieldValue.serverTimestamp(),
        lastError: 'Missing recipient email',
      });
      result.failed++;
      continue;
    }

    const payload = data.payload ?? {};
    const subject = data.subject || 'ReleaseFlow notification';
    const deepLink = String(payload.deepLink ?? '/notifications');
    const html = renderNotificationEmailHtml({
      subject,
      title: String(payload.title ?? subject),
      message: String(payload.message ?? ''),
      actorName: payload.actorName ? String(payload.actorName) : undefined,
      entityTitle: payload.entityTitle ? String(payload.entityTitle) : undefined,
      organizationName: payload.organizationName
        ? String(payload.organizationName)
        : undefined,
      deepLink,
      ctaLabel: payload.ctaLabel ? String(payload.ctaLabel) : undefined,
      eventType: data.eventType,
      timestamp: new Date().toUTCString(),
    });

    console.log(LOG, 'rendering', {
      id: doc.id,
      template: data.template,
      eventType: data.eventType,
      to,
    });

    try {
      if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        throw new Error('Email provider not configured (RESEND_API_KEY / EMAIL_FROM)');
      }

      await sendEmail(buildEmailParams(to, subject, html));

      await doc.ref.update({
        status: 'sent',
        sentAt: FieldValue.serverTimestamp(),
        lastError: null,
      });
      result.sent++;
      console.log(LOG, 'sent', { id: doc.id, to, eventType: data.eventType });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const permanent = attempts + 1 >= MAX_ATTEMPTS;
      await doc.ref.update({
        status: permanent ? 'failed' : 'pending',
        failedAt: permanent ? FieldValue.serverTimestamp() : null,
        lastError: message.slice(0, 500),
      });
      if (permanent) result.failed++;
      else result.skipped++;
      console.error(LOG, 'send failed', { id: doc.id, message, permanent });
    }
  }

  return result;
}
