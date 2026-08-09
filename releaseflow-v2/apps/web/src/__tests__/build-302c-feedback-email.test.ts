/**
 * BUILD-302C — Feedback email notification pipeline tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Timestamp } from '@firebase/firestore';
import {
  buildFeedbackEmailSubject,
  buildFeedbackContextLines,
  escapeHtml,
  formatFeedbackEmailTimestamp,
  renderFeedbackEmailHtml,
  renderFeedbackEmailText,
  sendFeedbackFromUi,
  FEEDBACK_NOTIFICATION_EMAIL_ENV,
  getFeedbackNotificationEmail,
  requireFeedbackNotificationEmail,
  resolveFeedbackContext,
  type Feedback,
} from '@/lib/feedback';
import * as feedbackService from '@/lib/feedback/feedback-service';
import { deliverFeedbackEmail } from '@/lib/feedback/feedback-email-delivery';

vi.mock('@/lib/feedback/feedback-service', async () => {
  const actual = await vi.importActual<typeof import('@/lib/feedback/feedback-service')>(
    '@/lib/feedback/feedback-service',
  );
  return {
    ...actual,
    submitFeedback: vi.fn(),
  };
});

const webSrc = join(__dirname, '..');
const monorepoRoot = join(__dirname, '../../../..');

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

function readRoot(rel: string): string {
  return readFileSync(join(monorepoRoot, rel), 'utf8');
}

function sampleFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 'fb-1',
    organisationId: 'org-a',
    userId: 'user-1',
    message: 'Hello world',
    context: {
      route: '/dashboard',
      module: 'dashboard',
      page: 'dashboard',
    },
    createdAt: Timestamp.fromDate(new Date('2026-08-09T08:42:00Z')),
    emailDeliveryStatus: 'pending',
    ...overrides,
  };
}

describe('BUILD-302C email destination config', () => {
  const prev = process.env.FEEDBACK_NOTIFICATION_EMAIL;

  afterEach(() => {
    if (prev === undefined) delete process.env.FEEDBACK_NOTIFICATION_EMAIL;
    else process.env.FEEDBACK_NOTIFICATION_EMAIL = prev;
  });

  it('Test 1 — uses configured env var, not hardcoded client address', () => {
    process.env.FEEDBACK_NOTIFICATION_EMAIL = 'feedback@example.test';
    expect(getFeedbackNotificationEmail()).toBe('feedback@example.test');
    expect(requireFeedbackNotificationEmail()).toBe('feedback@example.test');
    expect(FEEDBACK_NOTIFICATION_EMAIL_ENV).toBe('FEEDBACK_NOTIFICATION_EMAIL');

    const panel = read('components/feedback/feedback-panel.tsx');
    const trigger = read('components/feedback/feedback-trigger.tsx');
    expect(panel).not.toMatch(/feedback@/);
    expect(trigger).not.toMatch(/feedback@/);
    expect(panel).not.toContain('FEEDBACK_NOTIFICATION_EMAIL');
  });

  it('require throws when unset', () => {
    delete process.env.FEEDBACK_NOTIFICATION_EMAIL;
    expect(() => requireFeedbackNotificationEmail()).toThrow(
      /FEEDBACK_NOTIFICATION_EMAIL/,
    );
  });
});

describe('BUILD-302C subject generation', () => {
  it('Test 2 — Dashboard', () => {
    const ctx = resolveFeedbackContext('/dashboard');
    expect(buildFeedbackEmailSubject(ctx)).toBe(
      '[ReleaseFlow Feedback] Dashboard',
    );
  });

  it('Test 3 — Track with titles', () => {
    const ctx = resolveFeedbackContext('/releases/lua/tracks/izizwe');
    expect(
      buildFeedbackEmailSubject(ctx, {
        releaseTitle: 'Lua',
        trackTitle: 'Izizwe',
      }),
    ).toBe('[ReleaseFlow Feedback] Lua — Track: Izizwe');
  });

  it('never puts message or raw ids into subject when titles present', () => {
    const ctx = resolveFeedbackContext('/tracks/trk-secret-id');
    const subject = buildFeedbackEmailSubject(ctx, { trackTitle: 'Sunrise' });
    expect(subject).toBe('[ReleaseFlow Feedback] Track: Sunrise');
    expect(subject).not.toContain('trk-secret-id');
    expect(subject).not.toContain('user message');
  });

  it('release / artist / task / assignment subjects', () => {
    expect(
      buildFeedbackEmailSubject(resolveFeedbackContext('/releases/r1'), {
        releaseTitle: 'Lua',
      }),
    ).toBe('[ReleaseFlow Feedback] Lua');
    expect(
      buildFeedbackEmailSubject(resolveFeedbackContext('/artists/a1'), {
        artistName: 'Thandiswa',
      }),
    ).toBe('[ReleaseFlow Feedback] Artist: Thandiswa');
    expect(
      buildFeedbackEmailSubject(resolveFeedbackContext('/tasks/t1'), {
        taskTitle: 'Mastering',
      }),
    ).toBe('[ReleaseFlow Feedback] Task: Mastering');
    expect(
      buildFeedbackEmailSubject(resolveFeedbackContext('/assignments/as1'), {
        assignmentTitle: 'Cover art',
      }),
    ).toBe('[ReleaseFlow Feedback] Assignment: Cover art');
  });
});

describe('BUILD-302C structured body', () => {
  const identity = {
    userName: 'Alex Producer',
    userEmail: 'alex@example.com',
    userId: 'uid-1',
    role: 'Producer',
    organisationName: 'M2KR',
    organisationId: 'org-a',
  };

  it('Test 4 — HTML body contains required sections', () => {
    const ctx = resolveFeedbackContext('/releases/r1');
    const html = renderFeedbackEmailHtml({
      message: 'Something is off',
      context: ctx,
      identity,
      titles: { releaseTitle: 'Lua' },
      timestampLabel: '09 August 2026, 10:42 SAST',
      route: ctx.route,
    });
    expect(html).toContain('Something is off');
    expect(html).toContain('Alex Producer');
    expect(html).toContain('alex@example.com');
    expect(html).toContain('Producer');
    expect(html).toContain('M2KR');
    expect(html).toContain('org-a');
    expect(html).toContain('Release');
    expect(html).toContain(ctx.route);
    expect(html).toContain('09 August 2026, 10:42 SAST');
    expect(html).toContain('Open in ReleaseFlow');
  });

  it('Test 5 — Dashboard omits irrelevant entity fields', () => {
    const ctx = resolveFeedbackContext('/dashboard');
    const lines = buildFeedbackContextLines(ctx);
    expect(lines.release).toBeUndefined();
    expect(lines.track).toBeUndefined();
    expect(lines.artist).toBeUndefined();

    const html = renderFeedbackEmailHtml({
      message: 'UI nit',
      context: ctx,
      identity,
      timestampLabel: '09 August 2026, 10:42 SAST',
      route: ctx.route,
    });
    expect(html).not.toMatch(/>Track:</);
    expect(html).not.toMatch(/>Release:</);
    expect(html).not.toMatch(/>Artist:</);
  });

  it('Test 6 — direct link uses actual route', () => {
    const ctx = resolveFeedbackContext('/tracks/izizwe');
    const html = renderFeedbackEmailHtml({
      message: 'Track note',
      context: ctx,
      identity,
      titles: { trackTitle: 'Izizwe' },
      timestampLabel: '09 August 2026, 10:42 SAST',
      route: ctx.route,
    });
    expect(html).toContain('/tracks/izizwe');
    const text = renderFeedbackEmailText({
      message: 'Track note',
      context: ctx,
      identity,
      titles: { trackTitle: 'Izizwe' },
      timestampLabel: '09 August 2026, 10:42 SAST',
      route: ctx.route,
    });
    expect(text).toContain('/tracks/izizwe');
  });

  it('Test 7 — user message is HTML-escaped', () => {
    const evil = '<script>alert("x")</script>';
    const html = renderFeedbackEmailHtml({
      message: evil,
      context: resolveFeedbackContext('/dashboard'),
      identity,
      timestampLabel: 't',
      route: '/dashboard',
    });
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).toContain(escapeHtml(evil));
    expect(escapeHtml(evil)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
  });

  it('plain text is independent and structured', () => {
    const text = renderFeedbackEmailText({
      message: 'Plain note',
      context: resolveFeedbackContext('/dashboard'),
      identity,
      timestampLabel: '09 August 2026, 10:42 SAST',
      route: '/dashboard',
    });
    expect(text).toContain('MESSAGE');
    expect(text).toContain('Plain note');
    expect(text).toContain('USER');
    expect(text).toContain('ORGANISATION');
    expect(text).toContain('CONTEXT');
    expect(text).toContain('TIME');
    expect(text).toContain('Open in ReleaseFlow');
  });

  it('timestamp formatting is human-readable', () => {
    const label = formatFeedbackEmailTimestamp(
      new Date('2026-08-09T08:42:00Z'),
    );
    expect(label).toMatch(/August 2026/);
    expect(label).toContain('SAST');
  });
});

describe('BUILD-302C persistence before email + UI contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Test 8 — persistence runs before email delivery', async () => {
    const order: string[] = [];
    const submit = vi.fn(async () => {
      order.push('persist');
      return sampleFeedback();
    });
    const deliverEmail = vi.fn(async () => {
      order.push('email');
      return { emailDeliveryStatus: 'sent' as const };
    });

    await sendFeedbackFromUi({
      message: 'order test',
      pathname: '/dashboard',
      auth: { userId: 'u1', organisationId: 'org-a' },
      submit: submit as typeof feedbackService.submitFeedback,
      deliverEmail,
    });

    expect(order).toEqual(['persist', 'email']);
  });

  it('Test 11 — persistence failure does not call email', async () => {
    const deliverEmail = vi.fn();
    const result = await sendFeedbackFromUi({
      message: 'x',
      pathname: '/dashboard',
      auth: { userId: 'u1', organisationId: 'org-a' },
      submit: vi.fn().mockRejectedValue(new Error('persist fail')) as typeof feedbackService.submitFeedback,
      deliverEmail,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.phase).toBe('persistence');
    expect(deliverEmail).not.toHaveBeenCalled();
  });

  it('Test 9/10 — email success vs failure after save', async () => {
    const submit = vi.fn().mockResolvedValue(sampleFeedback());

    const ok = await sendFeedbackFromUi({
      message: 'ok',
      pathname: '/dashboard',
      auth: { userId: 'u1', organisationId: 'org-a' },
      submit: submit as typeof feedbackService.submitFeedback,
      deliverEmail: async () => ({ emailDeliveryStatus: 'sent' }),
    });
    expect(ok).toMatchObject({
      ok: true,
      emailDeliveryStatus: 'sent',
      emailFailed: false,
    });

    const fail = await sendFeedbackFromUi({
      message: 'ok',
      pathname: '/dashboard',
      auth: { userId: 'u1', organisationId: 'org-a' },
      submit: submit as typeof feedbackService.submitFeedback,
      deliverEmail: async () => ({
        emailDeliveryStatus: 'failed',
        error: 'provider down',
      }),
    });
    expect(fail).toMatchObject({
      ok: true,
      emailDeliveryStatus: 'failed',
      emailFailed: true,
    });
  });

  it('UI shows saved-but-failed message for email failure', () => {
    const panel = read('components/feedback/feedback-panel.tsx');
    expect(panel).toContain('emailFailed');
    expect(panel).toContain('Your feedback was saved, but we couldn');
    expect(panel).toContain('send the notification. Please try again.');
    expect(panel).toContain('Feedback sent. Thank you.');
  });
});

describe('BUILD-302C server delivery mechanics', () => {
  function makeFakeDb(initial: Record<string, unknown>) {
    let data = { ...initial };
    const updates: Record<string, unknown>[] = [];
    const ref = {
      update: vi.fn(async (patch: Record<string, unknown>) => {
        updates.push(patch);
        // FieldValue.delete() is an object — strip for tests
        const next = { ...data };
        for (const [k, v] of Object.entries(patch)) {
          if (v && typeof v === 'object' && '_methodName' in (v as object)) {
            delete next[k];
          } else {
            next[k] = v;
          }
        }
        data = next;
      }),
    };
    const db = {
      collection: () => ({
        doc: () => ref,
      }),
      runTransaction: async (
        fn: (tx: {
          get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> }>;
          update: (r: unknown, patch: Record<string, unknown>) => void;
        }) => Promise<unknown>,
      ) =>
        fn({
          get: async () => ({
            exists: true,
            data: () => data,
          }),
          update: (_r, patch) => {
            updates.push(patch);
            data = { ...data, ...patch };
          },
        }),
    };
    return { db: db as never, ref, updates, getData: () => data };
  }

  it('Test 9 — success sets sent', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.EMAIL_FROM = 'from@test.com';
    process.env.FEEDBACK_NOTIFICATION_EMAIL = 'inbox@test.com';

    const { db, updates } = makeFakeDb({
      organisationId: 'org-a',
      organizationId: 'org-a',
      userId: 'u1',
      message: 'Hi',
      context: { route: '/dashboard', module: 'dashboard', page: 'dashboard' },
      createdAt: { seconds: 1_723_200_000 },
      emailDeliveryStatus: 'pending',
    });

    // Stub nested lookups used by identity/titles
    const originalCollection = (db as { collection: (n: string) => unknown }).collection;
    (db as { collection: (n: string) => unknown }).collection = (name: string) => {
      if (name === 'feedback') return originalCollection(name);
      return {
        doc: () => ({
          get: async () => ({ exists: false, data: () => ({}) }),
          collection: () => ({
            doc: () => ({
              get: async () => ({ exists: false, data: () => ({}) }),
            }),
          }),
        }),
        where: () => ({
          where: () => ({
            where: () => ({
              limit: () => ({
                get: async () => ({ empty: true, docs: [] }),
              }),
            }),
            limit: () => ({
              get: async () => ({ empty: true, docs: [] }),
            }),
          }),
          limit: () => ({
            get: async () => ({ empty: true, docs: [] }),
          }),
        }),
      };
    };

    const send = vi.fn(async () => undefined);
    const result = await deliverFeedbackEmail(db, 'fb-1', {
      send: send as never,
      getDestination: () => 'inbox@test.com',
    });

    expect(result.status).toBe('sent');
    expect(send).toHaveBeenCalledOnce();
    const sentUpdate = updates.find((u) => u.emailDeliveryStatus === 'sent');
    expect(sentUpdate).toBeTruthy();
  });

  it('Test 10 — provider failure sets failed and keeps record', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.EMAIL_FROM = 'from@test.com';

    const { db, updates, getData } = makeFakeDb({
      organisationId: 'org-a',
      organizationId: 'org-a',
      userId: 'u1',
      message: 'Hi',
      context: { route: '/dashboard', module: 'dashboard', page: 'dashboard' },
      createdAt: { seconds: 1_723_200_000 },
      emailDeliveryStatus: 'pending',
    });

    (db as { collection: (n: string) => unknown }).collection = (name: string) => {
      if (name === 'feedback') {
        return {
          doc: () => ({
            update: async (patch: Record<string, unknown>) => {
              updates.push(patch);
              Object.assign(getData(), patch);
            },
          }),
        };
      }
      return {
        doc: () => ({
          get: async () => ({ exists: false, data: () => ({}) }),
          collection: () => ({
            doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }) }),
          }),
        }),
        where: () => ({
          where: () => ({
            where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
            limit: () => ({ get: async () => ({ empty: true, docs: [] }) }),
          }),
          limit: () => ({ get: async () => ({ empty: true, docs: [] }) }),
        }),
      };
    };

    // Fix runTransaction still using makeFakeDb ref — re-bind simpler path
    const dataStore: Record<string, unknown> = {
      organisationId: 'org-a',
      organizationId: 'org-a',
      userId: 'u1',
      message: 'Keep me',
      context: { route: '/dashboard', module: 'dashboard', page: 'dashboard' },
      createdAt: { seconds: 1_723_200_000 },
      emailDeliveryStatus: 'pending',
    };
    const localUpdates: Record<string, unknown>[] = [];
    const fakeDb = {
      collection: (name: string) => {
        if (name === 'feedback') {
          return {
            doc: () => ({
              update: async (patch: Record<string, unknown>) => {
                localUpdates.push(patch);
                Object.assign(dataStore, patch);
              },
            }),
          };
        }
        return {
          doc: () => ({
            get: async () => ({ exists: false, data: () => ({}) }),
            collection: () => ({
              doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }) }),
            }),
          }),
          where: () => ({
            where: () => ({
              where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
              limit: () => ({ get: async () => ({ empty: true, docs: [] }) }),
            }),
            limit: () => ({ get: async () => ({ empty: true, docs: [] }) }),
          }),
        };
      },
      runTransaction: async (
        fn: (tx: {
          get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> }>;
          update: (r: unknown, patch: Record<string, unknown>) => void;
        }) => Promise<unknown>,
      ) =>
        fn({
          get: async () => ({ exists: true, data: () => dataStore }),
          update: (_r, patch) => {
            localUpdates.push(patch);
            Object.assign(dataStore, patch);
          },
        }),
    };

    const result = await deliverFeedbackEmail(fakeDb as never, 'fb-1', {
      send: vi.fn(async () => {
        throw new Error('Resend down');
      }) as never,
      getDestination: () => 'inbox@test.com',
    });

    expect(result.status).toBe('failed');
    if (result.status === 'failed') expect(result.error).toContain('Resend down');
    expect(dataStore.message).toBe('Keep me');
    expect(dataStore.emailDeliveryStatus).toBe('failed');
  });

  it('Test 13 — already sent does not send again', async () => {
    const send = vi.fn();
    const fakeDb = {
      collection: () => ({
        doc: () => ({
          update: vi.fn(),
        }),
      }),
      runTransaction: async (
        fn: (tx: {
          get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> }>;
          update: () => void;
        }) => Promise<unknown>,
      ) =>
        fn({
          get: async () => ({
            exists: true,
            data: () => ({
              emailDeliveryStatus: 'sent',
              message: 'done',
              userId: 'u1',
              organisationId: 'org-a',
              context: { route: '/dashboard', module: 'dashboard', page: 'dashboard' },
            }),
          }),
          update: () => undefined,
        }),
    };

    const result = await deliverFeedbackEmail(fakeDb as never, 'fb-1', {
      send: send as never,
      getDestination: () => 'inbox@test.com',
    });
    expect(result).toMatchObject({ status: 'sent', skipped: true });
    expect(send).not.toHaveBeenCalled();
  });

  it('Test 12 — failed can be retried to sent', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.EMAIL_FROM = 'from@test.com';

    const dataStore: Record<string, unknown> = {
      organisationId: 'org-a',
      organizationId: 'org-a',
      userId: 'u1',
      message: 'Retry me',
      context: { route: '/dashboard', module: 'dashboard', page: 'dashboard' },
      createdAt: { seconds: 1_723_200_000 },
      emailDeliveryStatus: 'failed',
    };

    const fakeDb = {
      collection: (name: string) => {
        if (name === 'feedback') {
          return {
            doc: () => ({
              update: async (patch: Record<string, unknown>) => {
                Object.assign(dataStore, patch);
              },
            }),
          };
        }
        return {
          doc: () => ({
            get: async () => ({ exists: false, data: () => ({}) }),
            collection: () => ({
              doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }) }),
            }),
          }),
          where: () => ({
            where: () => ({
              where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
              limit: () => ({ get: async () => ({ empty: true, docs: [] }) }),
            }),
            limit: () => ({ get: async () => ({ empty: true, docs: [] }) }),
          }),
        };
      },
      runTransaction: async (
        fn: (tx: {
          get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> }>;
          update: (r: unknown, patch: Record<string, unknown>) => void;
        }) => Promise<unknown>,
      ) =>
        fn({
          get: async () => ({ exists: true, data: () => dataStore }),
          update: (_r, patch) => {
            Object.assign(dataStore, patch);
          },
        }),
    };

    const result = await deliverFeedbackEmail(fakeDb as never, 'fb-1', {
      allowRetry: true,
      send: vi.fn(async () => undefined) as never,
      getDestination: () => 'inbox@test.com',
    });
    expect(result.status).toBe('sent');
    expect(dataStore.emailDeliveryStatus).toBe('sent');
  });
});

describe('BUILD-302C security contracts', () => {
  it('Test 14 — client cannot update delivery status (rules still create-only)', () => {
    const rules = readRoot('firestore.rules');
    const start = rules.indexOf('match /feedback/{docId}');
    expect(start).toBeGreaterThanOrEqual(0);
    const block = rules.slice(start, start + 900);
    expect(block).toMatch(/allow update,\s*delete:\s*if false/);
    expect(block).toContain("emailDeliveryStatus == 'pending'");
  });

  it('Test 15 — delivery path scopes entity titles by organisation', () => {
    const src = read('lib/feedback/feedback-email-delivery.ts');
    expect(src).toContain('organisationId');
    expect(src).toContain('organizationId');
    // Tenant checks on entity reads
    expect(src).toMatch(/org === organisationId|organizationId === organisationId/);
  });

  it('Test 16 — missing optional identity still renders', () => {
    const html = renderFeedbackEmailHtml({
      message: 'Still works',
      context: resolveFeedbackContext('/dashboard'),
      identity: {
        userName: 'User',
        userEmail: '',
        userId: 'u1',
        role: null,
        organisationName: 'Org',
        organisationId: 'org-a',
      },
      timestampLabel: 't',
      route: '/dashboard',
    });
    expect(html).toContain('Still works');
    expect(html).toContain('u1');
    expect(html).not.toMatch(/>Role:</);
  });

  it('API route is server-side and uses Admin SDK', () => {
    const route = read('app/api/feedback/deliver-email/route.ts');
    expect(route).toContain('getAdminAuth');
    expect(route).toContain('getAdminDb');
    expect(route).toContain('deliverFeedbackEmail');
    expect(route).toContain('verifyIdToken');
    expect(route).not.toContain('NEXT_PUBLIC_FEEDBACK');
  });

  it('does not introduce feedback management UI or CRM', () => {
    const delivery = read('lib/feedback/feedback-email-delivery.ts');
    expect(delivery).not.toContain('ticket');
    expect(delivery).not.toContain('zendesk');
    expect(delivery).not.toContain('intercom');
  });
});
