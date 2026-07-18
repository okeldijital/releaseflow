/**
 * NOT-002 — Process pending notification emails (email worker entrypoint).
 * Authenticated users may trigger a batch after local event processing.
 * Uses Admin SDK + Resend; never exposes secrets to the client.
 */

import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/server/firebase-admin';
import { processPendingEmailJobs } from '@/lib/email/email-worker';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getAdminAuth().verifyIdToken(token);

    const body = await request.json().catch(() => ({})) as { limit?: number };
    const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 50);

    const db = getAdminDb();
    const result = await processPendingEmailJobs(db, limit);

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[process-email-queue]', err);
    const message = err instanceof Error ? err.message : 'Email worker failed';
    // Do not fail hard for missing service account in local — report clearly
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
