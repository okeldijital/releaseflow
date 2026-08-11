/**
 * BUILD-301A — Storage provider architecture public surface.
 *
 * Domain Asset → Storage Reference → Storage Provider → External System
 */

export type { StorageProvider } from './storage-provider';
export type {
  StorageProviderId,
  StorageProviderCapabilities,
  StorageObject,
  StorageMetadata,
  StorageUploadInput,
  StorageUploadContext,
  StorageDeleteInput,
  StorageDownloadUrlInput,
  StorageMoveInput,
  StorageListInput,
  StorageExistsInput,
  StorageMetadataInput,
} from './types';
export {
  CLOUDINARY_PROVIDER_ID,
  DROPBOX_PROVIDER_ID,
  ONEDRIVE_PROVIDER_ID,
} from './types';
export {
  StorageError,
  isStorageError,
  unsupportedOperation,
  type StorageErrorCode,
} from './errors';
export type { StorageReference } from './storage-reference';
export { storageReferenceFromObject } from './storage-reference';
export type { OrganizationStorageConfig } from './organization-storage-config';
export {
  defaultOrganizationStorageConfig,
  resolveDefaultProviderId,
} from './organization-storage-config';
export {
  getStorageProvider,
  getDefaultStorageProvider,
  registerStorageProvider,
  listRegisteredStorageProviderIds,
} from './resolve-storage-provider';
export {
  CloudinaryStorageProvider,
  getCloudinaryStorageProvider,
  buildCloudinaryFolder,
  CLOUDINARY_ROOT_FOLDER,
  CLOUDINARY_ENTITY_SUBFOLDER,
} from './providers/cloudinary-storage-provider';
export {
  DropboxStorageProvider,
  getDropboxStorageProvider,
  resolveDropboxUploadPath,
} from './providers/dropbox-storage-provider';
export {
  OneDriveStorageProvider,
  getOneDriveStorageProvider,
  resolveOneDriveUploadPath,
} from './providers/onedrive-storage-provider';
export type {
  StorageLocationRecord,
  StorageLocationSafeDto,
  StorageLocationStatus,
  StorageProviderCatalogEntry,
  CreateStorageLocationInput,
  UpdateStorageLocationInput,
} from './storage-location-types';
export {
  toStorageLocationSafeDto,
} from './storage-location-types';
export {
  listLocationsSafe,
  createLocationSafe,
  updateLocationSafe,
  deleteLocationSafe,
  buildProviderCatalog,
  isRegisteredProviderId,
  assertRegisteredProvider,
  validateLocationName,
  StorageConfigError,
} from './storage-location-service';

// BUILD-301E — Asset Routing Engine
export type {
  FolderTemplateRecord,
  FolderTemplateSafeDto,
  CreateFolderTemplateInput,
  UpdateFolderTemplateInput,
  FolderTemplateVariable,
} from './folder-template-types';
export {
  FOLDER_TEMPLATE_VARIABLES,
  toFolderTemplateSafeDto,
} from './folder-template-types';
export type {
  StoragePolicyRecord,
  StoragePolicySafeDto,
  CreateStoragePolicyInput,
  UpdateStoragePolicyInput,
  AssetType as RoutableAssetType,
} from './storage-policy-types';
export {
  ROUTABLE_ASSET_TYPES,
  isRoutableAssetType,
  toStoragePolicySafeDto,
} from './storage-policy-types';
export type {
  AssetRoutingContext,
  StorageRoute,
  AssetRoutingErrorCode,
  AssetRoutingPreviewDto,
} from './asset-routing-types';
export {
  AssetRoutingError,
  toRoutingPreviewDto,
} from './asset-routing-types';
export {
  buildTemplateVariableValues,
  validateFolderTemplateStructure,
  resolveFolderTemplate,
  normalizeLogicalPath,
  combineRootAndTemplatePath,
} from './folder-template-resolver';
export {
  resolveAssetRoute,
  previewAssetRoute,
  buildStorageRoute,
  type AssetRoutingDeps,
} from './asset-routing-engine';
export {
  listTemplatesSafe,
  getTemplateSafe,
  createTemplateSafe,
  updateTemplateSafe,
  deleteTemplateSafe,
  validateTemplateName,
  FolderTemplateConfigError,
} from './folder-template-service';
export {
  listPoliciesSafe,
  getPolicySafe,
  createPolicySafe,
  updatePolicySafe,
  deletePolicySafe,
  validatePolicyName,
  StoragePolicyConfigError,
} from './storage-policy-service';

// BUILD-301F — Durable StorageReference + version/metadata sync foundation
export type {
  StorageReferenceRecord,
  StorageReferenceSafeDto,
  StorageReferenceStatus,
  StorageSyncStatus,
  StorageVersionInfo,
  CreateStorageReferenceInput,
  UpdateStorageReferenceInput,
} from './storage-reference-types';
export { toStorageReferenceSafeDto } from './storage-reference-types';
export {
  listReferencesSafe,
  listReferencesForAssetSafe,
  getReferenceSafe,
  createReferenceSafe,
  updateReferenceSafe,
  deleteReferenceSafe,
  resolveLocationBinding,
  buildEffectiveStorageIdentity,
  assertNoEphemeralIdentity,
  StorageReferenceError,
} from './storage-reference-service';
export {
  syncStorageReference,
  extractProviderVersionFields,
  type SyncStorageReferenceInput,
  type StorageReferenceSyncDeps,
} from './storage-reference-sync';
