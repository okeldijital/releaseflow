/**
 * ARS-003 — assignment identity matching.
 */

import { describe, expect, it } from 'vitest';
import { assignmentMatchesIdentity } from '@/lib/assignment-identity';

describe('ARS-003 assignment identity', () => {
  it('matches canonical Person.id on assigneeId', () => {
    const keys = new Set(['person-1', 'uid-auth']);
    expect(
      assignmentMatchesIdentity(
        { assigneeId: 'person-1', assigneeUserId: null },
        keys,
      ),
    ).toBe(true);
  });

  it('matches denormalized assigneeUserId', () => {
    const keys = new Set(['uid-auth']);
    expect(
      assignmentMatchesIdentity(
        { assigneeId: 'person-1', assigneeUserId: 'uid-auth' },
        keys,
      ),
    ).toBe(true);
  });

  it('does not match unrelated identities', () => {
    const keys = new Set(['uid-other']);
    expect(
      assignmentMatchesIdentity(
        { assigneeId: 'person-1', assigneeUserId: 'uid-auth' },
        keys,
      ),
    ).toBe(false);
  });
});
