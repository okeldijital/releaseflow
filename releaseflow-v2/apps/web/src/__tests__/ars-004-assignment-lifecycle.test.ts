/**
 * ARS-004.6 — Assignment lifecycle regression (unit / contract level).
 * Full browser E2E is manual; these tests lock service contracts.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('ARS-004 assignment domain finalization contracts', () => {
  it('createNewAssignment requires Person.userId (integrity)', () => {
    const src = read('lib/assignment-service.ts');
    expect(src).toContain('Person.userId missing');
    expect(src).toContain('processPendingEvents');
    expect(src).toContain('assignment.created');
  });

  it('repository owns real-time subscriptions', () => {
    const src = read('lib/assignment-repository.ts');
    expect(src).toContain('subscribeOrgAssignments');
    expect(src).toContain('subscribeEntityAssignments');
    expect(src).toContain('onSnapshot');
  });

  it('useAssignments consumes service subscriptions not direct firestore', () => {
    const src = read('hooks/useAssignment.ts');
    expect(src).toContain('subscribeOrgAssignments');
    expect(src).toContain('subscribeEntityAssignments');
    expect(src).not.toContain("from '@firebase/firestore'");
  });

  it('Release workspace does not import task-service for operational work', () => {
    const src = read('app/(app)/releases/[id]/page.tsx');
    expect(src).not.toContain('task-service');
    expect(src).not.toContain('getTasksByEntity');
    expect(src).toContain('Assignments');
    expect(src).toContain('Workflow');
  });

  it('work and contributor pages redirect away from Task UI', () => {
    expect(read('app/(app)/work/page.tsx')).toContain("router.replace('/assignments')");
    expect(read('app/(app)/contributor/page.tsx')).toContain("router.replace('/home')");
  });

  it('invitation acceptance always sets Person.userId', () => {
    const src = read('lib/invitation-service.ts');
    expect(src).toMatch(/userId:\s*user\.uid/);
    expect(src).toContain('invitationStatus: \'accepted\'');
  });

  it('identity comparisons for assignee use assignment-identity module in key pages', () => {
    expect(read('app/(app)/assignments/page.tsx')).toContain('assignmentMatchesIdentity');
    expect(read('app/(app)/home/page.tsx')).toContain('assignmentMatchesIdentity');
    expect(read('app/(app)/assignments/[id]/page.tsx')).toContain('assignmentMatchesIdentity');
  });
});
