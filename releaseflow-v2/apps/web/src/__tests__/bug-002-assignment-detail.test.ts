/**
 * BUG-002 — Assignment detail resolution contracts.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('BUG-002 assignment detail resolution', () => {
  it('card and section link with assignment document id', () => {
    expect(read('components/mobile/assignment-card.tsx')).toContain(
      'href={`/assignments/${assignment.id}`}',
    );
    expect(read('components/assignments-section.tsx')).toContain(
      'href={`/assignments/${a.id}`}',
    );
  });

  it('service exposes loadAssignmentDetail with distinct error codes', () => {
    const src = read('lib/assignment-service.ts');
    expect(src).toContain('loadAssignmentDetail');
    expect(src).toContain('org_mismatch');
    expect(src).toContain('not_found');
    expect(src).toContain('permission_denied');
  });

  it('repository getAssignment is document getDoc by id', () => {
    const src = read('lib/assignment-repository.ts');
    expect(src).toContain("doc(db, 'assignments', id)");
    expect(src).toContain('getDoc');
    expect(src).toContain('INVALID_ASSIGNMENT_ID');
    expect(src).toContain('FIRESTORE_UNAVAILABLE');
  });

  it('useAssignment does not wipe assignment when side channels fail', () => {
    const src = read('hooks/useAssignment.ts');
    expect(src).toContain('loadAssignmentDetail');
    expect(src).toContain('activity load failed');
    expect(src).toContain('deliverable links failed');
    // Must not use Promise.all that couples assignment fetch to activity
    expect(src).not.toMatch(
      /Promise\.all\(\[\s*fetchAssignment|Promise\.all\(\[\s*loadAssignmentDetail/,
    );
  });

  it('detail page distinguishes error states', () => {
    const src = read('app/(app)/assignments/[id]/page.tsx');
    expect(src).toContain('Wrong organization');
    expect(src).toContain('Permission denied');
    expect(src).toContain('Retry');
    expect(src).toContain('loadError');
  });
});
