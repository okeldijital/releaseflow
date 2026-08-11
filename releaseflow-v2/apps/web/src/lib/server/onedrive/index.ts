/**
 * BUILD-301C — Server-only OneDrive surface.
 * Import only from Node API routes / server code.
 */

export {
  onedriveServerConfig,
  isOneDriveConfigured,
  type OneDriveServerConfig,
} from './config';
export {
  getMicrosoftAccessToken,
  onedriveUpload,
  onedriveDelete,
  onedriveGetDownloadUrl,
  onedriveGetMetadata,
  neutralStorageFailure,
  type OneDriveUploadResult,
  type OneDriveDownloadUrlResult,
  type OneDriveMetadataResult,
  type OneDriveFetch,
} from './onedrive-api';
export {
  buildProvisionalOneDrivePath,
  isPathBoundToOrganization,
  validateOrgBoundPath,
  ONEDRIVE_PATH_ROOT,
} from './path-safety';
