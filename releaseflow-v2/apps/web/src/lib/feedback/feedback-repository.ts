/**
 * BUILD-302A — Feedback repository (create-only).
 *
 * Follows existing top-level collection + Timestamp.now() conventions.
 * No list/get/update/delete — management UI is out of scope.
 */

import {
  addDoc,
  collection,
  Timestamp,
  type Timestamp as TimestampType,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { compactFeedbackContext } from './feedback-context-resolver';
import type {
  CreateFeedbackFields,
  EmailDeliveryStatus,
  Feedback,
  FeedbackContext,
} from './feedback-types';

export const FEEDBACK_COLLECTION = 'feedback';

function toRecord(
  id: string,
  data: Record<string, unknown>,
): Feedback {
  const organisationId =
    (data.organisationId as string)
    || (data.organizationId as string)
    || '';

  const rawContext = (data.context as FeedbackContext) || {
    route: '/',
    module: 'unknown',
    page: 'unknown',
  };

  return {
    id,
    organisationId,
    userId: (data.userId as string) || '',
    message: (data.message as string) || '',
    context: compactFeedbackContext(rawContext),
    createdAt: data.createdAt as TimestampType,
    emailDeliveryStatus:
      (data.emailDeliveryStatus as EmailDeliveryStatus) || 'pending',
  };
}

/**
 * Persist a feedback record. Generates document id via Firestore.
 * createdAt is always Timestamp.now() — never client-supplied.
 * emailDeliveryStatus defaults to pending.
 */
export async function createFeedback(
  fields: CreateFeedbackFields,
): Promise<Feedback> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Timestamp.now();
  const emailDeliveryStatus: EmailDeliveryStatus =
    fields.emailDeliveryStatus ?? 'pending';
  const context = compactFeedbackContext(fields.context);

  // Dual-write organisationId (domain/EPIC) + organizationId (rules helpers).
  const data = {
    organisationId: fields.organisationId,
    organizationId: fields.organisationId,
    userId: fields.userId,
    message: fields.message,
    context,
    createdAt: now,
    emailDeliveryStatus,
  };

  const ref = await addDoc(collection(db, FEEDBACK_COLLECTION), data);
  return toRecord(ref.id, { ...data, id: ref.id });
}
