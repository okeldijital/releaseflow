/**
 * BUILD-302A / BUILD-302B — Feedback infrastructure public surface.
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

export {
  formatFeedbackContextDisplay,
  type FeedbackContextDisplay,
} from './feedback-context-display';

export {
  isFeedbackMessageReady,
  sendFeedbackFromUi,
  type FeedbackSubmitResult,
} from './feedback-submission';

export {
  buildFeedbackEmailSubject,
  type FeedbackSubjectEntityTitles,
} from './feedback-email-subject';

export {
  escapeHtml,
  buildFeedbackContextLines,
  renderFeedbackEmailHtml,
  renderFeedbackEmailText,
  formatFeedbackEmailTimestamp,
  type FeedbackEmailIdentity,
  type FeedbackEmailRenderInput,
} from './feedback-email-template';

export {
  FEEDBACK_NOTIFICATION_EMAIL_ENV,
  getFeedbackNotificationEmail,
  requireFeedbackNotificationEmail,
} from './feedback-email-config';

export {
  triggerFeedbackEmailDelivery,
  type TriggerFeedbackEmailResult,
} from './trigger-feedback-email';
