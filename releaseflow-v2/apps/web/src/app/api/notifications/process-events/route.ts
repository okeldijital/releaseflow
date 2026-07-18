/**
 * BUG-005 / NOT-001 — Server-side notification event processor entrypoint.
 * Authenticated clients trigger fan-out after writing notification_events.
 */

import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/server/firebase-admin';
import { processPendingEventsAdmin } from '@/lib/server/notification-processor-admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getAdminAuth().verifyIdToken(token);

    const body = (await request.json().catch(() => ({}))) as {
      organizationId?: string;
      maxEvents?: number;
    };

    if (!body.organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const maxEvents = Math.min(Math.max(Number(body.maxEvents) || 40, 1), 80);
    const db = getAdminDb();
    const result = await processPendingEventsAdmin(db, body.organizationId, maxEvents);

    console.log('[process-events] complete', {
      organizationId: body.organizationId,
      ...result,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[process-events]', err);
    const message = err instanceof Error ? err.message : 'Process events failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
