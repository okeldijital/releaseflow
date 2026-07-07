import {
  getDocs, addDoc,
  collection, query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { MediaReview, MediaComment, ReviewDecision } from './media-types';

const REVIEWS_COLLECTION = 'media_reviews';
const COMMENTS_COLLECTION = 'media_comments';

/* ─── Reviews ─────────────────────────────────────────────────────────── */

export async function createMediaReview(
  fields: Omit<MediaReview, 'id' | 'createdAt'>,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, REVIEWS_COLLECTION), {
    ...fields,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getReviewsByAsset(assetId: string): Promise<MediaReview[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, REVIEWS_COLLECTION), where('assetId', '==', assetId), orderBy('createdAt', 'desc')),
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

export async function getReviewsByVersion(versionId: string): Promise<MediaReview[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, REVIEWS_COLLECTION), where('versionId', '==', versionId), orderBy('createdAt', 'desc')),
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
  fields: Omit<MediaComment, 'id' | 'createdAt'>,
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, COMMENTS_COLLECTION), {
    ...fields,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getCommentsByAsset(assetId: string): Promise<MediaComment[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, COMMENTS_COLLECTION), where('assetId', '==', assetId), orderBy('createdAt', 'asc')),
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
