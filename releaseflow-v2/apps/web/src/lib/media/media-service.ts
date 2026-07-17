import {
  createMediaAsset,
  updateMediaAsset,
  getMediaAsset,
  deleteMediaAsset,
} from './media-repository';
import {
  createMediaVersion,
  getVersionsByAsset,
  getMediaVersion,
} from './media-version-repository';
import {
  createMediaReview,
  getReviewsByAsset,
} from './media-review-repository';
import {
  getUsageByAsset,
  trackMediaUsage,
} from './media-usage-repository';
import { uploadFile, getImageDimensions, generateThumbnailUrl } from './media-upload';
import { upsertArtworkDeliverable } from '@/lib/deliverable-service';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import type { MediaAsset, MediaVersion, MediaReview, MediaUsage } from './media-types';

export async function uploadReleaseArtwork(
  file: File,
  releaseId: string,
  organizationId: string,
  userId: string,
  notes?: string,
):   Promise<{ assetId: string; versionId: string; deliverableId: string } | { error: string }> {
  try {
    if (!(await AuthorizationService.canAsync('media.upload', organizationId, userId))) {
      return { error: 'You do not have permission to upload media for this organization.' };
    }

    const dimensions = await getImageDimensions(file);
    if (dimensions && (dimensions.width < 1400 || dimensions.height < 1400)) {
      return { error: `Image dimensions too small. Minimum 1400x1400px (got ${dimensions.width}x${dimensions.height})` };
    }

    const result = await uploadFile(file, {
      entityType: 'release',
      entityId: releaseId,
      organizationId,
      tags: [`release:${releaseId}`, `org:${organizationId}`],
    });

    const storageKey = result.publicId;
    const thumbnailUrl = generateThumbnailUrl(result.publicId);

    const assetId = await createMediaAsset({
      organizationId,
      releaseId,
      assetType: 'cover',
      title: file.name,
      storageKey,
      secureUrl: result.secureUrl,
      thumbnailUrl,
      mimeType: file.type,
      fileSize: result.bytes,
      dimensions: dimensions ?? undefined,
      status: 'draft',
      createdBy: userId,
    });

    const versionId = await createMediaVersion(organizationId, {
      assetId,
      versionNumber: 1,
      storageKey,
      thumbnailUrl,
      mimeType: file.type,
      fileSize: result.bytes,
      dimensions: dimensions ?? undefined,
      notes,
      uploadedBy: userId,
    });

    await trackMediaUsage(organizationId, {
      assetId,
      contextType: 'release',
      contextId: releaseId,
      contextLabel: 'Release Artwork',
      organizationId,
    });

    const deliverableId = await upsertArtworkDeliverable(releaseId, userId, userId, {
      title: file.name,
      mediaAssetId: assetId,
      url: result.secureUrl,
    });

    await updateMediaAsset(organizationId, assetId, { currentVersionId: versionId });

    return { assetId, versionId, deliverableId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

export async function replaceReleaseArtwork(
  organizationId: string,
  assetId: string,
  file: File,
  userId: string,
  notes?: string,
):   Promise<{ versionId: string } | { error: string }> {
  try {
    if (!(await AuthorizationService.canAsync('media.replace', organizationId, userId))) {
      return { error: 'You do not have permission to replace this media asset.' };
    }

    const asset = await getMediaAsset(organizationId, assetId);
    if (!asset) return { error: 'Asset not found' };

    const dimensions = await getImageDimensions(file);
    if (dimensions && (dimensions.width < 1400 || dimensions.height < 1400)) {
      return { error: `Image dimensions too small. Minimum 1400x1400px (got ${dimensions.width}x${dimensions.height})` };
    }

    const result = await uploadFile(file, {
      entityType: 'release',
      entityId: asset.releaseId,
      organizationId: asset.organizationId,
      tags: [`release:${asset.releaseId}`, `org:${asset.organizationId}`],
    });

    const versions = await getVersionsByAsset(organizationId, assetId);
    const maxVersion = versions.reduce((max, v) => Math.max(max, v.versionNumber), 0);

    const storageKey = result.publicId;
    const thumbnailUrl = generateThumbnailUrl(result.publicId);

    const versionId = await createMediaVersion(organizationId, {
      assetId,
      versionNumber: maxVersion + 1,
      storageKey,
      thumbnailUrl,
      mimeType: file.type,
      fileSize: result.bytes,
      dimensions: dimensions ?? undefined,
      notes,
      uploadedBy: userId,
    });

    await updateMediaAsset(organizationId, assetId, {
      currentVersionId: versionId,
      storageKey,
      secureUrl: result.secureUrl,
      thumbnailUrl,
      mimeType: file.type,
      fileSize: result.bytes,
      dimensions: dimensions ?? undefined,
      status: 'draft',
    });

    await upsertArtworkDeliverable(asset.releaseId, userId, userId, {
      title: file.name,
      mediaAssetId: assetId,
      url: result.secureUrl,
    });

    return { versionId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Replace failed' };
  }
}

export async function approveAsset(
  organizationId: string,
  assetId: string,
  versionId: string,
  reviewerId: string,
  comments?: string,
): Promise<{ reviewId: string } | { error: string }> {
  try {
    if (!(await AuthorizationService.canAsync('media.approve', organizationId, reviewerId))) {
      return { error: 'You do not have permission to approve this media asset.' };
    }

    const asset = await getMediaAsset(organizationId, assetId);
    if (!asset) return { error: 'Asset not found' };

    const reviewId = await createMediaReview(organizationId, {
      assetId,
      versionId,
      reviewerId,
      decision: 'approved',
      comments,
    });

    await updateMediaAsset(organizationId, assetId, { status: 'approved' });

    return { reviewId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Approval failed' };
  }
}

export async function rejectAsset(
  organizationId: string,
  assetId: string,
  versionId: string,
  reviewerId: string,
  comments?: string,
): Promise<{ reviewId: string } | { error: string }> {
  try {
    if (!(await AuthorizationService.canAsync('media.approve', organizationId, reviewerId))) {
      return { error: 'You do not have permission to reject this media asset.' };
    }

    const asset = await getMediaAsset(organizationId, assetId);
    if (!asset) return { error: 'Asset not found' };

    const reviewId = await createMediaReview(organizationId, {
      assetId,
      versionId,
      reviewerId,
      decision: 'rejected',
      comments,
    });

    await updateMediaAsset(organizationId, assetId, { status: 'rejected' });

    return { reviewId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Rejection failed' };
  }
}

export async function requestChanges(
  organizationId: string,
  assetId: string,
  versionId: string,
  reviewerId: string,
  comments?: string,
): Promise<{ reviewId: string } | { error: string }> {
  try {
    if (!(await AuthorizationService.canAsync('media.review', organizationId, reviewerId))) {
      return { error: 'You do not have permission to review this media asset.' };
    }

    const asset = await getMediaAsset(organizationId, assetId);
    if (!asset) return { error: 'Asset not found' };

    const reviewId = await createMediaReview(organizationId, {
      assetId,
      versionId,
      reviewerId,
      decision: 'changes_requested',
      comments,
    });

    await updateMediaAsset(organizationId, assetId, { status: 'changes_requested' });

    return { reviewId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Request changes failed' };
  }
}

export async function restoreVersion(
  organizationId: string,
  assetId: string,
  versionId: string,
  _userId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    if (!(await AuthorizationService.canAsync('media.restore', organizationId, _userId))) {
      return { error: 'You do not have permission to restore this media asset.' };
    }

    const asset = await getMediaAsset(organizationId, assetId);
    if (!asset) return { error: 'Asset not found' };

    const version = await getMediaVersion(organizationId, versionId);
    if (!version || version.assetId !== assetId) return { error: 'Version not found' };

    await updateMediaAsset(organizationId, assetId, {
      currentVersionId: versionId,
      storageKey: version.storageKey,
      thumbnailUrl: version.thumbnailUrl,
      mimeType: version.mimeType,
      fileSize: version.fileSize,
      dimensions: version.dimensions,
      status: 'draft',
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Restore failed' };
  }
}

export async function deleteAssetWithCheck(
  organizationId: string,
  assetId: string,
  actorId?: string,
): Promise<{ success: true } | { error: string; usage?: MediaUsage[] }> {
  try {
    if (actorId && !(await AuthorizationService.canAsync('media.delete', organizationId, actorId))) {
      return { error: 'You do not have permission to delete this media asset.' };
    }

    const usage = await getUsageByAsset(organizationId, assetId);
    if (usage.length > 0) {
      return { error: 'Asset is in use and cannot be deleted', usage };
    }

    await deleteMediaAsset(organizationId, assetId, actorId);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Delete failed' };
  }
}

export interface AssetWithDetails {
  asset: MediaAsset;
  versions: MediaVersion[];
  reviews: MediaReview[];
  usage: MediaUsage[];
}

export async function getAssetWithDetails(
  organizationId: string,
  assetId: string,
): Promise<AssetWithDetails | null> {
  try {
    const [asset, versions, reviews, usage] = await Promise.all([
      getMediaAsset(organizationId, assetId),
      getVersionsByAsset(organizationId, assetId),
      getReviewsByAsset(organizationId, assetId),
      getUsageByAsset(organizationId, assetId),
    ]);

    if (!asset) return null;

    return { asset, versions, reviews, usage };
  } catch {
    return null;
  }
}
