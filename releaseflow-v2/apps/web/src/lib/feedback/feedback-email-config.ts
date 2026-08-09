/**
 * BUILD-302C — Server-side feedback email configuration.
 *
 * Destination is never exposed to the client (no NEXT_PUBLIC_*).
 */

/** Server-only env: dedicated feedback notification inbox. */
export const FEEDBACK_NOTIFICATION_EMAIL_ENV = 'FEEDBACK_NOTIFICATION_EMAIL';

export function getFeedbackNotificationEmail(): string | null {
  const value = process.env.FEEDBACK_NOTIFICATION_EMAIL?.trim();
  return value || null;
}

export function requireFeedbackNotificationEmail(): string {
  const email = getFeedbackNotificationEmail();
  if (!email) {
    throw new Error(
      `${FEEDBACK_NOTIFICATION_EMAIL_ENV} is not configured`,
    );
  }
  return email;
}
