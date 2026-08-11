/**
 * BUILD-301B — Server-side Dropbox REST boundary.
 * Secrets stay here (and in config.ts). No React / domain imports.
 */

import { dropboxServerConfig } from './config';

export type DropboxFetch = typeof fetch;

export interface DropboxFileMetadata {
  id: string;
  path_display?: string;
  path_lower?: string;
  name?: string;
  size?: number;
  client_modified?: string;
  server_modified?: string;
  content_hash?: string;
  [key: string]: unknown;
}

export interface DropboxUploadResult {
  providerFileId: string;
  providerPath: string;
  filename: string;
  sizeBytes: number | null;
  contentHash: string | null;
  serverModified: string | null;
}

export interface DropboxTemporaryLinkResult {
  link: string;
  metadata: DropboxFileMetadata;
}

function sanitizeErrorMessage(message: string): string {
  // Never surface tokens/secrets in errors propagated upward.
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/refresh_token[=:][^&\s]+/gi, 'refresh_token=[redacted]')
    .replace(/access_token[=:][^&\s]+/gi, 'access_token=[redacted]');
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
 * Exchange refresh token for a short-lived access token.
 * Access token never leaves the server process.
 */
export async function getDropboxAccessToken(
  fetchImpl: DropboxFetch = fetch,
): Promise<string> {
  const cfg = dropboxServerConfig();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: cfg.refreshToken,
    client_id: cfg.appKey,
    client_secret: cfg.appSecret,
  });

  const res = await fetchImpl('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const detail = await readErrorBody(res);
    throw new Error(`Dropbox authentication failed: ${detail}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('Dropbox authentication failed: no access token returned.');
  }
  return data.access_token;
}

/**
 * Upload binary to Dropbox. path must be absolute Dropbox path e.g. /org/file.png
 */
export async function dropboxUpload(
  params: {
    path: string;
    contents: ArrayBuffer | Uint8Array | Buffer;
    contentType?: string;
    mode?: 'add' | 'overwrite';
  },
  fetchImpl: DropboxFetch = fetch,
): Promise<DropboxUploadResult> {
  const accessToken = await getDropboxAccessToken(fetchImpl);
  const path = params.path.startsWith('/') ? params.path : `/${params.path}`;
  const mode = params.mode ?? 'overwrite';

  const apiArg = JSON.stringify({
    path,
    mode: mode === 'overwrite' ? 'overwrite' : 'add',
    autorename: false,
    mute: false,
    strict_conflict: false,
  });

  const body =
    params.contents instanceof ArrayBuffer
      ? params.contents
      : params.contents.buffer.slice(
          params.contents.byteOffset,
          params.contents.byteOffset + params.contents.byteLength,
        );

  const res = await fetchImpl('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': apiArg,
    },
    body: body as BodyInit,
  });

  if (!res.ok) {
    const detail = await readErrorBody(res);
    throw new Error(`Dropbox upload failed: ${detail}`);
  }

  const meta = (await res.json()) as DropboxFileMetadata;
  if (!meta.id) {
    throw new Error('Dropbox upload failed: missing file id in response.');
  }

  return {
    providerFileId: meta.id,
    providerPath: meta.path_display ?? path,
    filename: meta.name ?? path.split('/').pop() ?? 'file',
    sizeBytes: typeof meta.size === 'number' ? meta.size : null,
    contentHash: typeof meta.content_hash === 'string' ? meta.content_hash : null,
    serverModified:
      typeof meta.server_modified === 'string' ? meta.server_modified : null,
  };
}

/**
 * Delete by Dropbox file id (id:...) or path.
 */
export async function dropboxDelete(
  params: { pathOrId: string },
  fetchImpl: DropboxFetch = fetch,
): Promise<void> {
  const accessToken = await getDropboxAccessToken(fetchImpl);
  const path = params.pathOrId.startsWith('id:')
    || params.pathOrId.startsWith('/')
    ? params.pathOrId
    : `id:${params.pathOrId}`;

  const res = await fetchImpl('https://api.dropboxapi.com/2/files/delete_v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  });

  if (!res.ok) {
    const detail = await readErrorBody(res);
    throw new Error(`Dropbox delete failed: ${detail}`);
  }
}

/**
 * Temporary download link (not permanent identity).
 */
export async function dropboxGetTemporaryLink(
  params: { pathOrId: string },
  fetchImpl: DropboxFetch = fetch,
): Promise<DropboxTemporaryLinkResult> {
  const accessToken = await getDropboxAccessToken(fetchImpl);
  const path = params.pathOrId.startsWith('id:')
    || params.pathOrId.startsWith('/')
    ? params.pathOrId
    : `id:${params.pathOrId}`;

  const res = await fetchImpl(
    'https://api.dropboxapi.com/2/files/get_temporary_link',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    },
  );

  if (!res.ok) {
    const detail = await readErrorBody(res);
    throw new Error(`Dropbox download URL failed: ${detail}`);
  }

  const data = (await res.json()) as {
    link?: string;
    metadata?: DropboxFileMetadata;
  };
  if (!data.link) {
    throw new Error('Dropbox download URL failed: no link returned.');
  }

  return {
    link: data.link,
    metadata: data.metadata ?? { id: path },
  };
}

/**
 * BUILD-301F — Known-object metadata only (not discovery / list).
 * Maps Dropbox file metadata to neutral fields. Does not invent version ids.
 */
export interface DropboxMetadataResult {
  providerFileId: string;
  providerPath: string | null;
  filename: string | null;
  sizeBytes: number | null;
  /** Dropbox rev when present — provider version identity. */
  providerVersionId: string | null;
  /** content_hash when present — treated as ETag/content fingerprint. */
  providerETag: string | null;
  providerModifiedAt: string | null;
}

export async function dropboxGetMetadata(
  params: { pathOrId: string },
  fetchImpl: DropboxFetch = fetch,
): Promise<DropboxMetadataResult> {
  const accessToken = await getDropboxAccessToken(fetchImpl);
  const path = params.pathOrId.startsWith('id:')
    || params.pathOrId.startsWith('/')
    ? params.pathOrId
    : `id:${params.pathOrId}`;

  const res = await fetchImpl(
    'https://api.dropboxapi.com/2/files/get_metadata',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, include_deleted: false }),
    },
  );

  if (!res.ok) {
    const detail = await readErrorBody(res);
    throw new Error(`Dropbox metadata failed: ${detail}`);
  }

  const meta = (await res.json()) as DropboxFileMetadata & {
    rev?: string;
    '.tag'?: string;
  };

  if (!meta.id) {
    throw new Error('Dropbox metadata failed: missing file id.');
  }

  return {
    providerFileId: meta.id,
    providerPath: meta.path_display ?? null,
    filename: meta.name ?? null,
    sizeBytes: typeof meta.size === 'number' ? meta.size : null,
    providerVersionId: typeof meta.rev === 'string' ? meta.rev : null,
    providerETag:
      typeof meta.content_hash === 'string' ? meta.content_hash : null,
    providerModifiedAt:
      typeof meta.server_modified === 'string' ? meta.server_modified : null,
  };
}
