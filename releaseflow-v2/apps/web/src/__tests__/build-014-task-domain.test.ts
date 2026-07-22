/**
 * BUILD-014 — Task domain unit tests (no Firestore).
 */
import { describe, it, expect } from 'vitest';
import {
  canTransitionTaskStatus,
  sortTasksDefault,
  TASK_ASSIGNMENT_ROLE,
  type TaskWithAssignment,
  type TaskRecord,
} from '@/lib/task-service';
import type { AssignmentRecord } from '@/lib/assignment-service';

function task(partial: Partial<TaskRecord> & Pick<TaskRecord, 'id' | 'title' | 'status' | 'priority'>): TaskRecord {
  return {
    organisationId: 'org1',
    createdBy: 'user1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    releaseId: null,
    description: null,
    dueDate: null,
    reminderAt: null,
    completedAt: null,
    ...partial,
  };
}

function row(
  t: TaskRecord,
  assignment: AssignmentRecord | null = null,
): TaskWithAssignment {
  return { task: t, assignment };
}

describe('BUILD-014 Task status lifecycle', () => {
  it('allows not_started → in_progress → review → completed', () => {
    expect(canTransitionTaskStatus('not_started', 'in_progress')).toBe(true);
    expect(canTransitionTaskStatus('in_progress', 'review')).toBe(true);
    expect(canTransitionTaskStatus('review', 'completed')).toBe(true);
  });

  it('allows blocked path and cancel from open states', () => {
    expect(canTransitionTaskStatus('not_started', 'blocked')).toBe(true);
    expect(canTransitionTaskStatus('blocked', 'in_progress')).toBe(true);
    expect(canTransitionTaskStatus('review', 'in_progress')).toBe(true);
    expect(canTransitionTaskStatus('in_progress', 'cancelled')).toBe(true);
    expect(canTransitionTaskStatus('not_started', 'cancelled')).toBe(true);
  });

  it('does not allow leave completed via normal transitions except same status', () => {
    expect(canTransitionTaskStatus('completed', 'in_progress')).toBe(false);
    expect(canTransitionTaskStatus('completed', 'completed')).toBe(true);
  });
});

describe('BUILD-014 Task sort order', () => {
  it('orders overdue before due today before high priority before upcoming', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);

    const rows = sortTasksDefault([
      row(task({
        id: 'upcoming-low',
        title: 'Upcoming',
        status: 'not_started',
        priority: 'low',
        dueDate: nextWeek,
      })),
      row(task({
        id: 'high-no-due',
        title: 'High',
        status: 'in_progress',
        priority: 'high',
        dueDate: null,
      })),
      row(task({
        id: 'due-today',
        title: 'Today',
        status: 'not_started',
        priority: 'low',
        dueDate: today,
      })),
      row(task({
        id: 'overdue',
        title: 'Overdue',
        status: 'in_progress',
        priority: 'medium',
        dueDate: yesterday,
      })),
    ]);

    expect(rows.map((r) => r.task.id)).toEqual([
      'overdue',
      'due-today',
      'high-no-due',
      'upcoming-low',
    ]);
  });
});

describe('BUILD-014 Task model constraints', () => {
  it('uses assignment role assignee for task ownership link', () => {
    expect(TASK_ASSIGNMENT_ROLE).toBe('assignee');
  });

  it('TaskRecord has no assignee fields', () => {
    const sample = task({
      id: 't1',
      title: 'Upload masters',
      status: 'not_started',
      priority: 'medium',
    });
    const keys = Object.keys(sample);
    expect(keys).not.toContain('assigneeId');
    expect(keys).not.toContain('assignedTo');
    expect(keys).not.toContain('assigneeUserId');
    expect(keys).toContain('organisationId');
    expect(keys).toContain('reminderAt');
  });
});
