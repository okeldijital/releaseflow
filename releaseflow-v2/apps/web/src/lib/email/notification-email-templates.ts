/**
 * NOT-002 — Branded HTML templates for notification emails.
 * Pure string builders (safe for Node worker without React SSR).
 */

import { getAppBaseUrl } from '@/lib/invitation-token';

export interface NotificationEmailPayload {
  subject: string;
  title: string;
  message: string;
  actorName?: string;
  entityTitle?: string;
  organizationName?: string;
  deepLink: string;
  ctaLabel?: string;
  eventType?: string;
  timestamp?: string;
}

function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return getAppBaseUrl() || 'https://flow.okeldijital.africa';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getAppBaseUrl() || process.env.NEXT_PUBLIC_APP_URL || 'https://flow.okeldijital.africa';
  return `${base.replace(/\/$/, '')}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

function logoUrl(): string {
  const base = getAppBaseUrl() || process.env.NEXT_PUBLIC_APP_URL || 'https://flow.okeldijital.africa';
  return `${base.replace(/\/$/, '')}/icons/ReleaseFlow-Logo.svg`;
}

function defaultCta(eventType?: string): string {
  if (!eventType) return 'Open in ReleaseFlow';
  if (eventType.startsWith('comment.')) return 'View Comment';
  if (eventType.startsWith('review.')) return 'Open Review';
  if (eventType.startsWith('release.')) return 'Open Release';
  if (eventType.startsWith('invitation.')) return 'View Invitation';
  if (eventType.startsWith('assignment.')) return 'Open Assignment';
  return 'Open in ReleaseFlow';
}

/**
 * Render a branded notification email body.
 */
export function renderNotificationEmailHtml(payload: NotificationEmailPayload): string {
  const cta = payload.ctaLabel || defaultCta(payload.eventType);
  const href = absoluteUrl(payload.deepLink);
  const when = payload.timestamp || new Date().toUTCString();
  const org = payload.organizationName || 'ReleaseFlow';
  const logo = logoUrl();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(payload.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0b1120;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1120;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#111827;border-radius:16px;border:1px solid rgba(148,163,184,0.2);overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;">
              <img src="${logo}" width="88" height="88" alt="ReleaseFlow" style="display:inline-block;width:88px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;text-align:center;">
              <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">${escapeHtml(org)}</p>
              <h1 style="margin:12px 0 0;font-size:22px;line-height:1.3;font-weight:700;color:#f8fafc;">${escapeHtml(payload.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 8px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#cbd5e1;">${escapeHtml(payload.message)}</p>
              ${payload.actorName ? `<p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">From <strong style="color:#e2e8f0;">${escapeHtml(payload.actorName)}</strong></p>` : ''}
              ${payload.entityTitle ? `<p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">Regarding <strong style="color:#e2e8f0;">${escapeHtml(payload.entityTitle)}</strong></p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;text-align:center;">
              <a href="${href}" style="display:inline-block;padding:12px 28px;background:#B14512;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
                ${escapeHtml(cta)}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#64748b;">${escapeHtml(when)}</p>
              <p style="margin:8px 0 0;font-size:11px;color:#64748b;">
                You received this because email notifications are enabled in ReleaseFlow.
                Manage preferences in Profile → Notifications.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#475569;">— ReleaseFlow</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
