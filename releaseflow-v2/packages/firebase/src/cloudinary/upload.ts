import { cloudinaryConfig } from './config';
import type { UploadOptions, UploadResult } from './types';

export async function uploadFile(
  file: File,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  if (options.folder) formData.append('folder', options.folder);
  if (options.publicId) formData.append('public_id', options.publicId);
  if (options.tags) formData.append('tags', options.tags.join(','));
  if (options.resourceType) formData.append('resource_type', options.resourceType);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`,
    { method: 'POST', body: formData },
  );

  const data = await response.json();
  return {
    publicId: data.public_id,
    url: data.url,
    secureUrl: data.secure_url,
    format: data.format,
    bytes: data.bytes,
    createdAt: data.created_at,
  };
}

export async function uploadFileFromUrl(
  remoteUrl: string,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', remoteUrl);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  if (options.folder) formData.append('folder', options.folder);
  if (options.publicId) formData.append('public_id', options.publicId);
  if (options.tags) formData.append('tags', options.tags.join(','));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`,
    { method: 'POST', body: formData },
  );

  const data = await response.json();
  return {
    publicId: data.public_id,
    url: data.url,
    secureUrl: data.secure_url,
    format: data.format,
    bytes: data.bytes,
    createdAt: data.created_at,
  };
}
