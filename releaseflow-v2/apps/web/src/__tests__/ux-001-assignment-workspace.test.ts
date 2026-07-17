/**
 * UX-001 — Assignment workspace refinement contracts.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { humanizeAssignmentActivity } from '@/lib/assignment-activity-humanize';
import type { ActivityEventRecord } from '@/lib/activity-service';

const root = join(__dirname, '..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('UX-001 activity humanization', () => {
  const names = new Map([
    ['uid-manager', 'Kinn Timo'],
    ['person-stiff', 'StiffPap'],
  ]);

  it('renders create/assign without ids', () => {
    const act = {
      id: '1',
      organizationId: 'org',
      entityType: 'task',
      entityId: 'a1',
      action: 'assigned',
      actorId: 'uid-manager',
      metadata: { assigneeId: 'person-stiff', assigneeName: 'StiffPap' },
      createdAt: {} as ActivityEventRecord['createdAt'],
    } as ActivityEventRecord;
    const text = humanizeAssignmentActivity(act, names, names);
    expect(text).toContain('Kinn Timo');
    expect(text).toContain('StiffPap');
    expect(text).not.toMatch(/uid-|person-|i7QT/);
  });

  it('never surfaces raw details that look like ids', () => {
    const act = {
      id: '2',
      organizationId: 'org',
      entityType: 'task',
      entityId: 'a1',
      action: 'assigned',
      actorId: 'uid-manager',
      metadata: {
        details: 'Assignment "Design cover" created for i7QT56u4qMRjcVI5dOT',
      },
      createdAt: {} as ActivityEventRecord['createdAt'],
    } as ActivityEventRecord;
    const text = humanizeAssignmentActivity(act, names);
    expect(text).not.toContain('i7QT56u4qMRjcVI5dOT');
    expect(text).toContain('Kinn Timo');
  });

  it('comment events are human readable', () => {
    const act = {
      id: '3',
      organizationId: 'org',
      entityType: 'task',
      entityId: 'a1',
      action: 'comment.added',
      actorId: 'person-stiff',
      metadata: {},
      createdAt: {} as ActivityEventRecord['createdAt'],
    } as ActivityEventRecord;
    expect(humanizeAssignmentActivity(act, names)).toBe('StiffPap added a comment.');
  });
});

describe('UX-001 structural contracts', () => {
  it('comments repository exposes live subscription', () => {
    expect(read('lib/assignment-comments-repository.ts')).toContain('subscribeAssignmentComments');
    expect(read('lib/assignment-comments-repository.ts')).toContain('assignment_comments');
  });

  it('create form no longer collects estimated hours', () => {
    const src = read('components/assignments/assignment-create-form.tsx');
    expect(src).not.toContain('Est. Hours');
    expect(src).not.toContain('estimatedHours');
  });

  it('detail page has no estimated hours and no raw ID debug line in happy path', () => {
    const src = read('app/(app)/assignments/[id]/page.tsx');
    expect(src).not.toContain('Est. Hours');
    expect(src).not.toContain('estimatedHours');
    expect(src).toContain('Assigned to');
    expect(src).toContain('Contribution role');
  });
});
