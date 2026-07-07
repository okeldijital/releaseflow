export type MediaAssetType =
  | 'cover'
  | 'booklet'
  | 'back_cover'
  | 'cd_label'
  | 'vinyl_label'
  | 'promo_banner'
  | 'social_artwork'
  | 'press_image'
  | 'marketing_asset';

export type MediaAssetStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'rejected' | 'archived';

export interface MediaAsset {
  id: string;
  organizationId: string;
  releaseId: string;
  assetType: MediaAssetType;
  title: string;
  description?: string;
  storageKey: string;
  thumbnailUrl?: string;
  mimeType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  status: MediaAssetStatus;
  currentVersionId?: string;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface MediaVersion {
  id: string;
  assetId: string;
  versionNumber: number;
  storageKey: string;
  thumbnailUrl?: string;
  mimeType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  notes?: string;
  uploadedBy: string;
  createdAt: unknown;
}

export type ReviewDecision = 'approved' | 'rejected' | 'changes_requested';

export interface MediaReview {
  id: string;
  assetId: string;
  versionId: string;
  reviewerId: string;
  decision: ReviewDecision;
  comments?: string;
  createdAt: unknown;
}

export interface MediaComment {
  id: string;
  assetId: string;
  versionId: string;
  authorId: string;
  text: string;
  createdAt: unknown;
}

export interface MediaUsage {
  id: string;
  assetId: string;
  contextType: string;
  contextId: string;
  contextLabel: string;
  createdAt: unknown;
}
