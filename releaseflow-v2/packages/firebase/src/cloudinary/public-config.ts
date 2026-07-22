/**
 * BUILD-014D — Browser-safe Cloudinary public configuration.
 *
 * Only cloudName. Never API key or secret.
 * Prefer NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (delivery / browser).
 * On the server, fall back to CLOUDINARY_CLOUD_NAME so URLs still work
 * when only the server trio is set.
 */
export interface PublicCloudinaryConfig {
  cloudName: string;
}

export function publicCloudinaryConfig(): PublicCloudinaryConfig {
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    || (typeof window === 'undefined' ? process.env.CLOUDINARY_CLOUD_NAME : undefined);

  if (!cloudName) {
    throw new Error(
      'Cloudinary cloud name missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME '
      + '(and CLOUDINARY_CLOUD_NAME on the server).',
    );
  }

  return { cloudName };
}

export function publicCloudinaryCloudName(): string {
  return publicCloudinaryConfig().cloudName;
}
