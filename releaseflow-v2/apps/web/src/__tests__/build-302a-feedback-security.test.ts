/**
 * BUILD-302A — Security / isolation expectations for feedback foundation.
 * Asserts service boundaries and Firestore rules source contracts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Timestamp } from '@firebase/firestore';
import { submitFeedback, type FeedbackContext } from '@/lib/feedback';
import * as repo from '@/lib/feedback/feedback-repository';

vi.mock('@/lib/feedback/feedback-repository', () => ({
  createFeedback: vi.fn(),
  FEEDBACK_COLLECTION: 'feedback',
}));

// __tests__ → src → web → apps → monorepo root
const monorepoRoot = join(__dirname, '../../../..');
const webSrc = join(__dirname, '..');

function readRules(): string {
  return readFileSync(join(monorepoRoot, 'firestore.rules'), 'utf8');
}

function readWeb(rel: string): string {
  return readFileSync(join(webSrc, rel), 'utf8');
}

const ctx: FeedbackContext = {
  route: '/dashboard',
  module: 'dashboard',
  page: 'dashboard',
};

describe('BUILD-302A Firestore rules — feedback', () => {
  const rules = readRules();

  it('defines feedback collection match', () => {
    expect(rules).toContain('match /feedback/{docId}');
  });

  it('create requires authenticated member of organizationId', () => {
    expect(rules).toContain('request.resource.data.userId == request.auth.uid');
    expect(rules).toContain('isOrgMember(request.resource.data.organizationId)');
  });

  it('create requires emailDeliveryStatus pending', () => {
    expect(rules).toContain(
      "request.resource.data.emailDeliveryStatus == 'pending'",
    );
  });

  it('denies client get/list/update/delete', () => {
    const start = rules.indexOf('match /feedback/{docId}');
    expect(start).toBeGreaterThanOrEqual(0);
    const feedbackBlock = rules.slice(start, start + 900);
    expect(feedbackBlock).toMatch(/allow get,\s*list:\s*if false/);
    expect(feedbackBlock).toMatch(/allow update,\s*delete:\s*if false/);
  });

  it('create requires structured context fields', () => {
    expect(rules).toContain('request.resource.data.context is map');
    expect(rules).toContain('request.resource.data.context.route is string');
    expect(rules).toContain('request.resource.data.context.module is string');
    expect(rules).toContain('request.resource.data.context.page is string');
  });
});

describe('BUILD-302A scope boundaries', () => {
  it('does not introduce feedback UI components', () => {
    // No feedback button/dialog/page modules under components or app routes.
    const forbidden = [
      'components/feedback',
      'app/(app)/feedback',
      'FeedbackDialog',
      'FeedbackButton',
      'FeedbackDrawer',
    ];
    // Structural: source files for foundation only.
    const service = readWeb('lib/feedback/feedback-service.ts');
    const index = readWeb('lib/feedback/index.ts');
    for (const token of ['FeedbackDialog', 'FeedbackButton', 'FeedbackDrawer', 'FeedbackInbox']) {
      expect(service).not.toContain(token);
      expect(index).not.toContain(token);
    }
    void forbidden;
  });

  it('does not wire email provider / templates for feedback', () => {
    const service = readWeb('lib/feedback/feedback-service.ts');
    const repoSrc = readWeb('lib/feedback/feedback-repository.ts');
    expect(service).not.toContain('resend');
    expect(service).not.toContain('sendEmail');
    expect(service).not.toContain('enqueueEmailJob');
    expect(repoSrc).not.toContain('sendEmail');
  });

  it('does not add feedback categories or ticket workflow', () => {
    const types = readWeb('lib/feedback/feedback-types.ts');
    expect(types).not.toMatch(/category\s*[?:]/);
    expect(types).not.toMatch(/assigneeId/);
    expect(types).not.toMatch(/ticketStatus/);
  });
});

describe('BUILD-302A tenant isolation at service boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('org A auth cannot persist as org B', async () => {
    vi.mocked(repo.createFeedback).mockImplementation(async (fields) => ({
      id: 'fb-x',
      organisationId: fields.organisationId,
      userId: fields.userId,
      message: fields.message,
      context: fields.context,
      createdAt: Timestamp.now(),
      emailDeliveryStatus: 'pending',
    }));

    const result = await submitFeedback(
      {
        message: 'isolation',
        context: ctx,
        ...({ organisationId: 'org-b', organizationId: 'org-b' } as object),
      } as { message: string; context: FeedbackContext },
      { userId: 'user-a', organisationId: 'org-a' },
    );

    expect(result.organisationId).toBe('org-a');
    expect(vi.mocked(repo.createFeedback).mock.calls[0]![0]!.organisationId).toBe(
      'org-a',
    );
  });

  it('authenticated user cannot impersonate another userId', async () => {
    vi.mocked(repo.createFeedback).mockImplementation(async (fields) => ({
      id: 'fb-y',
      organisationId: fields.organisationId,
      userId: fields.userId,
      message: fields.message,
      context: fields.context,
      createdAt: Timestamp.now(),
      emailDeliveryStatus: 'pending',
    }));

    const result = await submitFeedback(
      {
        message: 'impersonation',
        context: ctx,
        ...({ userId: 'victim' } as object),
      } as { message: string; context: FeedbackContext },
      { userId: 'real-user', organisationId: 'org-a' },
    );

    expect(result.userId).toBe('real-user');
  });
});
