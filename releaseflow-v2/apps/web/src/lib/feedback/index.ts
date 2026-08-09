/**
 * BUILD-302A — Feedback infrastructure public surface.
 */

export type {
  CreateFeedbackFields,
  EmailDeliveryStatus,
  Feedback,
  FeedbackAuthContext,
  FeedbackContext,
  SubmitFeedbackInput,
} from './feedback-types';

export {
  compactFeedbackContext,
  resolveFeedbackContext,
  type FeedbackEntityHints,
} from './feedback-context-resolver';

export {
  createFeedback,
  FEEDBACK_COLLECTION,
} from './feedback-repository';

export {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  submitFeedback,
} from './feedback-service';
