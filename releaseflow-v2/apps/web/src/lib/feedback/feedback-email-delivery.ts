/**
 * BUILD-302C — Server-side feedback email delivery (Admin SDK).
 *
 * Sequence: load persisted feedback → claim → resolve identity/titles →
 * send via existing email-service → update emailDeliveryStatus.
 *
 * Never called from browser with secrets; only via API route / trusted server.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail, buildEmailParams } from '@/lib/email/email-service';
import { FEEDBACK_COLLECTION } from './feedback-repository';
import { requireFeedbackNotificationEmail } from './feedback-email-config';
import {
  buildFeedbackEmailSubject,
  type FeedbackSubjectEntityTitles,
} from './feedback-email-subject';
import {
  formatFeedbackEmailTimestamp,
  renderFeedbackEmailHtml,
  renderFeedbackEmailText,
  type FeedbackEmailIdentity,
} from './feedback-email-template';
import type { EmailDeliveryStatus, FeedbackContext } from './feedback-types';

const LOG = '[feedback-email]';
const CLAIM_TTL_MS = 2 * 60 * 1000;

export type FeedbackEmailDeliveryResult =
  | { status: 'sent'; feedbackId: string; skipped?: boolean }
  | { status: 'failed'; feedbackId: string; error: string }
  | { status: 'skipped'; feedbackId: string; reason: string };

export interface DeliverFeedbackEmailOptions {
  /** When true, allow re-send of failed records (and pending). Never re-send sent. */
  allowRetry?: boolean;
  /**
   * Injectables for tests.
   */
  send?: typeof sendEmail;
  getDestination?: () => string;
}

