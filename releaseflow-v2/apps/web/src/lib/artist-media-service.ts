import { updateDoc, doc, addDoc, collection, Timestamp } from '@firebase/firestore';
import { getDb } from './firebase';
import { uploadFile, generateThumbnailUrl, validateMediaFile, getImageDimensions } from './media/media-upload';
import { cloudinaryConfig } from '@releaseflow/firebase/cloudinary';

export interface ArtistImageUploadResult {
  publicId: string;
  imageUrl: string;
  thumbnailUrl: string;
}

async function recordImageUsage(
  organizationId: string,
  artistId: string,
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
    contextType: 'artist',
    contextId: artistId,
    contextLabel: 'Artist Profile Image',
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

export async function uploadArtistImage(
  organizationId: string,
  artistId: string,
  file: File,
  actorId: string,
): Promise<ArtistImageUploadResult> {
  const errors = validateMediaFile(file);
  if (errors.length > 0) throw new Error(errors[0]?.message ?? 'Invalid file');

  const dimensions = await getImageDimensions(file);
  const result = await uploadFile(file, {
    folder: cloudinaryConfig.folders.avatars,
    tags: ['artist', `org:${organizationId}`, `artist:${artistId}`],
  });
  if (!result) throw new Error('Image upload failed');

  const imageUrl = result.secureUrl;
  const publicId = result.publicId;
  const thumbnailUrl = generateThumbnailUrl(publicId);

  const db = getDb();
  if (db) {
    await updateDoc(doc(db, 'organizations', organizationId, 'artists', artistId), {
      imageUrl,
      imagePublicId: publicId,
      updatedAt: Timestamp.now(),
    });

    await recordImageUsage(organizationId, artistId, publicId, thumbnailUrl, file.type, file.size, dimensions, actorId);
  }

  return { publicId, imageUrl, thumbnailUrl };
}

export async function replaceArtistImage(
  organizationId: string,
  artistId: string,
  file: File,
  actorId: string,
): Promise<ArtistImageUploadResult> {
  return uploadArtistImage(organizationId, artistId, file, actorId);
}

export async function removeArtistImage(
  organizationId: string,
  artistId: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  await updateDoc(doc(db, 'organizations', organizationId, 'artists', artistId), {
    imageUrl: null,
    imagePublicId: null,
    updatedAt: Timestamp.now(),
  });
}
