import {
  addAsset, updateAsset, deleteAsset, getAsset, getAssetsByDeliverable,
  getAssetsByRelease, validateAssetRef, checkAssetCompleteness,
} from './asset-repository';
import type { CreateAssetFields, UpdateAssetFields, AssetRecord } from './asset-repository';

export type { AssetRecord, CreateAssetFields, UpdateAssetFields } from './asset-repository';
export { ASSET_TYPE_RULES } from './asset-repository';

export interface AssetValidationResult {
  valid: boolean;
  type?: string;
  error?: string;
}

export interface AssetCompleteness {
  hasArtwork: boolean;
  hasAudio: boolean;
  total: number;
  missing: string[];
}

export async function createAsset(fields: CreateAssetFields): Promise<string> {
  if (!fields.filename.trim()) throw new Error('Filename is required');
  if (!fields.url.trim()) throw new Error('URL is required');
  const validation = await validateAssetRef(fields.filename, fields.sizeBytes ?? undefined);
  if (!validation.valid) throw new Error(validation.error ?? 'Invalid asset');
  return addAsset({ ...fields, contentType: fields.contentType ?? `application/octet-stream` });
}

export async function editAsset(assetId: string, fields: UpdateAssetFields): Promise<void> {
  return updateAsset(assetId, fields);
}

export async function removeAsset(assetId: string): Promise<void> {
  return deleteAsset(assetId);
}

export async function fetchAsset(assetId: string): Promise<AssetRecord | null> {
  return getAsset(assetId);
}

export async function fetchAssetsByDeliverable(deliverableId: string): Promise<AssetRecord[]> {
  return getAssetsByDeliverable(deliverableId);
}

export async function fetchAssetsByRelease(releaseId: string): Promise<AssetRecord[]> {
  return getAssetsByRelease(releaseId);
}

export async function validateAsset(filename: string, sizeBytes?: number): Promise<AssetValidationResult> {
  return validateAssetRef(filename, sizeBytes);
}

export async function fetchAssetCompleteness(releaseId: string): Promise<AssetCompleteness> {
  return checkAssetCompleteness(releaseId);
}

export async function getReleaseAssetsSummary(releaseId: string): Promise<{
  completeness: AssetCompleteness;
  readinessBlockers: string[];
}> {
  const completeness = await checkAssetCompleteness(releaseId);
  const readinessBlockers: string[] = [];
  if (completeness.missing.includes('artwork')) readinessBlockers.push('Artwork asset required for distribution');
  if (completeness.missing.includes('audio')) readinessBlockers.push('Audio master required');
  return { completeness, readinessBlockers };
}
