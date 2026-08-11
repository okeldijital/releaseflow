/**
 * BUILD-301A — Provider-neutral storage errors.
 * Do not leak Cloudinary (or future provider) error shapes to domain callers.
 */

export type StorageErrorCode =
  | 'UNSUPPORTED_OPERATION'
  | 'STORAGE_NOT_FOUND'
  | 'STORAGE_ACCESS_DENIED'
  | 'STORAGE_UPLOAD_FAILED'
  | 'STORAGE_DELETE_FAILED'
  | 'STORAGE_PROVIDER_UNAVAILABLE'
  | 'STORAGE_UNKNOWN';

export class StorageError extends Error {
  readonly code: StorageErrorCode;
  readonly providerId?: string;
  readonly cause?: unknown;

  constructor(
    code: StorageErrorCode,
    message: string,
    options?: { providerId?: string; cause?: unknown },
  ) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.providerId = options?.providerId;
    this.cause = options?.cause;
  }
}

export function unsupportedOperation(
  providerId: string,
  operation: string,
): StorageError {
  return new StorageError(
    'UNSUPPORTED_OPERATION',
    `Storage provider "${providerId}" does not support operation: ${operation}`,
    { providerId },
  );
}

export function isStorageError(err: unknown): err is StorageError {
  return err instanceof StorageError;
}
