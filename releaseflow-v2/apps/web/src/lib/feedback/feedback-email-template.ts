/**
 * BUILD-302C — Structured feedback email HTML + plain text.
 *
 * Pure string builders (same pattern as notification-email-templates).
 * All user-generated values are HTML-escaped. No raw HTML injection.
 */

import { getAppBaseUrl } from '@/lib/invitation-token';
import type { FeedbackContext } from './feedback-types';
import type { FeedbackSubjectEntityTitles } from './feedback-email-subject';

export interface FeedbackEmailIdentity {
  userName: string;
  userEmail: string;
  userId: string;
  role?: string | null;
  organisationName: string;
  organisationId: string;
}

export interface FeedbackEmailRenderInput {
  message: string;
  context: FeedbackContext;
  identity: FeedbackEmailIdentity;
  titles?: FeedbackSubjectEntityTitles;
  /** Human-readable timestamp (already formatted). */
  timestampLabel: string;
  /** App-relative route for deep link (from persisted context.route). */
  route: string;
}

export function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return getAppBaseUrl() || 'https://flow.okeldijital.africa';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base =
    getAppBaseUrl()
    || process.env.APP_URL
    || process.env.NEXT_PUBLIC_APP_URL
    || 'https://flow.okeldijital.africa';
  return `${base.replace(/\/$/, '')}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

function logoUrl(): string {
  const base =
    getAppBaseUrl()
    || process.env.APP_URL
    || process.env.NEXT_PUBLIC_APP_URL
    || 'https://flow.okeldijital.africa';
  return `${base.replace(/\/$/, '')}/icons/ReleaseFlow-Logo.svg`;
}

export interface FeedbackContextLines {
  module?: string;
  page?: string;
  release?: string;
  track?: string;
  artist?: string;
  task?: string;
  assignment?: string;
  person?: string;
  asset?: string;
  route: string;
}

/**
 * Build only applicable context lines (no empty Track: / Release: labels).
 */
export function buildFeedbackContextLines(
  context: FeedbackContext,
  titles: FeedbackSubjectEntityTitles = {},
): FeedbackContextLines {
  const lines: FeedbackContextLines = {
    route: context.route,
  };

  if (context.module) lines.module = context.module;
  if (context.page) lines.page = context.page;

  if (context.releaseId) {
    lines.release = titles.releaseTitle?.trim() || context.releaseId;
  }
  if (context.trackId) {
    lines.track = titles.trackTitle?.trim() || context.trackId;
  }
  if (context.artistId) {
    lines.artist = titles.artistName?.trim() || context.artistId;
  }
  if (context.taskId) {
    lines.task = titles.taskTitle?.trim() || context.taskId;
  }
  if (context.assignmentId) {
    lines.assignment = titles.assignmentTitle?.trim() || context.assignmentId;
  }
  if (context.personId) {
    lines.person = titles.personName?.trim() || context.personId;
  }
  if (context.assetId) {
    lines.asset = titles.assetName?.trim() || context.assetId;
  }

  return lines;
}

function sectionHtml(title: string, body: string): string {
  return `
    <tr>
      <td style="padding:16px 28px 4px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;font-weight:600;">${escapeHtml(title)}</p>
        <div style="margin-top:8px;border-top:1px solid rgba(148,163,184,0.15);padding-top:10px;">
          ${body}
        </div>
      </td>
    </tr>`;
}

function lineHtml(label: string, value: string): string {
  return `<p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#cbd5e1;"><span style="color:#94a3b8;">${escapeHtml(label)}:</span> <strong style="color:#e2e8f0;font-weight:600;">${escapeHtml(value)}</strong></p>`;
}

/**
 * Render branded HTML feedback notification email.
 */
