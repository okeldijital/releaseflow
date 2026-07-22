/**
 * BUILD-014D — Artwork uses canonical media upload/destroy only.
 * No Cloudinary-specific helpers in this module.
 */
import { AuthorizationService } from '@/lib/auth/authorization-service';
import { uploadFile, destroyFile, attemptDestroyFile } from '@/lib/media/media-upload';
import {
  createArtwork,
  updateArtwork,
  deleteArtwork,
  getArtworksByRelease,
  getArtwork,
} from './artwork-repository';
import type { Artwork } from './artwork-types';

export async function uploadArtwork(
  file: File,
  releaseId: string,
  organizationId: string,
  userId: string,
): Promise<Artwork> {
  if (!(await AuthorizationService.canAsync('artwork.upload', organizationId, userId))) {
    throw new Error('You do not have permission to upload artwork for this organization.');
  }

  const uploadResult = await uploadFile(file, {
    entityType: 'artwork',
    entityId: releaseId,
    organizationId,
    tags: [`release:${releaseId}`, `org:${organizationId}`],
  });

  let artwork: Artwork;
  try {
    artwork = await createArtwork({
      organizationId,
      releaseId,
      publicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      width: uploadResult.width ?? 0,
      height: uploadResult.height ?? 0,
      format: uploadResult.format,
    });
  } catch (err) {
    await attemptDestroyFile({
      publicId: uploadResult.publicId,
      organizationId,
      entityType: 'artwork',
    });
    throw new Error(
      err instanceof Error ? err.message : 'Failed to persist artwork metadata',
      err instanceof Error ? { cause: err } : undefined,
    );
  }

  return artwork;
}

export async function replaceArtwork(
  artworkId: string,
  file: File,
  organizationId: string,
  userId: string,
): Promise<{ artworkId: string } | { error: string }> {
  try {
    if (!(await AuthorizationService.canAsync('artwork.replace', organizationId, userId))) {
      return { error: 'You do not have permission to replace this artwork.' };
    }

    const existing = await getArtwork(organizationId, artworkId);
    if (!existing) return { error: 'Artwork not found' };

    const result = await uploadFile(file, {
      entityType: 'artwork',
      entityId: existing.releaseId,
      organizationId,
      tags: [`release:${existing.releaseId}`, `org:${organizationId}`],
    });

    await updateArtwork(organizationId, artworkId, {
      publicId: result.publicId,
      secureUrl: result.secureUrl,
    });

    // Best-effort remove previous asset
    if (existing.publicId && existing.publicId !== result.publicId) {
      await attemptDestroyFile({
        publicId: existing.publicId,
        organizationId,
        entityType: 'artwork',
      });
    }

    return { artworkId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Replace failed' };
  }
}

export async function removeArtwork(
  artworkId: string,
  organizationId: string,
  userId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    if (!(await AuthorizationService.canAsync('artwork.delete', organizationId, userId))) {
      return { error: 'You do not have permission to delete artwork.' };
    }

    const existing = await getArtwork(organizationId, artworkId);
    if (!existing) return { error: 'Artwork not found' };

    try {
      await destroyFile({
        publicId: existing.publicId,
        organizationId,
        entityType: 'artwork',
      });
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Failed to delete artwork from storage.',
      };
    }

    await deleteArtwork(organizationId, artworkId);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Delete failed' };
  }
}

export async function getArtworkByRelease(
  organizationId: string,
  releaseId: string,
): Promise<Artwork | null> {
  const artworks = await getArtworksByRelease(organizationId, releaseId);
  return artworks[0] ?? null;
}
