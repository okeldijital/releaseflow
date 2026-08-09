/**
 * BUILD-302B — In-app feedback interface tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Timestamp } from '@firebase/firestore';
import {
  formatFeedbackContextDisplay,
  isFeedbackMessageReady,
  resolveFeedbackContext,
  sendFeedbackFromUi,
  type Feedback,
  type FeedbackContext,
} from '@/lib/feedback';
import * as feedbackService from '@/lib/feedback/feedback-service';

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

function read(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

function sampleFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 'fb-1',
    organisationId: 'org-a',
    userId: 'user-1',
    message: 'Hello',
    context: {
      route: '/dashboard',
      module: 'dashboard',
      page: 'dashboard',
    },
    createdAt: Timestamp.now(),
    emailDeliveryStatus: 'pending',
    ...overrides,
  };
}

describe('BUILD-302B shell integration', () => {
  it('Test 1 — trigger mounted once on authenticated app shell layout', () => {
    const layout = read('app/(app)/layout.tsx');
    expect(layout).toContain("from '@/components/feedback'");
    expect(layout).toContain('<FeedbackTrigger');
    // Single mount — not per-page
    expect(layout.match(/<FeedbackTrigger/g)?.length).toBe(1);
  });

  it('does not mount feedback on individual pages', () => {
    for (const page of [
      'app/(app)/dashboard/page.tsx',
      'app/(app)/releases/page.tsx',
      'app/(app)/tasks/page.tsx',
    ]) {
      const src = read(page);
      expect(src).not.toContain('FeedbackTrigger');
      expect(src).not.toContain('FeedbackPanel');
    }
  });
});

describe('BUILD-302B panel composition contracts', () => {
  it('Test 2/3 — panel uses Modal and required copy', () => {
    const panel = read('components/feedback/feedback-panel.tsx');
    expect(panel).toContain('Modal');
    expect(panel).toContain('from \'@releaseflow/ui\'');
    expect(panel).toContain('Send Feedback');
    expect(panel).toContain('What would you like to tell us?');
    expect(panel).toContain('Type your feedback...');
    expect(panel).toContain('Send');
    expect(panel).toContain('TextArea');
    expect(panel).toContain('Button');
  });

  it('trigger uses existing Button + Tooltip and accessible label', () => {
    const trigger = read('components/feedback/feedback-trigger.tsx');
    expect(trigger).toContain('Button');
    expect(trigger).toContain('Tooltip');
    expect(trigger).toContain('Send feedback');
    expect(trigger).toContain('aria-label');
    expect(trigger).toContain('aria-haspopup');
  });

  it('does not invent overlay/button/textarea primitives or Firestore', () => {
    const panel = read('components/feedback/feedback-panel.tsx');
    const trigger = read('components/feedback/feedback-trigger.tsx');
    for (const src of [panel, trigger]) {
      expect(src).not.toContain('getDb(');
      expect(src).not.toContain('addDoc');
      expect(src).not.toContain('setDoc');
      expect(src).not.toContain('collection(');
      expect(src).not.toContain('resend');
      expect(src).not.toContain('sendEmail');
      expect(src).not.toContain('category');
    }
  });

  it('uses toast store for success/error notifications', () => {
    const panel = read('components/feedback/feedback-panel.tsx');
    expect(panel).toContain("from '@/stores/toast-store'");
    expect(panel).toContain("toast.success('Feedback sent. Thank you.')");
    expect(panel).toContain('toast.error');
  });
});

describe('BUILD-302B context display', () => {
  it('Test 4 — Release + Track context lines', () => {
    const context = resolveFeedbackContext('/releases/lua/tracks/izizwe');
    const display = formatFeedbackContextDisplay(context);
    expect(display.label).toBe('Feedback about');
    expect(display.lines).toEqual(['Release: lua', 'Track: izizwe']);
  });

  it('Test 5 — Dashboard context', () => {
    const context = resolveFeedbackContext('/dashboard');
    const display = formatFeedbackContextDisplay(context);
    expect(display.label).toBe('Feedback about');
    expect(display.lines).toEqual(['Dashboard']);
  });

  it('context coverage — actual BUILD-302A routes', () => {
    const cases: Array<{ path: string; expectLine: string | RegExp }> = [
      { path: '/dashboard', expectLine: 'Dashboard' },
      { path: '/releases', expectLine: 'Releases' },
      { path: '/releases/rel-1', expectLine: 'Release: rel-1' },
      { path: '/tracks/trk-1', expectLine: 'Track: trk-1' },
      { path: '/artists/art-1', expectLine: 'Artist: art-1' },
      { path: '/assignments/asg-1', expectLine: 'Assignment: asg-1' },
      { path: '/tasks/task-1', expectLine: 'Task: task-1' },
      { path: '/notifications', expectLine: 'Notifications' },
      { path: '/comments', expectLine: 'Comments' },
      { path: '/assets', expectLine: 'Assets' },
      { path: '/assets/asset-1', expectLine: 'Asset: asset-1' },
      { path: '/profile', expectLine: 'Profile' },
      { path: '/administration/members', expectLine: /Members|Administration/ },
    ];

    for (const { path, expectLine } of cases) {
      const display = formatFeedbackContextDisplay(resolveFeedbackContext(path));
      expect(display.label).toBe('Feedback about');
      if (typeof expectLine === 'string') {
        expect(display.lines).toContain(expectLine);
      } else {
        expect(display.lines.some((l) => expectLine.test(l))).toBe(true);
      }
    }
  });
});

describe('BUILD-302B message readiness', () => {
  it('Test 6 — empty blocked', () => {
    expect(isFeedbackMessageReady('')).toBe(false);
  });

  it('Test 7 — whitespace blocked', () => {
    expect(isFeedbackMessageReady('   ')).toBe(false);
  });

  it('accepts non-empty trimmed content', () => {
    expect(isFeedbackMessageReady('  ok  ')).toBe(true);
  });
});

describe('BUILD-302B sendFeedbackFromUi integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const deliverOk = vi.fn(async () => ({
    emailDeliveryStatus: 'sent' as const,
  }));

  it('Test 6/7 — does not call submitFeedback for empty/whitespace', async () => {
    const submit = vi.fn();
    await sendFeedbackFromUi({
      message: '',
      pathname: '/dashboard',
      auth: { userId: 'u1', organisationId: 'org-a' },
      submit: submit as typeof feedbackService.submitFeedback,
      deliverEmail: deliverOk,
    });
    await sendFeedbackFromUi({
      message: '   ',
      pathname: '/dashboard',
      auth: { userId: 'u1', organisationId: 'org-a' },
      submit: submit as typeof feedbackService.submitFeedback,
      deliverEmail: deliverOk,
    });
    expect(submit).not.toHaveBeenCalled();
  });

  it('Test 8 — uses BUILD-302A submitFeedback service', async () => {
    const submit = vi.mocked(feedbackService.submitFeedback);
    submit.mockResolvedValue(sampleFeedback());

    const result = await sendFeedbackFromUi({
      message: 'Something is wrong',
      pathname: '/dashboard',
      auth: { userId: 'u1', organisationId: 'org-a' },
      deliverEmail: deliverOk,
    });

    expect(result.ok).toBe(true);
    expect(submit).toHaveBeenCalledOnce();
  });

  it('Test 9 — passes resolved context unchanged', async () => {
    const submit = vi.fn().mockResolvedValue(sampleFeedback());
    const pathname = '/releases/lua/tracks/izizwe';
    const expected = resolveFeedbackContext(pathname);

    await sendFeedbackFromUi({
      message: 'Track issue',
      pathname,
      auth: { userId: 'u1', organisationId: 'org-a' },
      submit: submit as typeof feedbackService.submitFeedback,
      deliverEmail: deliverOk,
    });

    expect(submit).toHaveBeenCalledWith(
      { message: 'Track issue', context: expected },
      { userId: 'u1', organisationId: 'org-a' },
    );
    const context = submit.mock.calls[0]![0]!.context as FeedbackContext;
    expect(context.releaseId).toBe('lua');
    expect(context.trackId).toBe('izizwe');
  });

  it('Test 10 — success result', async () => {
    const submit = vi.fn().mockResolvedValue(sampleFeedback({ message: 'Thanks' }));
    const result = await sendFeedbackFromUi({
      message: 'Thanks',
      pathname: '/dashboard',
      auth: { userId: 'u1', organisationId: 'org-a' },
      submit: submit as typeof feedbackService.submitFeedback,
      deliverEmail: deliverOk,
    });
    expect(result).toMatchObject({
      ok: true,
      feedback: expect.objectContaining({ message: 'Thanks' }),
      emailDeliveryStatus: 'sent',
      emailFailed: false,
    });
  });

  it('Test 11 — persistence failure keeps error for retry', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('Network down'));
    const result = await sendFeedbackFromUi({
      message: 'Still here',
      pathname: '/dashboard',
      auth: { userId: 'u1', organisationId: 'org-a' },
      submit: submit as typeof feedbackService.submitFeedback,
      deliverEmail: deliverOk,
    });
    expect(result).toEqual({
      ok: false,
      error: 'Network down',
      phase: 'persistence',
    });
    expect(deliverOk).not.toHaveBeenCalled();
  });

  it('Test 12 — duplicate submission protection at UI layer', () => {
    const panel = read('components/feedback/feedback-panel.tsx');
    expect(panel).toContain('submittingRef');
    expect(panel).toContain("submissionState === 'submitting'");
    expect(panel).toContain('disabled={!canSend}');
    expect(panel).toContain("loading={submissionState === 'submitting'}");
  });

  it('Test 13 — keyboard accessibility contracts', () => {
    const trigger = read('components/feedback/feedback-trigger.tsx');
    const panel = read('components/feedback/feedback-panel.tsx');
    // Modal provides Escape + focus trap; trigger is a real button with label
    expect(panel).toContain('Modal');
    expect(trigger).toContain('aria-label="Send feedback"');
    expect(panel).toContain('label="What would you like to tell us?"');
  });

  it('Test 14 — close without submit supported', () => {
    const panel = read('components/feedback/feedback-panel.tsx');
    expect(panel).toContain('onClose={onClose}');
    expect(panel).toContain('Cancel');
    // Modal handles Escape + overlay click
  });
});

describe('BUILD-302B no new design system / email', () => {
  it('does not add email provider or category UI', () => {
    const panel = read('components/feedback/feedback-panel.tsx');
    expect(panel).not.toMatch(/Suggestion|Problem|Question/);
    // No provider SDK / secrets in UI (emailFailed is the 302C result flag only)
    expect(panel).not.toContain('RESEND');
    expect(panel).not.toContain('sendEmail');
    expect(panel).not.toContain('FEEDBACK_NOTIFICATION_EMAIL');
  });

  it('panel submission states are explicit and minimal', () => {
    const panel = read('components/feedback/feedback-panel.tsx');
    expect(panel).toContain("'idle'");
    expect(panel).toContain("'submitting'");
    expect(panel).toContain("'success'");
    expect(panel).toContain("'error'");
  });
});
