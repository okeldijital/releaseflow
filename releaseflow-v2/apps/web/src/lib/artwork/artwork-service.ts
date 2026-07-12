import { hasPermission } from '@/lib/auth/authorization-service';
import { getAuthInstance } from '@/lib/firebase';
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
): Promise<Artwork> {
  if (!(await hasPermission(organizationId, userId, 'artwork.upload'))) {
    throw new Error('You do not have permission to upload artwork for this organization.');
  }

  const uploadResult = await uploadArtworkFile(file, {
    entityType: 'artwork',
    entityId: releaseId,
    organizationId,
  });

  let artwork: Artwork;
  try {
    artwork = await createArtwork({
      organizationId,
      releaseId,
      publicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    });
  } catch (err) {
    // Firestore write failed — clean up the Cloudinary image
    await attemptDestroyCloudinaryImage(uploadResult.publicId, organizationId);
    throw new Error(
      err instanceof Error ? err.message : 'Failed to persist artwork metadata',
      err instanceof Error ? { cause: err } : undefined,
    );
  }

  return artwork;
}

async function attemptDestroyCloudinaryImage(publicId: string, organizationId: string): Promise<void> {
  try {
    const currentUser = getAuthInstance()?.currentUser;
    if (!currentUser) return;
    const idToken = await currentUser.getIdToken();
    await fetch('/api/artwork/destroy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ publicId, organizationId }),
    });
  } catch {
    // Best-effort cleanup — do not throw
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

    const currentUser = getAuthInstance()?.currentUser;
    if (!currentUser) return { error: 'You must be signed in to delete artwork.' };
    const idToken = await currentUser.getIdToken();
    const destroyRes = await fetch('/api/artwork/destroy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
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
