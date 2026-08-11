/**
 * BUILD-301C — Server-side Microsoft Graph REST boundary for OneDrive.
 * Secrets stay here (and in config.ts). No React / domain imports.
 */

import { onedriveServerConfig } from './config';

export type OneDriveFetch = typeof fetch;

export interface OneDriveUploadResult {
  providerFileId: string;
  providerPath: string | null;
  filename: string;
  sizeBytes: number | null;
  contentType: string | null;
  webUrl: string | null;
}

export interface OneDriveDownloadUrlResult {
  downloadUrl: string;
  providerFileId: string;
  providerPath: string | null;
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/refresh_token[=:][^&\s]+/gi, 'refresh_token=[redacted]')
    .replace(/access_token[=:][^&\s]+/gi, 'access_token=[redacted]')
    .replace(/client_secret[=:][^&\s]+/gi, 'client_secret=[redacted]');
}

/**
 * Neutral message for API/route responses — no vendor names.
 */
export function neutralStorageFailure(
  kind:
    | 'auth'
    | 'upload'
    | 'delete'
    | 'download'
    | 'metadata'
    | 'config'
    | 'unknown' = 'unknown',
): string {
  switch (kind) {
    case 'auth':
      return 'Storage authentication failed.';
    case 'upload':
      return 'Storage upload failed.';
    case 'delete':
      return 'Storage delete failed.';
    case 'download':
      return 'Storage download URL failed.';
    case 'metadata':
      return 'Storage metadata synchronization failed.';
    case 'config':
      return 'Storage configuration is incomplete.';
    default:
      return 'Storage operation failed.';
  }
}

async function readErrorBody(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return sanitizeErrorMessage(text.slice(0, 500));
  } catch {
    return `HTTP ${res.status}`;
  }
}

/**
 * Exchange refresh token for a short-lived access token (server-only).
 * No caching in BUILD-301C.
 */
export async function getMicrosoftAccessToken(
  fetchImpl: OneDriveFetch = fetch,
): Promise<string> {
  const cfg = onedriveServerConfig();
  const tokenUrl = `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: cfg.refreshToken,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    scope: 'https://graph.microsoft.com/.default offline_access Files.ReadWrite.All',
  });

  const res = await fetchImpl(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    await readErrorBody(res);
    throw new Error(neutralStorageFailure('auth'));
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error(neutralStorageFailure('auth'));
  }
  return data.access_token;
}

/**
 * Upload binary to OneDrive via Graph simple upload (path-based).
 * path: absolute-style path without drive root prefix, e.g. /ReleaseFlow/org/a/b/file.png
 */
export async function onedriveUpload(
  params: {
    path: string;
    contents: ArrayBuffer | Uint8Array | Buffer;
    contentType?: string;
  },
  fetchImpl: OneDriveFetch = fetch,
): Promise<OneDriveUploadResult> {
  const accessToken = await getMicrosoftAccessToken(fetchImpl);
  const path = params.path.startsWith('/') ? params.path.slice(1) : params.path;
  // Graph path: /me/drive/root:/{path}:/content
  const encoded = path
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${encoded}:/content`;

  const body =
    params.contents instanceof ArrayBuffer
      ? params.contents
      : params.contents.buffer.slice(
          params.contents.byteOffset,
          params.contents.byteOffset + params.contents.byteLength,
        );

  const res = await fetchImpl(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': params.contentType || 'application/octet-stream',
    },
    body: body as BodyInit,
  });

  if (!res.ok) {
    await readErrorBody(res);
    throw new Error(neutralStorageFailure('upload'));
  }

  const item = (await res.json()) as {
    id?: string;
    name?: string;
    size?: number;
    file?: { mimeType?: string };
    parentReference?: { path?: string };
    webUrl?: string;
  };

  if (!item.id) {
    throw new Error(neutralStorageFailure('upload'));
  }

  const parentPath = item.parentReference?.path?.replace(
    /^\/drive\/root:/,
    '',
  );
  const providerPath = parentPath && item.name
    ? `${parentPath}/${item.name}`.replace(/\/+/g, '/')
    : `/${path}`.replace(/\/+/g, '/');

  return {
    providerFileId: item.id,
    providerPath: providerPath.startsWith('/') ? providerPath : `/${providerPath}`,
    filename: item.name ?? path.split('/').pop() ?? 'file',
    sizeBytes: typeof item.size === 'number' ? item.size : null,
    contentType: item.file?.mimeType ?? params.contentType ?? null,
    webUrl: item.webUrl ?? null,
  };
}

