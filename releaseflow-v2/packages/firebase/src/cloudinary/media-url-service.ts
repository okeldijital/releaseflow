/**
 * BUILD-014D — Canonical Media URL generation.
 * Safe for browser: uses public cloud name only (never cloudinaryConfig secrets).
 */
import { publicCloudinaryCloudName } from './public-config';
import type { TransformationOptions } from './types';

function deliveryBase(cloudName: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload`;
}

function transformString(options: TransformationOptions): string {
  const transformations: string[] = [];
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.effect) transformations.push(`e_${options.effect}`);
  return transformations.join(',');
}

export const MediaUrlService = {
  /** Raw original delivery URL. */
  original(publicId: string): string {
    const cloudName = publicCloudinaryCloudName();
    return `${deliveryBase(cloudName)}/${publicId}`;
  },

  /** Generic transform. */
  transform(publicId: string, options: TransformationOptions): string {
    const cloudName = publicCloudinaryCloudName();
    const t = transformString(options);
    if (!t) return `${deliveryBase(cloudName)}/${publicId}`;
    return `${deliveryBase(cloudName)}/${t}/${publicId}`;
  },

  /** Profile avatar square thumbnail (default 80px). */
  avatar(publicId: string, size = 80): string {
    return MediaUrlService.transform(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
    });
  },

  /** Artwork list/card thumbnail. */
  artworkThumbnail(publicId: string, size = 300): string {
    return MediaUrlService.transform(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
    });
  },

  /** Larger artwork display. */
  artworkLarge(publicId: string, size = 800): string {
    return MediaUrlService.transform(publicId, {
      width: size,
      height: size,
      crop: 'limit',
      quality: 'auto',
      format: 'auto',
    });
  },

  /** Artist / person image thumbnail. */
  artist(publicId: string, size = 300): string {
    return MediaUrlService.artworkThumbnail(publicId, size);
  },

  /** Alias for original. */
  artwork(publicId: string): string {
    return MediaUrlService.original(publicId);
  },
};

// Back-compat thin wrappers (feature code may still import these names)
export function getAssetUrl(publicId: string): string {
  return MediaUrlService.original(publicId);
}

export function transformImage(
  publicId: string,
  options: TransformationOptions,
): string {
  return MediaUrlService.transform(publicId, options);
}
