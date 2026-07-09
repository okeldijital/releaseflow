import { updateDoc, doc, addDoc, collection, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';
import { uploadFile, generateThumbnailUrl, validateMediaFile, getImageDimensions } from './media/media-upload';

export interface PersonImageUploadResult {
  publicId: string;
  imageUrl: string;
  thumbnailUrl: string;
}

async function recordImageUsage(
  organizationId: string,
  personId: string,
  publicId: string,
  thumbnailUrl: string,
  mimeType: string,
  fileSize: number,
  dimensions: { width: number; height: number } | null,
  actorId: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await addDoc(collection(db, 'media_usage'), {
    assetId: publicId,
    contextType: 'person',
    contextId: personId,
    contextLabel: 'Person Profile Image',
    storageKey: publicId,
    thumbnailUrl,
    mimeType,
    fileSize,
    dimensions: dimensions ?? null,
    createdBy: actorId,
    organizationId,
    createdAt: Timestamp.now(),
  });
}

export async function uploadPersonImage(
  organizationId: string,
  personId: string,
  file: File,
  actorId: string,
): Promise<PersonImageUploadResult> {
  const errors = validateMediaFile(file);
  if (errors.length > 0) throw new Error(errors[0]?.message ?? 'Invalid file');

  const dimensions = await getImageDimensions(file);
  const result = await uploadFile(file, {
    entityType: 'person',
    entityId: personId,
    organizationId,
    tags: ['person', `org:${organizationId}`, `person:${personId}`],
  });
  if (!result) throw new Error('Image upload failed');

  const imageUrl = result.secureUrl;
  const publicId = result.publicId;
  const thumbnailUrl = generateThumbnailUrl(publicId);

  const db = getDb();
  if (db) {
    await updateDoc(doc(db, 'people', personId), {
      avatarUrl: imageUrl,
      avatarPublicId: publicId,
      updatedAt: Timestamp.now(),
    });
    await recordImageUsage(organizationId, personId, publicId, thumbnailUrl, file.type, file.size, dimensions, actorId);
  }

  return { publicId, imageUrl, thumbnailUrl };
}

export async function replacePersonImage(
  organizationId: string,
  personId: string,
  file: File,
  actorId: string,
): Promise<PersonImageUploadResult> {
  return uploadPersonImage(organizationId, personId, file, actorId);
}

export async function removePersonImage(
  personId: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'people', personId), {
    avatarUrl: null,
    avatarPublicId: null,
    updatedAt: Timestamp.now(),
  });
}
