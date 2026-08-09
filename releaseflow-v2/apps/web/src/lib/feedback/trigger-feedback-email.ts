/**
 * BUILD-302C — Client trigger for server-side feedback email delivery.
 *
 * Fire after successful persistence. Never sends email or holds secrets.
 */

import { getAuthInstance } from '@/lib/firebase';
import type { EmailDeliveryStatus } from './feedback-types';

export interface TriggerFeedbackEmailResult {
  emailDeliveryStatus: EmailDeliveryStatus;
  error?: string;
  skipped?: boolean;
}

/**
 * Ask the server to deliver the feedback notification email.
 * Returns delivery outcome without exposing destination or provider errors details beyond status.
 */
export async function triggerFeedbackEmailDelivery(
  feedbackId: string,
  opts?: { retry?: boolean },
): Promise<TriggerFeedbackEmailResult> {
  try {
    const auth = getAuthInstance();
    const user = auth?.currentUser;
    if (!user) {
      return {
        emailDeliveryStatus: 'failed',
        error: 'Not authenticated',
      };
    }

    const idToken = await user.getIdToken();
    const res = await fetch('/api/feedback/deliver-email', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedbackId,
        retry: opts?.retry === true,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      emailDeliveryStatus?: EmailDeliveryStatus;
      error?: string;
      skipped?: boolean;
    };

    if (!res.ok) {
      return {
        emailDeliveryStatus: 'failed',
        error: json.error || `Delivery request failed (${res.status})`,
      };
    }

    const status = json.emailDeliveryStatus ?? (json.ok ? 'sent' : 'failed');
    return {
      emailDeliveryStatus: status,
      error: json.error,
      skipped: json.skipped,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.warn('[feedback-email] trigger error', error);
    return {
      emailDeliveryStatus: 'failed',
      error,
    };
  }
}
