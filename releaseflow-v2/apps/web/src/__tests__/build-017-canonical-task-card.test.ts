/**
 * BUILD-017 — Canonical Task Card
 *
 * Exactly one TaskCard, TaskCardModel, and toTaskCardModels mapper.
 * Dashboard, Tasks page, Release Details, and search use the canonical component.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  toTaskCardModel,
  formatTaskDueLabel,
  formatTaskReminderLabel,
  computeTaskProgress,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type TaskCardModel,
} from '@/lib/task-card-model';
import type { TaskRecord } from '@/lib/task-repository';

const root = join(__dirname, '..');
const cardPath = join(root, 'components/tasks/TaskCard.tsx');
const modelPath = join(root, 'lib/task-card-model.ts');
const servicePath = join(root, 'lib/task-service.ts');
const tasksPagePath = join(root, 'app/(app)/tasks/page.tsx');
const tasksSectionPath = join(root, 'components/tasks/tasks-section.tsx');
const dashboardPath = join(root, 'app/(app)/dashboard/page.tsx');
const hookPath = join(root, 'hooks/useTask.ts');

function walkTsx(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkTsx(p, acc);
    else if (/\.(tsx|ts)$/.test(name)) acc.push(p);
  }
  return acc;
}

function baseTask(over: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: 't1',
    organisationId: 'org1',
    releaseId: null,
    title: 'Update artwork for DSP delivery',
    description: null,
    status: 'in_progress',
    priority: 'high',
    dueDate: null,
    reminderAt: null,
    createdBy: 'u1',
    createdAt: null,
    updatedAt: null,
    completedAt: null,
    ...over,
  };
}

describe('BUILD-017 single TaskCard component', () => {
  const src = readFileSync(cardPath, 'utf8');

  it('exposes size compact | standard | large only', () => {
    expect(src).toContain("export type TaskCardSize = 'compact' | 'standard' | 'large'");
    expect(src).toContain('SIZE_STYLES');
  });

  it('implements one layout (priority, title, assignee, release, due, progress, menu)', () => {
    expect(src).toContain('line-clamp-2');
    expect(src).toContain('EntityOverflowMenu');
    expect(src).toContain('task.priority');
    expect(src).toContain('task.assignee');
    expect(src).toContain('task.release');
    expect(src).toContain('task.dueLabel');
    expect(src).toContain('task.reminderLabel');
    expect(src).toContain('ProgressBar');
    expect(src).toContain('StatusBadge');
  });

  it('does not fork separate list/table card layouts', () => {
    expect(src).not.toContain('renderListRow');
    expect(src).not.toContain('renderTableRow');
    expect(src).not.toContain('renderCompactRow');
  });

  it('is the only TaskCard export in the web app', () => {
    const files = walkTsx(root).filter((f) => !f.includes('/__tests__/'));
    const defs = files.filter((f) => {
      const text = readFileSync(f, 'utf8');
      return /export function TaskCard\b/.test(text) || /export const TaskCard\b/.test(text);
    });
    expect(defs).toEqual([cardPath]);
  });
});

describe('BUILD-017 TaskCardModel + mapper', () => {
  const modelSrc = readFileSync(modelPath, 'utf8');
  const serviceSrc = readFileSync(servicePath, 'utf8');

  it('defines exactly one TaskCardModel interface', () => {
    expect(modelSrc).toContain('export interface TaskCardModel');
    expect(modelSrc.match(/export interface TaskCardModel/g)?.length).toBe(1);
  });

  it('defines toTaskCardModel and toTaskCardModels', () => {
    expect(modelSrc).toContain('export function toTaskCardModel');
    expect(modelSrc).toContain('export async function toTaskCardModels');
  });

  it('service re-exports mapper and provides listTaskCardModels', () => {
    expect(serviceSrc).toContain('listTaskCardModels');
    expect(serviceSrc).toContain('listTaskCardModelsByRelease');
    expect(serviceSrc).toContain("export { toTaskCardModel, toTaskCardModels }");
  });

  it('toTaskCardModel resolves priority/status labels and menu actions', () => {
    const model = toTaskCardModel(baseTask({ status: 'in_progress', priority: 'high' }));
    expect(model.priority).toBe(PRIORITY_LABELS.high);
    expect(model.status).toBe(STATUS_LABELS.in_progress);
    expect(model.menuActions).toContain('open');
    expect(model.menuActions).toContain('complete');
    expect(model.menuActions).toContain('edit');
    expect(model.menuActions).toContain('reassign');
    expect(model.menuActions).toContain('delete');
    expect(model.progress).toBe(50);
    expect(model.href).toBe('/tasks/t1');

    const completed = toTaskCardModel(baseTask({ status: 'completed' }));
    expect(completed.menuActions).not.toContain('complete');
    expect(completed.progress).toBe(100);
  });

  it('hides progress for blocked/cancelled', () => {
    expect(computeTaskProgress('blocked')).toBeNull();
    expect(computeTaskProgress('cancelled')).toBeNull();
    expect(toTaskCardModel(baseTask({ status: 'blocked' })).progress).toBeNull();
  });

  it('formats due labels without raw timestamps', () => {
    const now = new Date('2026-07-23T12:00:00Z');
    const today = new Date('2026-07-23T18:00:00Z');
    const tomorrow = new Date('2026-07-24T10:00:00Z');
    const in3 = new Date('2026-07-26T10:00:00Z');
    const overdue = new Date('2026-07-21T10:00:00Z');

    expect(formatTaskDueLabel(today, now, 'in_progress')).toEqual({
      label: 'Today',
      isOverdue: false,
    });
    expect(formatTaskDueLabel(tomorrow, now, 'in_progress')).toEqual({
      label: 'Tomorrow',
      isOverdue: false,
    });
    expect(formatTaskDueLabel(in3, now, 'in_progress')).toEqual({
      label: 'In 3 days',
      isOverdue: false,
    });
    expect(formatTaskDueLabel(overdue, now, 'in_progress')).toEqual({
      label: 'Overdue by 2 days',
      isOverdue: true,
    });
    expect(formatTaskDueLabel(null, now).label).toBeNull();
  });

  it('formats reminder labels when present', () => {
    const now = new Date('2026-07-23T12:00:00Z');
    const reminder = new Date('2026-07-23T14:00:00Z');
    const label = formatTaskReminderLabel(reminder, now);
    expect(label).toMatch(/^Today /);
    expect(formatTaskReminderLabel(null, now)).toBeNull();
  });

  it('includes assignee and release when provided; never invents them', () => {
    const bare: TaskCardModel = toTaskCardModel(baseTask());
    expect(bare.assignee).toBeNull();
    expect(bare.release).toBeNull();

    const withCtx = toTaskCardModel(baseTask({ releaseId: 'r1' }), {
      assignee: {
        personId: 'p1',
        userId: 'u1',
        displayName: 'Robert',
        avatarUrl: null,
      },
      release: {
        id: 'r1',
        title: 'Phansi Izizwe',
        artworkUrl: 'https://example.com/a.jpg',
      },
    });
    expect(withCtx.assignee?.displayName).toBe('Robert');
    expect(withCtx.release?.title).toBe('Phansi Izizwe');
  });

  it('batch mapper resolves assignees, releases, and artwork', () => {
    expect(modelSrc).toContain('resolveAssigneesBatch');
    expect(modelSrc).toContain('resolveReleasesBatch');
    expect(modelSrc).toContain('getArtworksByReleaseIds');
    expect(modelSrc).toContain('resolvePersonIdentity');
  });
});

describe('BUILD-017 call sites consume TaskCard', () => {
  it('tasks page uses TaskCard grid (catalogue search is global shell)', () => {
    const page = readFileSync(tasksPagePath, 'utf8');
    expect(page).toContain('TaskCard');
    expect(page).toContain('taskCards');
    expect(page).toContain('data-task-card-grid');
    expect(page).toContain('size="standard"');
    // Page-level catalogue search removed — global top bar owns search
    expect(page).not.toContain('placeholder="Search title or description');
    expect(page).not.toContain('<table');
    expect(page).not.toContain('resolvePersonNames');
  });

  it('release tasks section uses TaskCard', () => {
    const section = readFileSync(tasksSectionPath, 'utf8');
    expect(section).toContain('TaskCard');
    expect(section).toContain('taskCards');
    expect(section).toContain('data-release-tasks');
    expect(section).not.toContain('resolvePersonNames');
    expect(section).not.toContain('formatDate');
  });

  it('dashboard uses compact TaskCard for task details', () => {
    const dash = readFileSync(dashboardPath, 'utf8');
    expect(dash).toContain('TaskCard');
    expect(dash).toContain('size="compact"');
    expect(dash).toContain('data-dashboard-tasks');
    expect(dash).toContain('listTaskCardModels');
    // KPI metrics remain
    expect(dash).toContain('Assigned to Me');
  });

  it('useTasks maps via toTaskCardModels (no page-level mapping)', () => {
    const hook = readFileSync(hookPath, 'utf8');
    expect(hook).toContain('toTaskCardModels');
    expect(hook).toContain('taskCards');
  });
});

describe('BUILD-017 no parallel task card components', () => {
  it('no second task card implementation files', () => {
    const files = walkTsx(join(root, 'components'));
    const suspect = files.filter((f) => {
      const base = f.split('/').pop() ?? '';
      if (base === 'TaskCard.tsx') return false;
      return /task[-_]?card/i.test(base);
    });
    expect(suspect).toEqual([]);
  });
});
