/**
 * BUILD-301A — StorageProvider contract.
 *
 * Provider-neutral. No vendor-specific terminology.
 * Domain services depend on this interface, not on concrete SDKs.
 */

import type {
  StorageDeleteInput,
  StorageDownloadUrlInput,
  StorageExistsInput,
  StorageListInput,
  StorageMetadata,
  StorageMetadataInput,
  StorageMoveInput,
  StorageObject,
  StorageProviderCapabilities,
  StorageProviderId,
  StorageUploadInput,
} from './types';

export interface StorageProvider {
  /** Stable id for persistence (e.g. a registered provider key). */
  readonly providerId: StorageProviderId;

  /** Declared support for each operation. */
  readonly capabilities: StorageProviderCapabilities;

  upload(input: StorageUploadInput): Promise<StorageObject>;

  delete(input: StorageDeleteInput): Promise<void>;

  getDownloadUrl(input: StorageDownloadUrlInput): Promise<string>;

  /**
   * Provider-native move. Must not silently emulate via delete+reupload.
   * If unsupported, throw StorageError UNSUPPORTED_OPERATION.
   */
  move(input: StorageMoveInput): Promise<StorageObject>;

  /**
   * List objects for future external discovery.
   * If unsupported, throw StorageError UNSUPPORTED_OPERATION.
   */
  list(input: StorageListInput): Promise<StorageObject[]>;

  /**
   * Existence check for future reconciliation.
   * If unsupported, throw StorageError UNSUPPORTED_OPERATION.
   */
  exists(input: StorageExistsInput): Promise<boolean>;

  /**
   * Remote metadata for future synchronization.
   * If unsupported, throw StorageError UNSUPPORTED_OPERATION.
   */
  getMetadata(input: StorageMetadataInput): Promise<StorageMetadata>;
}