export function renderFeedbackEmailHtml(input: FeedbackEmailRenderInput): string {
  const ctx = buildFeedbackContextLines(input.context, input.titles);
  const href = absoluteUrl(input.route || ctx.route);
  const logo = logoUrl();
  const org = input.identity.organisationName || 'ReleaseFlow';

  const messageBody = `<p style="margin:0;font-size:15px;line-height:1.65;color:#f8fafc;white-space:pre-wrap;">${escapeHtml(input.message)}</p>`;

  let userBody = '';
  userBody += lineHtml('Name', input.identity.userName || '—');
  userBody += lineHtml('Email', input.identity.userEmail || '—');
  if (input.identity.role) {
    userBody += lineHtml('Role', input.identity.role);
  }
  userBody += lineHtml('User ID', input.identity.userId);

  let orgBody = '';
  orgBody += `<p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#e2e8f0;font-weight:600;">${escapeHtml(input.identity.organisationName)}</p>`;
  orgBody += lineHtml('Organisation ID', input.identity.organisationId);

  let contextBody = '';
  if (ctx.module) contextBody += lineHtml('Module', ctx.module);
  if (ctx.page) contextBody += lineHtml('Page', ctx.page);
  if (ctx.release) contextBody += lineHtml('Release', ctx.release);
  if (ctx.track) contextBody += lineHtml('Track', ctx.track);
  if (ctx.artist) contextBody += lineHtml('Artist', ctx.artist);
  if (ctx.task) contextBody += lineHtml('Task', ctx.task);
  if (ctx.assignment) contextBody += lineHtml('Assignment', ctx.assignment);
  if (ctx.person) contextBody += lineHtml('Person', ctx.person);
  if (ctx.asset) contextBody += lineHtml('Asset', ctx.asset);
  contextBody += `<p style="margin:10px 0 0;font-size:13px;color:#94a3b8;">Route</p>`;
  contextBody += `<p style="margin:4px 0 0;font-size:13px;color:#e2e8f0;word-break:break-all;">${escapeHtml(ctx.route)}</p>`;

  const timeBody = `<p style="margin:0;font-size:14px;color:#e2e8f0;">${escapeHtml(input.timestampLabel)}</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ReleaseFlow Feedback</title>
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
              <h1 style="margin:12px 0 0;font-size:22px;line-height:1.3;font-weight:700;color:#f8fafc;">ReleaseFlow Feedback</h1>
            </td>
          </tr>
          ${sectionHtml('Message', messageBody)}
          ${sectionHtml('User', userBody)}
          ${sectionHtml('Organisation', orgBody)}
          ${sectionHtml('Context', contextBody)}
          ${sectionHtml('Time', timeBody)}
          <tr>
            <td style="padding:24px 28px;text-align:center;">
              <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 28px;background:#B14512;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
                Open in ReleaseFlow
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#64748b;">Internal feedback notification — not a support ticket.</p>
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

/**
 * Plain-text fallback (independent of HTML).
 */
export function renderFeedbackEmailText(input: FeedbackEmailRenderInput): string {
  const ctx = buildFeedbackContextLines(input.context, input.titles);
  const href = absoluteUrl(input.route || ctx.route);
  const lines: string[] = [
    'RELEASEFLOW FEEDBACK',
    '',
    'MESSAGE',
    '────────────────────────',
    input.message,
    '',
    'USER',
    '────────────────────────',
    `Name: ${input.identity.userName || '—'}`,
    `Email: ${input.identity.userEmail || '—'}`,
  ];
  if (input.identity.role) {
    lines.push(`Role: ${input.identity.role}`);
  }
  lines.push(
    `User ID: ${input.identity.userId}`,
    '',
    'ORGANISATION',
    '────────────────────────',
    input.identity.organisationName,
    `Organisation ID: ${input.identity.organisationId}`,
    '',
    'CONTEXT',
    '────────────────────────',
  );
  if (ctx.module) lines.push(`Module: ${ctx.module}`);
  if (ctx.page) lines.push(`Page: ${ctx.page}`);
  if (ctx.release) lines.push(`Release: ${ctx.release}`);
  if (ctx.track) lines.push(`Track: ${ctx.track}`);
  if (ctx.artist) lines.push(`Artist: ${ctx.artist}`);
  if (ctx.task) lines.push(`Task: ${ctx.task}`);
  if (ctx.assignment) lines.push(`Assignment: ${ctx.assignment}`);
  if (ctx.person) lines.push(`Person: ${ctx.person}`);
  if (ctx.asset) lines.push(`Asset: ${ctx.asset}`);
  lines.push(
    '',
    'Route:',
    ctx.route,
    '',
    'TIME',
    '────────────────────────',
    input.timestampLabel,
    '',
    'Open in ReleaseFlow:',
    href,
    '',
    '— ReleaseFlow',
  );
  return lines.join('\n');
}

/**
 * Format feedback createdAt for email (SAST / Africa/Johannesburg by default).
 */
export function formatFeedbackEmailTimestamp(
  date: Date,
  timeZone = 'Africa/Johannesburg',
): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? '';
    const day = get('day');
    const month = get('month');
    const year = get('year');
    const hour = get('hour');
    const minute = get('minute');
    return `${day} ${month} ${year}, ${hour}:${minute} SAST`;
  } catch {
    return date.toUTCString();
  }
}
