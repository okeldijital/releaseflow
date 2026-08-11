/**
 * BUILD-301C — Server-only Microsoft / OneDrive credentials.
 * Never import this module from client/browser code.
 *
 * Env (distinct from Cloudinary / Dropbox):
 *   MICROSOFT_CLIENT_ID
 *   MICROSOFT_CLIENT_SECRET
 *   MICROSOFT_REFRESH_TOKEN
 *   MICROSOFT_TENANT_ID (optional; defaults to "common")
 */

export interface OneDriveServerConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  tenantId: string;
}

export function onedriveServerConfig(): OneDriveServerConfig {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const refreshToken = process.env.MICROSOFT_REFRESH_TOKEN;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Microsoft storage config missing. Set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_REFRESH_TOKEN.',
    );
  }

  return { clientId, clientSecret, refreshToken, tenantId };
}

export function isOneDriveConfigured(): boolean {
  return Boolean(
    process.env.MICROSOFT_CLIENT_ID
    && process.env.MICROSOFT_CLIENT_SECRET
    && process.env.MICROSOFT_REFRESH_TOKEN,
  );
}
