import { hasPermission } from '@/lib/auth/authorization-service';
import { uploadArtworkFile } from './artwork-upload';
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
): Promise<{ artworkId: string } | { error: string }> {
  try {
    if (!(await hasPermission(organizationId, userId, 'artwork.upload'))) {
      return { error: 'You do not have permission to upload artwork for this organization.' };
    }

    const result = await uploadArtworkFile(file, {
      entityType: 'artwork',
      entityId: releaseId,
      organizationId,
    });

    console.log('[BUILD-035] About to create Firestore artwork', {
      organizationId,
      releaseId,
      publicId: result.publicId,
      secureUrl: result.secureUrl,
    });
    let artworkId: string;
    try {
      artworkId = await createArtwork({
        organizationId,
        releaseId,
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        createdBy: userId,
      });
    } catch (error) {
      console.error('[BUILD-035] createArtwork failed', error);
      throw error;
    }
    console.log('[BUILD-035] Firestore artwork created', { artworkId });

    return { artworkId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

export async function replaceArtwork(
  artworkId: string,
  file: File,
  organizationId: string,
  userId: string,
): Promise<{ artworkId: string } | { error: string }> {
  try {
    if (!(await hasPermission(organizationId, userId, 'artwork.replace'))) {
      return { error: 'You do not have permission to replace this artwork.' };
    }

    const existing = await getArtwork(organizationId, artworkId);
    if (!existing) return { error: 'Artwork not found' };

    const result = await uploadArtworkFile(file, {
      entityType: 'artwork',
      entityId: existing.releaseId,
      organizationId,
    });

    await updateArtwork(organizationId, artworkId, {
      publicId: result.publicId,
      secureUrl: result.secureUrl,
    });

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
    if (!(await hasPermission(organizationId, userId, 'artwork.delete'))) {
      return { error: 'You do not have permission to delete artwork.' };
    }

    const existing = await getArtwork(organizationId, artworkId);
    if (!existing) return { error: 'Artwork not found' };

    const destroyRes = await fetch('/api/artwork/destroy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publicId: existing.publicId,
        organizationId,
      }),
    });

    if (!destroyRes.ok) {
      const data = await destroyRes.json().catch(() => ({}));
      return { error: data?.error ?? 'Failed to delete artwork from storage.' };
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
