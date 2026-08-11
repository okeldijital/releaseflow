/**
 * BUILD-301B — Server-only Dropbox credentials.
 * Never import this module from client/browser code.
 *
 * Env (distinct from Cloudinary):
 *   DROPBOX_APP_KEY
 *   DROPBOX_APP_SECRET
 *   DROPBOX_REFRESH_TOKEN
 */

export interface DropboxServerConfig {
  appKey: string;
  appSecret: string;
  refreshToken: string;
}

export function dropboxServerConfig(): DropboxServerConfig {
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;

  if (!appKey || !appSecret || !refreshToken) {
    throw new Error(
      'Dropbox config missing. Set DROPBOX_APP_KEY, DROPBOX_APP_SECRET, and DROPBOX_REFRESH_TOKEN.',
    );
  }

  return { appKey, appSecret, refreshToken };
}

export function isDropboxConfigured(): boolean {
  return Boolean(
    process.env.DROPBOX_APP_KEY
    && process.env.DROPBOX_APP_SECRET
    && process.env.DROPBOX_REFRESH_TOKEN,
  );
}
