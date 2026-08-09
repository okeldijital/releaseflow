/**
 * BUILD-302C — Deliver feedback email notification (server-only).
 *
 * Client may only pass feedbackId + auth token.
 * Destination, secrets, and status updates stay server-side (Admin SDK).
 */

import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/server/firebase-admin';
import { FEEDBACK_COLLECTION } from '@/lib/feedback/feedback-repository';
import {
  deliverFeedbackEmail,
  retryFeedbackEmail,
} from '@/lib/feedback/feedback-email-delivery';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const body = (await request.json().catch(() => ({}))) as {
      feedbackId?: string;
      retry?: boolean;
    };
    const feedbackId = body.feedbackId?.trim();
    if (!feedbackId) {
      return NextResponse.json({ error: 'Missing feedbackId' }, { status: 400 });
    }

    const db = getAdminDb();
    const snap = await db.collection(FEEDBACK_COLLECTION).doc(feedbackId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const data = snap.data() as {
      userId?: string;
      organisationId?: string;
      organizationId?: string;
      emailDeliveryStatus?: string;
    };

    const organisationId =
      data.organisationId || data.organizationId || '';
    if (!organisationId) {
      return NextResponse.json(
        { error: 'Feedback missing organisation' },
        { status: 400 },
      );
    }

    // Only the authoring user may trigger delivery for their submission.
    if (data.userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Membership check — multi-tenant isolation
    const memberSnap = await db
      .collection('organizations')
      .doc(organisationId)
      .collection('members')
      .doc(uid)
      .get();

    let isMember = memberSnap.exists
      && (memberSnap.data() as { status?: string }).status === 'active';

    if (!isMember) {
      const memberships = await db
        .collection('memberships')
        .where('userId', '==', uid)
        .where('organizationId', '==', organisationId)
        .where('status', '==', 'active')
        .limit(1)
        .get();
      isMember = !memberships.empty;
    }

    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isRetry =
      body.retry === true || data.emailDeliveryStatus === 'failed';

    const result = isRetry
      ? await retryFeedbackEmail(db, feedbackId)
      : await deliverFeedbackEmail(db, feedbackId, { allowRetry: true });

    if (result.status === 'sent') {
      return NextResponse.json({
        ok: true,
        emailDeliveryStatus: 'sent',
        skipped: 'skipped' in result ? result.skipped : false,
        feedbackId,
      });
    }

    if (result.status === 'skipped') {
      return NextResponse.json({
        ok: true,
        emailDeliveryStatus: data.emailDeliveryStatus ?? 'pending',
        skipped: true,
        reason: result.reason,
        feedbackId,
      });
    }

    return NextResponse.json({
      ok: false,
      emailDeliveryStatus: 'failed',
      error: result.error,
      feedbackId,
    });
  } catch (err) {
    console.error('[feedback/deliver-email]', err);
    const message = err instanceof Error ? err.message : 'Delivery failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
