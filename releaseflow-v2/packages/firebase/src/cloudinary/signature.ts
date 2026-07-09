import { createHash } from 'node:crypto';
import { cloudinaryConfig } from './config';

interface SignedUploadParams {
  timestamp: number;
  folder?: string;
  publicId?: string;
  signature: string;
  apiKey: string;
}

/**
 * Generates a Cloudinary upload signature. Must run server-side only:
 * it derives the signature from CLOUDINARY_API_SECRET, which must never
 * reach the browser bundle.
 */
export function signUpload(options: {
  folder?: string;
  publicId?: string;
  timestamp?: number;
}): SignedUploadParams {
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
  const params = new URLSearchParams();
  params.append('timestamp', String(timestamp));
  if (options.folder) params.append('folder', options.folder);
  if (options.publicId) params.append('publicId', options.publicId);

  const signature = generateSignature(params.toString());

  return {
    timestamp,
    folder: options.folder,
    publicId: options.publicId,
    signature,
    apiKey: cloudinaryConfig.apiKey,
  };
}

function generateSignature(params: string): string {
  const secret = cloudinaryConfig.apiSecret;
  const sortedParams = params
    .split('&')
    .filter(Boolean)
    .sort()
    .join('&');
  const stringToSign = `${sortedParams}${secret}`;
  return createHash('sha1').update(stringToSign).digest('hex');
}
