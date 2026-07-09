import {
  getDocs, addDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { MediaReview, MediaComment, ReviewDecision } from './media-types';

/**
 * organizations/{orgId}/media_reviews/{reviewId}
 * organizations/{orgId}/media_comments/{commentId}
 */
const REVIEWS_SUBCOLLECTION = 'media_reviews';
const COMMENTS_SUBCOLLECTION = 'media_comments';

function reviewsCol(db: NonNullable<ReturnType<typeof getDb>>, organizationId: string) {
  return collection(db, 'organizations', organizationId, REVIEWS_SUBCOLLECTION);
}

function commentsCol(db: NonNullable<ReturnType<typeof getDb>>, organizationId: string) {
  return collection(db, 'organizations', organizationId, COMMENTS_SUBCOLLECTION);
}

/* ─── Reviews ─────────────────────────────────────────────────────────── */

export async function createMediaReview(
  organizationId: string,
  fields: Omit<MediaReview, 'id' | 'createdAt'>,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(reviewsCol(db, organizationId), {
    ...fields,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getReviewsByAsset(organizationId: string, assetId: string): Promise<MediaReview[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(reviewsCol(db, organizationId), where('assetId', '==', assetId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      assetId: data.assetId as string,
      versionId: data.versionId as string,
      reviewerId: data.reviewerId as string,
      decision: data.decision as ReviewDecision,
      comments: data.comments as string | undefined,
      createdAt: data.createdAt as Timestamp,
    };
  });
}

export async function getReviewsByVersion(organizationId: string, versionId: string): Promise<MediaReview[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(reviewsCol(db, organizationId), where('versionId', '==', versionId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      assetId: data.assetId as string,
      versionId: data.versionId as string,
      reviewerId: data.reviewerId as string,
      decision: data.decision as ReviewDecision,
      comments: data.comments as string | undefined,
      createdAt: data.createdAt as Timestamp,
    };
  });
}

/* ─── Comments ────────────────────────────────────────────────────────── */

export async function createMediaComment(
  organizationId: string,
  fields: Omit<MediaComment, 'id' | 'createdAt'>,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(commentsCol(db, organizationId), {
    ...fields,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getCommentsByAsset(organizationId: string, assetId: string): Promise<MediaComment[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(commentsCol(db, organizationId), where('assetId', '==', assetId), orderBy('createdAt', 'asc')),
  );
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      assetId: data.assetId as string,
      versionId: data.versionId as string,
      authorId: data.authorId as string,
      text: data.text as string,
      createdAt: data.createdAt as Timestamp,
    };
  });
}
