/**
 * BUILD-302B / BUILD-302C — UI-facing submission orchestration.
 *
 * 1. Persist feedback via BUILD-302A submitFeedback
 * 2. Trigger server-side email delivery (BUILD-302C)
 *
 * Distinguishes persistence failure from saved+email-failed.
 * No Firestore, no email provider credentials in the client.
 */

import { resolveFeedbackContext, type FeedbackEntityHints } from './feedback-context-resolver';
import { submitFeedback } from './feedback-service';
import {
  triggerFeedbackEmailDelivery,
  type TriggerFeedbackEmailResult,
} from './trigger-feedback-email';
import type {
  EmailDeliveryStatus,
  Feedback,
  FeedbackAuthContext,
  FeedbackContext,
} from './feedback-types';

export type FeedbackSubmitResult =
  | {
      ok: true;
      feedback: Feedback;
      /** Final delivery status after the delivery attempt. */
      emailDeliveryStatus: EmailDeliveryStatus;
      /** True when feedback was saved but notification failed. */
      emailFailed: boolean;
    }
  | {
      ok: false;
      error: string;
      /** Persistence never completed. */
      phase: 'validation' | 'persistence';
    };

export function isFeedbackMessageReady(message: string): boolean {
  return typeof message === 'string' && message.trim().length > 0;
}

/**
 * Resolve context, persist feedback, then attempt email delivery.
 * Callers must guard against duplicate invocation while a request is in flight.
 */
export async function sendFeedbackFromUi(input: {
  message: string;
  pathname: string;
  auth: FeedbackAuthContext;
  entityHints?: FeedbackEntityHints;
  /** Injected for tests; defaults to BUILD-302A submitFeedback. */
  submit?: typeof submitFeedback;
  /** Injected for tests; defaults to resolveFeedbackContext. */
  resolve?: typeof resolveFeedbackContext;
  /** Injected for tests; defaults to triggerFeedbackEmailDelivery. */
  deliverEmail?: typeof triggerFeedbackEmailDelivery;
}): Promise<FeedbackSubmitResult> {
  if (!isFeedbackMessageReady(input.message)) {
    return {
      ok: false,
      error: 'Feedback message is required',
      phase: 'validation',
    };
  }

  const resolve = input.resolve ?? resolveFeedbackContext;
  const submit = input.submit ?? submitFeedback;
  const deliverEmail = input.deliverEmail ?? triggerFeedbackEmailDelivery;

  const context: FeedbackContext = resolve(input.pathname, input.entityHints);

  let feedback: Feedback;
  try {
    feedback = await submit(
      { message: input.message, context },
      input.auth,
    );
  } catch (err) {
    const error =
      err instanceof Error && err.message
        ? err.message
        : 'Unable to send feedback. Please try again.';
    return { ok: false, error, phase: 'persistence' };
  }

  // Persistence succeeded (emailDeliveryStatus starts pending on the record).
  // Email failure must not be reported as total failure.
  let delivery: TriggerFeedbackEmailResult;
  try {
    delivery = await deliverEmail(feedback.id);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    delivery = { emailDeliveryStatus: 'failed', error };
  }

  const emailDeliveryStatus: EmailDeliveryStatus =
    delivery.emailDeliveryStatus === 'sent' ? 'sent' : 'failed';

  return {
    ok: true,
    feedback: {
      ...feedback,
      emailDeliveryStatus,
    },
    emailDeliveryStatus,
    emailFailed: emailDeliveryStatus !== 'sent',
  };
}
