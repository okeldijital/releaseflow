/**
 * NOT-002 — Fire-and-forget trigger for the email worker API.
 * Safe to call from the browser after processPendingEvents.
 * Failures never block inbox delivery.
 */

import { getAuthInstance } from '@/lib/firebase';

export async function triggerEmailWorker(limit = 25): Promise<void> {
  try {
    const auth = getAuthInstance();
    const user = auth?.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch('/api/notifications/process-email-queue', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[email-worker] trigger failed', res.status, text.slice(0, 200));
      return;
    }
    const json = await res.json().catch(() => null);
    console.log('[email-worker] batch result', json);
  } catch (err) {
    console.warn('[email-worker] trigger error', err);
  }
}
