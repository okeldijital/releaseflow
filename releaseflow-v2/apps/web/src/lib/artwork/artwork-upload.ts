import { getAuthInstance } from '@/lib/firebase';

export interface ArtworkUploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
}

export interface ArtworkUploadOptions {
  entityType: string;
  entityId: string;
  organizationId: string;
}

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

export async function uploadArtworkFile(
  file: File,
  options: ArtworkUploadOptions,
): Promise<ArtworkUploadResult> {
  const currentUser = getAuthInstance()?.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to upload artwork.');
  }
  const idToken = await currentUser.getIdToken();

  const signatureRes = await fetch('/api/media/upload-signature', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      entityType: options.entityType,
      entityId: options.entityId,
      organizationId: options.organizationId,
      tags: [`release:${options.entityId}`, `org:${options.organizationId}`],
    }),
  });

  if (!signatureRes.ok) {
    let message = 'Failed to request upload signature';
    try {
      const data = (await signatureRes.json()) as { error?: string };
      message = data?.error ?? message;
    } catch {
      /* ignore parse errors, keep default message */
    }
    throw new Error(message);
  }

  const sig = (await signatureRes.json()) as UploadSignature;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', String(sig.timestamp));
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
    { method: 'POST', body: formData },
  );

  const data = await uploadRes.json();
  if (data.error) {
    throw new Error(data.error.message ?? 'Cloudinary upload failed');
  }

  return {
    publicId: data.public_id as string,
    secureUrl: data.secure_url as string,
    width: data.width as number,
    height: data.height as number,
    format: data.format as string,
  };
}
