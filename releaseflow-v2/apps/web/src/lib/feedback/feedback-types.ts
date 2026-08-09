/**
 * BUILD-302A — Feedback domain model.
 *
 * Minimal persistence for EPIC-302. Not a ticket/support system.
 * Email delivery is tracked as state only; sending is BUILD-302C.
 */

import type { Timestamp } from '@firebase/firestore';

/** Email delivery lifecycle for a feedback record (no send in BUILD-302A). */
export type EmailDeliveryStatus = 'pending' | 'sent' | 'failed';

/**
 * Application-generated context for a feedback submission.
 * Optional entity IDs are omitted when not applicable (never null).
 */
export interface FeedbackContext {
  route: string;
  module: string;
  page: string;
  releaseId?: string;
  trackId?: string;
  artistId?: string;
  personId?: string;
  assignmentId?: string;
  taskId?: string;
  assetId?: string;
}

/**
 * First-class feedback domain record.
 * Identity fields are derived by the service, never trusted from the client form.
 */
export interface Feedback {
  id: string;
  organisationId: string;
  userId: string;
  message: string;
  context: FeedbackContext;
  createdAt: Timestamp;
  emailDeliveryStatus: EmailDeliveryStatus;
}

/** Client-supplied submission payload only. */
export interface SubmitFeedbackInput {
  message: string;
  context: FeedbackContext;
}

/**
 * Authenticated application session used to derive tenant + actor.
 * Must come from existing auth / active organisation context — not user form fields.
 */
export interface FeedbackAuthContext {
  userId: string;
  organisationId: string;
}

export interface CreateFeedbackFields {
  organisationId: string;
  userId: string;
  message: string;
  context: FeedbackContext;
  emailDeliveryStatus?: EmailDeliveryStatus;
}
