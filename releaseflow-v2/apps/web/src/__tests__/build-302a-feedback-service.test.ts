/**
 * BUILD-302A — Feedback service & repository behaviour.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from '@firebase/firestore';
import {
  submitFeedback,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  type Feedback,
  type FeedbackContext,
} from '@/lib/feedback';
import * as repo from '@/lib/feedback/feedback-repository';

vi.mock('@/lib/feedback/feedback-repository', () => ({
  createFeedback: vi.fn(),
  FEEDBACK_COLLECTION: 'feedback',
}));

const baseContext: FeedbackContext = {
  route: '/releases/rel-1',
  module: 'releases',
  page: 'release',
  releaseId: 'rel-1',
};

const auth = {
  userId: 'user-auth-1',
  organisationId: 'org-a',
};

function fakeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 'fb-1',
    organisationId: auth.organisationId,
    userId: auth.userId,
    message: 'Something is wrong',
    context: baseContext,
    createdAt: Timestamp.fromDate(new Date('2026-08-09T12:00:00Z')),
    emailDeliveryStatus: 'pending',
    ...overrides,
  };
}

describe('BUILD-302A submitFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Test 1 — creates feedback with valid message and context', async () => {
    const created = fakeFeedback();
    vi.mocked(repo.createFeedback).mockResolvedValue(created);

    const result = await submitFeedback(
      { message: 'Something is wrong', context: baseContext },
      auth,
    );

    expect(result).toEqual(created);
    expect(repo.createFeedback).toHaveBeenCalledOnce();
    expect(repo.createFeedback).toHaveBeenCalledWith({
      organisationId: 'org-a',
      userId: 'user-auth-1',
      message: 'Something is wrong',
      context: baseContext,
      emailDeliveryStatus: 'pending',
    });
  });

  it('Test 2 — user ID is derived from auth; provided user ID is ignored', async () => {
    vi.mocked(repo.createFeedback).mockResolvedValue(fakeFeedback());

    const malicious = {
      message: 'hi',
      context: baseContext,
      userId: 'impersonated-user',
    };

    await submitFeedback(malicious as typeof malicious & { message: string; context: FeedbackContext }, auth);

    const call = vi.mocked(repo.createFeedback).mock.calls[0]![0]!;
    expect(call.userId).toBe('user-auth-1');
    expect(call.userId).not.toBe('impersonated-user');
  });

  it('Test 3 — organisation ID is derived from auth; cross-tenant org rejected/ignored', async () => {
    vi.mocked(repo.createFeedback).mockResolvedValue(fakeFeedback());

    const malicious = {
      message: 'hi',
      context: baseContext,
      organisationId: 'org-b',
      organizationId: 'org-b',
    };

    await submitFeedback(
      malicious as typeof malicious & { message: string; context: FeedbackContext },
      auth,
    );

    const call = vi.mocked(repo.createFeedback).mock.calls[0]![0]!;
    expect(call.organisationId).toBe('org-a');
    expect(call.organisationId).not.toBe('org-b');
  });

  it('Test 4 — empty message rejected', async () => {
    await expect(
      submitFeedback({ message: '', context: baseContext }, auth),
    ).rejects.toThrow('Feedback message is required');
    expect(repo.createFeedback).not.toHaveBeenCalled();
  });

  it('Test 5 — whitespace-only message rejected', async () => {
    await expect(
      submitFeedback({ message: '     ', context: baseContext }, auth),
    ).rejects.toThrow('Feedback message is required');
    expect(repo.createFeedback).not.toHaveBeenCalled();
  });

  it('Test 6 — message is trimmed', async () => {
    vi.mocked(repo.createFeedback).mockResolvedValue(
      fakeFeedback({ message: 'Something is wrong' }),
    );

    await submitFeedback(
      { message: '  Something is wrong  ', context: baseContext },
      auth,
    );

    const call = vi.mocked(repo.createFeedback).mock.calls[0]![0]!;
    expect(call.message).toBe('Something is wrong');
  });

  it('Test 7 — context is persisted (route/module/page/entity IDs)', async () => {
    const ctx: FeedbackContext = {
      route: '/tracks/trk-9',
      module: 'tracks',
      page: 'track',
      trackId: 'trk-9',
      releaseId: 'rel-2',
    };
    vi.mocked(repo.createFeedback).mockResolvedValue(
      fakeFeedback({ context: ctx }),
    );

    await submitFeedback({ message: 'Track issue', context: ctx }, auth);

    const call = vi.mocked(repo.createFeedback).mock.calls[0]![0]!;
    expect(call.context).toEqual(ctx);
    expect(call.context.route).toBe('/tracks/trk-9');
    expect(call.context.module).toBe('tracks');
    expect(call.context.page).toBe('track');
    expect(call.context.trackId).toBe('trk-9');
    expect(call.context.releaseId).toBe('rel-2');
  });

  it('Test 8 — createdAt is not taken from client input', async () => {
    const clientStamp = Timestamp.fromDate(new Date('2000-01-01'));
    vi.mocked(repo.createFeedback).mockImplementation(async (fields) =>
      fakeFeedback({
        message: fields.message,
        // repository generates createdAt — simulate that here
        createdAt: Timestamp.fromDate(new Date('2026-08-09T15:00:00Z')),
      }),
    );

    const result = await submitFeedback(
      {
        message: 'ts test',
        context: baseContext,
        // @ts-expect-error — client must not supply createdAt
        createdAt: clientStamp,
        emailDeliveryStatus: 'sent',
      },
      auth,
    );

    const call = vi.mocked(repo.createFeedback).mock.calls[0]![0]!;
    expect(call).not.toHaveProperty('createdAt');
    expect(call.emailDeliveryStatus).toBe('pending');
    expect(result.createdAt).not.toEqual(clientStamp);
  });

  it('Test 9 — initial emailDeliveryStatus is pending', async () => {
    vi.mocked(repo.createFeedback).mockResolvedValue(fakeFeedback());

    await submitFeedback({ message: 'email state', context: baseContext }, auth);

    const call = vi.mocked(repo.createFeedback).mock.calls[0]![0]!;
    expect(call.emailDeliveryStatus).toBe('pending');
  });

  it('Test 10 — cross-tenant isolation: auth org B cannot be swapped by input', async () => {
    const authB = { userId: 'user-b', organisationId: 'org-b' };
    vi.mocked(repo.createFeedback).mockResolvedValue(
      fakeFeedback({ organisationId: 'org-b', userId: 'user-b' }),
    );

    await submitFeedback(
      {
        message: 'from B',
        context: baseContext,
        // attempt to write into org-a
        ...({ organisationId: 'org-a' } as object),
      } as { message: string; context: FeedbackContext },
      authB,
    );

    const call = vi.mocked(repo.createFeedback).mock.calls[0]![0]!;
    expect(call.organisationId).toBe('org-b');
    expect(call.userId).toBe('user-b');
  });

  it('rejects missing auth user', async () => {
    await expect(
      submitFeedback(
        { message: 'x', context: baseContext },
        { userId: '', organisationId: 'org-a' },
      ),
    ).rejects.toThrow('Authenticated user is required');
  });

  it('rejects missing active organisation', async () => {
    await expect(
      submitFeedback(
        { message: 'x', context: baseContext },
        { userId: 'u1', organisationId: '' },
      ),
    ).rejects.toThrow('Active organisation is required');
  });

  it('rejects non-string message', async () => {
    await expect(
      submitFeedback(
        { message: 42 as unknown as string, context: baseContext },
        auth,
      ),
    ).rejects.toThrow('Feedback message must be a string');
  });

  it('rejects missing context fields', async () => {
    await expect(
      submitFeedback(
        { message: 'ok', context: { route: '', module: 'm', page: 'p' } },
        auth,
      ),
    ).rejects.toThrow('Feedback context.route is required');
  });

  it('rejects oversized messages', async () => {
    const huge = 'x'.repeat(FEEDBACK_MESSAGE_MAX_LENGTH + 1);
    await expect(
      submitFeedback({ message: huge, context: baseContext }, auth),
    ).rejects.toThrow(/at most/);
  });

  it('compacts null-like optional entity fields out of context', async () => {
    vi.mocked(repo.createFeedback).mockResolvedValue(fakeFeedback());

    await submitFeedback(
      {
        message: 'dashboard note',
        context: {
          route: '/dashboard',
          module: 'dashboard',
          page: 'dashboard',
          releaseId: undefined,
          trackId: undefined,
        },
      },
      auth,
    );

    const call = vi.mocked(repo.createFeedback).mock.calls[0]![0]!;
    expect(call.context).toEqual({
      route: '/dashboard',
      module: 'dashboard',
      page: 'dashboard',
    });
    expect(call.context).not.toHaveProperty('releaseId');
    expect(call.context).not.toHaveProperty('trackId');
  });
});

describe('BUILD-302A feedback domain model shape', () => {
  it('Feedback contains required EPIC fields', () => {
    const sample = fakeFeedback();
    expect(sample).toMatchObject({
      id: expect.any(String),
      organisationId: expect.any(String),
      userId: expect.any(String),
      message: expect.any(String),
      context: expect.objectContaining({
        route: expect.any(String),
        module: expect.any(String),
        page: expect.any(String),
      }),
      createdAt: expect.anything(),
      emailDeliveryStatus: 'pending',
    });
    // No category / ticket workflow fields
    expect(sample).not.toHaveProperty('category');
    expect(sample).not.toHaveProperty('status');
    expect(sample).not.toHaveProperty('assigneeId');
  });
});
