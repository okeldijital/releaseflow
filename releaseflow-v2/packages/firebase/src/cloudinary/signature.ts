import { cloudinaryConfig } from './config';

interface SignedUploadParams {
  timestamp: number;
  folder?: string;
  publicId?: string;
  signature: string;
  apiKey: string;
}

export function signUpload(options: {
  folder?: string;
  publicId?: string;
  timestamp?: number;
}): SignedUploadParams {
  const timestamp = options.timestamp ?? Math.round(Date.now() / 1000);
  const params = new URLSearchParams();
  params.append('timestamp', String(timestamp));
  if (options.folder) params.append('folder', options.folder);
  if (options.publicId) params.append('public_id', options.publicId);

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

  if (typeof window === 'undefined') {
    return require('crypto')
      .createHash('sha256')
      .update(stringToSign)
      .digest('hex');
  }

  throw new Error('Signed uploads must be performed server-side');
}