/**
 * Delete by Graph item id (providerFileId).
 */
export async function onedriveDelete(
  params: { itemId: string },
  fetchImpl: OneDriveFetch = fetch,
): Promise<void> {
  const accessToken = await getMicrosoftAccessToken(fetchImpl);
  const res = await fetchImpl(
    `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(params.itemId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok && res.status !== 204) {
    await readErrorBody(res);
    throw new Error(neutralStorageFailure('delete'));
  }
}

/**
 * Temporary/pre-authenticated download URL from Graph.
 * Not permanent identity.
 */
export async function onedriveGetDownloadUrl(
  params: { itemId: string },
  fetchImpl: OneDriveFetch = fetch,
): Promise<OneDriveDownloadUrlResult> {
  const accessToken = await getMicrosoftAccessToken(fetchImpl);
  const res = await fetchImpl(
    `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(params.itemId)}?select=id,name,parentReference,@microsoft.graph.downloadUrl`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) {
    await readErrorBody(res);
    throw new Error(neutralStorageFailure('download'));
  }

  const item = (await res.json()) as {
    id?: string;
    name?: string;
    parentReference?: { path?: string };
    '@microsoft.graph.downloadUrl'?: string;
  };

  const downloadUrl = item['@microsoft.graph.downloadUrl'];
  if (!downloadUrl || !item.id) {
    throw new Error(neutralStorageFailure('download'));
  }

  const parentPath = item.parentReference?.path?.replace(
    /^\/drive\/root:/,
    '',
  );
  const providerPath = parentPath && item.name
    ? `${parentPath}/${item.name}`.replace(/\/+/g, '/')
    : null;

  return {
    downloadUrl,
    providerFileId: item.id,
    providerPath: providerPath
      ? (providerPath.startsWith('/') ? providerPath : `/${providerPath}`)
      : null,
  };
}

/**
 * BUILD-301F — Known-object metadata only (not discovery / list / versions API).
 * Does not invent provider version identifiers when Graph does not expose them.
 * Does not return download URLs as identity.
 */
export interface OneDriveMetadataResult {
  providerFileId: string;
  providerPath: string | null;
  filename: string | null;
  sizeBytes: number | null;
  contentType: string | null;
  /** Not fabricated — null unless a true provider version id is available. */
  providerVersionId: string | null;
  providerETag: string | null;
  providerModifiedAt: string | null;
}

export async function onedriveGetMetadata(
  params: { itemId: string },
  fetchImpl: OneDriveFetch = fetch,
): Promise<OneDriveMetadataResult> {
  const accessToken = await getMicrosoftAccessToken(fetchImpl);
  const res = await fetchImpl(
    `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(params.itemId)}?select=id,name,size,file,parentReference,eTag,lastModifiedDateTime,createdDateTime`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) {
    await readErrorBody(res);
    throw new Error(neutralStorageFailure('metadata'));
  }

  const item = (await res.json()) as {
    id?: string;
    name?: string;
    size?: number;
    file?: { mimeType?: string };
    parentReference?: { path?: string };
    eTag?: string;
    lastModifiedDateTime?: string;
    createdDateTime?: string;
  };

  if (!item.id) {
    throw new Error(neutralStorageFailure('metadata'));
  }

  const parentPath = item.parentReference?.path?.replace(
    /^\/drive\/root:/,
    '',
  );
  const providerPath = parentPath && item.name
    ? `${parentPath}/${item.name}`.replace(/\/+/g, '/')
    : null;

  return {
    providerFileId: item.id,
    providerPath: providerPath
      ? (providerPath.startsWith('/') ? providerPath : `/${providerPath}`)
      : null,
    filename: item.name ?? null,
    sizeBytes: typeof item.size === 'number' ? item.size : null,
    contentType: item.file?.mimeType ?? null,
    // Graph item eTag is not a file version id — do not invent providerVersionId
    providerVersionId: null,
    providerETag: typeof item.eTag === 'string' ? item.eTag : null,
    providerModifiedAt:
      typeof item.lastModifiedDateTime === 'string'
        ? item.lastModifiedDateTime
        : null,
  };
}
