/**
 * BUILD-302A — Feedback application service.
 *
 * Single submission entry point. Derives identity, tenant, timestamp, and
 * emailDeliveryStatus from authenticated application context.
 * Callers supply only message + application-generated context.
 */

import { compactFeedbackContext } from './feedback-context-resolver';
import { createFeedback } from './feedback-repository';
import type {
  Feedback,
  FeedbackAuthContext,
  FeedbackContext,
  SubmitFeedbackInput,
} from './feedback-types';

export type {
  EmailDeliveryStatus,
  Feedback,
  FeedbackAuthContext,
  FeedbackContext,
  SubmitFeedbackInput,
} from './feedback-types';

export { resolveFeedbackContext, compactFeedbackContext } from './feedback-context-resolver';
export type { FeedbackEntityHints } from './feedback-context-resolver';

/**
 * Long-form free-text ceiling aligned with generous comment-style input.
 * Not a short UX limit — only guards against pathological payloads.
 */
export const FEEDBACK_MESSAGE_MAX_LENGTH = 20_000;

function assertAuthContext(auth: FeedbackAuthContext): void {
  if (!auth?.userId || typeof auth.userId !== 'string' || !auth.userId.trim()) {
    throw new Error('Authenticated user is required');
  }
  if (
    !auth?.organisationId
    || typeof auth.organisationId !== 'string'
    || !auth.organisationId.trim()
  ) {
    throw new Error('Active organisation is required');
  }
}

function validateAndTrimMessage(message: unknown): string {
  if (typeof message !== 'string') {
    throw new Error('Feedback message must be a string');
  }
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Feedback message is required');
  }
  if (trimmed.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    throw new Error(
      `Feedback message must be at most ${FEEDBACK_MESSAGE_MAX_LENGTH} characters`,
    );
  }
  return trimmed;
}

function validateContext(context: unknown): FeedbackContext {
  if (!context || typeof context !== 'object') {
    throw new Error('Feedback context is required');
  }
  const c = context as FeedbackContext;
  if (typeof c.route !== 'string' || !c.route.trim()) {
    throw new Error('Feedback context.route is required');
  }
  if (typeof c.module !== 'string' || !c.module.trim()) {
    throw new Error('Feedback context.module is required');
  }
  if (typeof c.page !== 'string' || !c.page.trim()) {
    throw new Error('Feedback context.page is required');
  }
  return compactFeedbackContext({
    route: c.route.trim(),
    module: c.module.trim(),
    page: c.page.trim(),
    releaseId: typeof c.releaseId === 'string' ? c.releaseId : undefined,
    trackId: typeof c.trackId === 'string' ? c.trackId : undefined,
    artistId: typeof c.artistId === 'string' ? c.artistId : undefined,
    personId: typeof c.personId === 'string' ? c.personId : undefined,
    assignmentId: typeof c.assignmentId === 'string' ? c.assignmentId : undefined,
    taskId: typeof c.taskId === 'string' ? c.taskId : undefined,
    assetId: typeof c.assetId === 'string' ? c.assetId : undefined,
  });
}

/**
 * Submit feedback for the authenticated user in their active organisation.
 *
 * - Trims and validates message.
 * - Uses auth.userId / auth.organisationId exclusively (ignores any extra
 *   identity fields on the input object).
 * - Sets emailDeliveryStatus = pending (no email send in BUILD-302A).
 * - Generates createdAt via repository Timestamp.now().
 */
export async function submitFeedback(
  input: SubmitFeedbackInput,
  auth: FeedbackAuthContext,
): Promise<Feedback> {
  assertAuthContext(auth);

  // Only message + context are trusted from the submission payload.
  // Identity fields on a looser input object are intentionally ignored.
  const message = validateAndTrimMessage(input?.message);
  const context = validateContext(input?.context);

  return createFeedback({
    organisationId: auth.organisationId.trim(),
    userId: auth.userId.trim(),
    message,
    context,
    emailDeliveryStatus: 'pending',
  });
}
