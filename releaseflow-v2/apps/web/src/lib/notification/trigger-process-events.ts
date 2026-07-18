/**
 * BUG-005 — Trigger server-side notification processor after domain events.
 * Prefer Admin fan-out over client processor (Firestore rules safe).
 */

import { getAuthInstance } from '@/lib/firebase';

export async function triggerProcessEvents(
  organizationId: string,
  maxEvents = 40,
): Promise<{ ok: boolean; created?: number; emails?: number; error?: string }> {
  try {
    const auth = getAuthInstance();
    const user = auth?.currentUser;
    if (!user || !organizationId) {
      return { ok: false, error: 'not_authenticated' };
    }
    const idToken = await user.getIdToken();
    const res = await fetch('/api/notifications/process-events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ organizationId, maxEvents }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[trigger-process-events] failed', res.status, text.slice(0, 300));
      return { ok: false, error: text.slice(0, 200) };
    }
    const json = (await res.json()) as {
      created?: number;
      emails?: number;
      processed?: number;
    };
    console.log('[trigger-process-events] ok', json);
    return {
      ok: true,
      created: json.created,
      emails: json.emails,
    };
  } catch (err) {
    console.error('[trigger-process-events]', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
