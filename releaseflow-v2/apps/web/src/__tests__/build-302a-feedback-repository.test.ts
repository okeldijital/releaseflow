/**
 * BUILD-302A — Feedback repository create contract (mocked Firestore).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from '@firebase/firestore';

const addDoc = vi.fn();
const collection = vi.fn((_db: unknown, name: string) => ({ path: name }));

vi.mock('@firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('@firebase/firestore')>(
    '@firebase/firestore',
  );
  return {
    ...actual,
    addDoc: (...args: [unknown, unknown]) => addDoc(...args),
    collection: (...args: [unknown, string]) => collection(...args),
  };
});

vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn(() => ({ __fake: true })),
}));

import { createFeedback, FEEDBACK_COLLECTION } from '@/lib/feedback/feedback-repository';

describe('createFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addDoc.mockImplementation(async (_ref: unknown, data: Record<string, unknown>) => ({
      id: 'generated-fb-id',
      ...data,
    }));
  });

  it('persists dual organisation fields, pending status, and generated id', async () => {
    const result = await createFeedback({
      organisationId: 'org-a',
      userId: 'user-1',
      message: 'Hello',
      context: {
        route: '/dashboard',
        module: 'dashboard',
        page: 'dashboard',
      },
    });

    expect(collection).toHaveBeenCalledWith(
      expect.anything(),
      FEEDBACK_COLLECTION,
    );
    expect(FEEDBACK_COLLECTION).toBe('feedback');

    const payload = addDoc.mock.calls[0]![1]! as Record<string, unknown>;
    expect(payload.organisationId).toBe('org-a');
    expect(payload.organizationId).toBe('org-a');
    expect(payload.userId).toBe('user-1');
    expect(payload.message).toBe('Hello');
    expect(payload.emailDeliveryStatus).toBe('pending');
    expect(payload.createdAt).toBeInstanceOf(Timestamp);
    expect(payload.context).toEqual({
      route: '/dashboard',
      module: 'dashboard',
      page: 'dashboard',
    });

    expect(result.id).toBe('generated-fb-id');
    expect(result.emailDeliveryStatus).toBe('pending');
    expect(result.organisationId).toBe('org-a');
  });

  it('does not accept client createdAt override (always Timestamp.now)', async () => {
    await createFeedback({
      organisationId: 'org-a',
      userId: 'user-1',
      message: 'ts',
      context: { route: '/r', module: 'm', page: 'p' },
    });
    const payload = addDoc.mock.calls[0]![1]! as Record<string, unknown>;
    expect(payload.createdAt).toBeInstanceOf(Timestamp);
  });

  it('compacts empty optional context entity keys', async () => {
    await createFeedback({
      organisationId: 'org-a',
      userId: 'user-1',
      message: 'ctx',
      context: {
        route: '/dashboard',
        module: 'dashboard',
        page: 'dashboard',
        releaseId: undefined,
      },
    });
    const payload = addDoc.mock.calls[0]![1]! as { context: Record<string, unknown> };
    expect(payload.context).not.toHaveProperty('releaseId');
  });
});