function roleLabel(roleId: string | null | undefined): string | null {
  if (!roleId) return null;
  return roleId
    .split(/[_-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      /* fall through */
    }
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

async function resolveIdentity(
  db: Firestore,
  userId: string,
  organisationId: string,
): Promise<FeedbackEmailIdentity> {
  const userSnap = await db.collection('users').doc(userId).get();
  const user = userSnap.exists
    ? (userSnap.data() as {
        displayName?: string;
        email?: string;
      })
    : {};

  const orgSnap = await db.collection('organizations').doc(organisationId).get();
  const org = orgSnap.exists
    ? (orgSnap.data() as { name?: string })
    : {};

  let role: string | null = null;
  try {
    const memberSnap = await db
      .collection('organizations')
      .doc(organisationId)
      .collection('members')
      .doc(userId)
      .get();
    if (memberSnap.exists) {
      role = roleLabel((memberSnap.data() as { roleId?: string }).roleId);
    }
  } catch {
    /* optional */
  }

  if (!role) {
    try {
      const memberships = await db
        .collection('memberships')
        .where('userId', '==', userId)
        .where('organizationId', '==', organisationId)
        .limit(1)
        .get();
      const m = memberships.docs[0]?.data() as { roleId?: string } | undefined;
      role = roleLabel(m?.roleId);
    } catch {
      /* optional */
    }
  }

  return {
    userName: user.displayName?.trim() || user.email?.split('@')[0] || 'User',
    userEmail: user.email?.trim() || '',
    userId,
    role,
    organisationName: org.name?.trim() || organisationId,
    organisationId,
  };
}

async function resolveEntityTitles(
  db: Firestore,
  context: FeedbackContext,
  organisationId: string,
): Promise<FeedbackSubjectEntityTitles> {
  const titles: FeedbackSubjectEntityTitles = {};

  if (context.releaseId) {
    try {
      const snap = await db.collection('releases').doc(context.releaseId).get();
      if (snap.exists) {
        const data = snap.data() as {
          title?: string;
          displayTitle?: string;
          organizationId?: string;
          organisationId?: string;
        };
        const org =
          data.organizationId || data.organisationId || '';
        // Tenant isolation: only use title if org matches (or org field missing on legacy)
        if (!org || org === organisationId) {
          titles.releaseTitle =
            data.displayTitle?.trim() || data.title?.trim() || null;
        }
      }
    } catch {
      /* optional */
    }
  }

  if (context.trackId) {
    try {
      const snap = await db.collection('tracks').doc(context.trackId).get();
      if (snap.exists) {
        const data = snap.data() as {
          title?: string;
          displayTitle?: string;
          organizationId?: string;
        };
        if (!data.organizationId || data.organizationId === organisationId) {
          titles.trackTitle =
            data.displayTitle?.trim() || data.title?.trim() || null;
        }
      }
    } catch {
      /* optional */
    }
  }

  if (context.artistId) {
    try {
      // Prefer org subcollection path used by catalogue
      let name: string | null = null;
      const sub = await db
        .collection('organizations')
        .doc(organisationId)
        .collection('artists')
        .doc(context.artistId)
        .get();
      if (sub.exists) {
        name = (sub.data() as { name?: string }).name?.trim() || null;
      } else {
        const top = await db.collection('artists').doc(context.artistId).get();
        if (top.exists) {
          const data = top.data() as { name?: string; organizationId?: string };
          if (!data.organizationId || data.organizationId === organisationId) {
            name = data.name?.trim() || null;
          }
        }
      }
      titles.artistName = name;
    } catch {
      /* optional */
    }
  }

  if (context.taskId) {
    try {
      const snap = await db.collection('tasks').doc(context.taskId).get();
      if (snap.exists) {
        const data = snap.data() as {
          title?: string;
          organisationId?: string;
          organizationId?: string;
        };
        const org = data.organisationId || data.organizationId || '';
        if (!org || org === organisationId) {
          titles.taskTitle = data.title?.trim() || null;
        }
      }
    } catch {
      /* optional */
    }
  }

  if (context.assignmentId) {
    try {
      const snap = await db.collection('assignments').doc(context.assignmentId).get();
      if (snap.exists) {
        const data = snap.data() as {
          title?: string;
          organizationId?: string;
        };
        if (!data.organizationId || data.organizationId === organisationId) {
          titles.assignmentTitle = data.title?.trim() || null;
        }
      }
    } catch {
      /* optional */
    }
  }

  if (context.personId) {
    try {
      const snap = await db.collection('people').doc(context.personId).get();
      if (snap.exists) {
        const data = snap.data() as {
          displayName?: string;
          organizationId?: string;
        };
        if (!data.organizationId || data.organizationId === organisationId) {
          titles.personName = data.displayName?.trim() || null;
        }
      }
    } catch {
      /* optional */
    }
  }

  if (context.assetId) {
    try {
      const snap = await db.collection('assets').doc(context.assetId).get();
      if (snap.exists) {
        const data = snap.data() as {
          name?: string;
          organizationId?: string;
        };
        if (!data.organizationId || data.organizationId === organisationId) {
          titles.assetName = data.name?.trim() || null;
        }
      }
    } catch {
      /* optional */
    }
  }

  return titles;
}

/**
 * Deliver feedback notification for a persisted feedback document.
 * Caller must verify requester is authenticated and authorised.
 */
export async function deliverFeedbackEmail(
  db: Firestore,
  feedbackId: string,
  options: DeliverFeedbackEmailOptions = {},
): Promise<FeedbackEmailDeliveryResult> {
  const ref = db.collection(FEEDBACK_COLLECTION).doc(feedbackId);

  // Atomic claim / idempotency gate
  const claim = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      return { ok: false as const, reason: 'not_found' };
    }
    const data = snap.data() as Record<string, unknown>;
    const status = (data.emailDeliveryStatus as EmailDeliveryStatus) || 'pending';

    if (status === 'sent') {
      return { ok: false as const, reason: 'already_sent', data };
    }

    if (status !== 'pending' && status !== 'failed') {
      return { ok: false as const, reason: `invalid_status:${status}`, data };
    }

    if (status === 'failed' && !options.allowRetry) {
      // allowRetry defaults true for explicit deliver calls
    }

    const claimedAt = data.emailDeliveryClaimedAt as { toMillis?: () => number; seconds?: number } | undefined;
    let claimedMs = 0;
    if (claimedAt && typeof claimedAt.toMillis === 'function') {
      claimedMs = claimedAt.toMillis();
    } else if (claimedAt && typeof claimedAt.seconds === 'number') {
      claimedMs = claimedAt.seconds * 1000;
    }
    if (claimedMs && Date.now() - claimedMs < CLAIM_TTL_MS && status === 'pending') {
      return { ok: false as const, reason: 'in_progress', data };
    }

    tx.update(ref, {
      emailDeliveryClaimedAt: FieldValue.serverTimestamp(),
      emailDeliveryLastError: null,
    });

    return { ok: true as const, data };
  });

  if (!claim.ok) {
    if (claim.reason === 'already_sent') {
      return { status: 'sent', feedbackId, skipped: true };
    }
    if (claim.reason === 'in_progress') {
      return { status: 'skipped', feedbackId, reason: 'in_progress' };
    }
    if (claim.reason === 'not_found') {
      return { status: 'failed', feedbackId, error: 'Feedback not found' };
    }
    return { status: 'skipped', feedbackId, reason: claim.reason };
  }

  const data = claim.data;
  const organisationId =
    (data.organisationId as string)
    || (data.organizationId as string)
    || '';
  const userId = (data.userId as string) || '';
  const message = (data.message as string) || '';
  const context = (data.context as FeedbackContext) || {
    route: '/',
    module: 'unknown',
    page: 'unknown',
  };
  const createdAt = toDate(data.createdAt);

  if (!organisationId || !userId) {
    await ref.update({
      emailDeliveryStatus: 'failed',
      emailDeliveryLastError: 'Missing organisation or user on feedback',
      emailDeliveryClaimedAt: FieldValue.delete(),
      emailDeliveryFailedAt: FieldValue.serverTimestamp(),
    });
    return {
      status: 'failed',
      feedbackId,
      error: 'Missing organisation or user on feedback',
    };
  }

  try {
    const destination =
      options.getDestination?.() ?? requireFeedbackNotificationEmail();
    const send = options.send ?? sendEmail;

    const identity = await resolveIdentity(db, userId, organisationId);
    const titles = await resolveEntityTitles(db, context, organisationId);
    const subject = buildFeedbackEmailSubject(context, titles);
    const timestampLabel = formatFeedbackEmailTimestamp(createdAt);
    const renderInput = {
      message,
      context,
      identity,
      titles,
      timestampLabel,
      route: context.route || '/',
    };
    const html = renderFeedbackEmailHtml(renderInput);
    const text = renderFeedbackEmailText(renderInput);

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      throw new Error('Email provider not configured (RESEND_API_KEY / EMAIL_FROM)');
    }

    const replyTo = identity.userEmail || undefined;
    await send(
      buildEmailParams(destination, subject, html, text, replyTo),
    );

    await ref.update({
      emailDeliveryStatus: 'sent',
      emailDeliverySentAt: FieldValue.serverTimestamp(),
      emailDeliveryLastError: null,
      emailDeliveryClaimedAt: FieldValue.delete(),
    });

    console.log(LOG, 'sent', { feedbackId, organisationId });
    return { status: 'sent', feedbackId };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await ref.update({
      emailDeliveryStatus: 'failed',
      emailDeliveryFailedAt: FieldValue.serverTimestamp(),
      emailDeliveryLastError: error.slice(0, 500),
      emailDeliveryClaimedAt: FieldValue.delete(),
    });
    console.error(LOG, 'failed', { feedbackId, error });
    return { status: 'failed', feedbackId, error };
  }
}

/**
 * Retry delivery for a failed (or stuck pending) feedback record.
 */
export async function retryFeedbackEmail(
  db: Firestore,
  feedbackId: string,
  options: DeliverFeedbackEmailOptions = {},
): Promise<FeedbackEmailDeliveryResult> {
  return deliverFeedbackEmail(db, feedbackId, {
    ...options,
    allowRetry: true,
  });
}
