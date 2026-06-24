export interface UploadOptions {
  folder?: string;
  publicId?: string;
  tags?: string[];
  resourceType?: 'image' | 'raw' | 'video' | 'auto';
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes: number;
  createdAt: string;
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'scale' | 'fit' | 'thumb' | 'limit';
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'png' | 'jpg';
  effect?: string;
}
