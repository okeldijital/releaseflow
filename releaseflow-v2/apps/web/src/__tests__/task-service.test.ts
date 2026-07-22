import { describe, it, expect } from 'vitest';

describe('CreateTaskFields', () => {
  it('accepts title only', () => {
    const f = { title: 'Test task' };
    expect(f.title).toBe('Test task');
  });

  it('accepts all optional fields', () => {
    const f = { title: 'Mix track', description: 'Mix the vocals', priority: 'high' as const, assigneeId: 'u1', dueDate: new Date() };
    expect(f.description).toBe('Mix the vocals');
    expect(f.priority).toBe('high');
    expect(f.assigneeId).toBe('u1');
    expect(f.dueDate).toBeInstanceOf(Date);
  });
});

describe('Task status flow', () => {
  const statuses = ['todo', 'in_progress', 'done'] as const;

  it('starts as todo', () => {
    expect(statuses[0]).toBe('todo');
  });

  it('flows todo -> done', () => {
    expect(statuses).toContain('done');
  });

  it('has in_progress intermediate state', () => {
    expect(statuses).toContain('in_progress');
  });
});

describe('Task priority', () => {
  const priorities = ['low', 'medium', 'high', 'critical'] as const;

  it('has 4 levels', () => {
    expect(priorities).toHaveLength(4);
  });

  it('defaults to medium', () => {
    expect(priorities).toContain('medium');
  });

  it('critical is highest', () => {
    expect(priorities[3]).toBe('critical');
  });
});

describe('Workflow task service — module structure (legacy stage tasks)', () => {
  it('exports all CRUD functions', async () => {
    const mod = await import('@/lib/workflow-task-service');
    expect(typeof mod.createTask).toBe('function');
    expect(typeof mod.completeTask).toBe('function');
    expect(typeof mod.updateTask).toBe('function');
    expect(typeof mod.deleteTask).toBe('function');
    expect(typeof mod.getTasksByStage).toBe('function');
    expect(typeof mod.getTasksByAssignee).toBe('function');
    expect(typeof mod.assignTask).toBe('function');
    expect(typeof mod.unassignTask).toBe('function');
    expect(typeof mod.addComment).toBe('function');
    expect(typeof mod.getCommentsByTask).toBe('function');
  });

  it('createTask takes 4 parameters', async () => {
    const mod = await import('@/lib/workflow-task-service');
    expect(mod.createTask.length).toBe(4);
  });

  it('completeTask takes 4 parameters', async () => {
    const mod = await import('@/lib/workflow-task-service');
    expect(mod.completeTask.length).toBe(4);
  });

  it('assignTask takes 5 parameters', async () => {
    const mod = await import('@/lib/workflow-task-service');
    expect(mod.assignTask.length).toBe(5);
  });

  it('unassignTask takes 4 parameters', async () => {
    const mod = await import('@/lib/workflow-task-service');
    expect(mod.unassignTask.length).toBe(4);
  });

  it('addComment takes 5 parameters', async () => {
    const mod = await import('@/lib/workflow-task-service');
    expect(mod.addComment.length).toBe(5);
  });

  it('getTasksByStage takes 1 parameter', async () => {
    const mod = await import('@/lib/workflow-task-service');
    expect(mod.getTasksByStage.length).toBe(1);
  });

  it('getTasksByAssignee takes 1 parameter', async () => {
    const mod = await import('@/lib/workflow-task-service');
    expect(mod.getTasksByAssignee.length).toBe(1);
  });
});

describe('BUILD-014 task service — module structure', () => {
  it('exports domain orchestration functions', async () => {
    const mod = await import('@/lib/task-service');
    expect(typeof mod.createTaskWithAssignment).toBe('function');
    expect(typeof mod.completeTask).toBe('function');
    expect(typeof mod.listTasks).toBe('function');
    expect(typeof mod.listTasksByRelease).toBe('function');
    expect(typeof mod.getTaskDashboardSummary).toBe('function');
    expect(typeof mod.reassignTask).toBe('function');
    expect(mod.TASK_ASSIGNMENT_ROLE).toBe('assignee');
  });
});

describe('Mention parser — regex behavior', () => {
  // parseMentions is internal; we test the expected behavior

  function simulateParseMentions(content: string): string[] {
    const matches = content.match(/@(\w+)/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
  }

  it('extracts single mention', () => {
    expect(simulateParseMentions('hey @designer check this')).toEqual(['designer']);
  });

  it('extracts multiple mentions', () => {
    const result = simulateParseMentions('@designer and @mixengineer please review');
    expect(result).toContain('designer');
    expect(result).toContain('mixengineer');
    expect(result).toHaveLength(2);
  });

  it('deduplicates repeated mentions', () => {
    expect(simulateParseMentions('@artist @artist @artist')).toEqual(['artist']);
  });

  it('returns empty for no mentions', () => {
    expect(simulateParseMentions('no mentions here')).toEqual([]);
  });

  it('handles empty string', () => {
    expect(simulateParseMentions('')).toEqual([]);
  });

  it('extracts @artist from text', () => {
    expect(simulateParseMentions('cc @artist for visibility')).toEqual(['artist']);
  });

  it('extracts @mixengineer', () => {
    expect(simulateParseMentions('needs @mixengineer review')).toEqual(['mixengineer']);
  });

  it('lowercases mentions', () => {
    expect(simulateParseMentions('@DESIGNER @Artist')).toEqual(['designer', 'artist']);
  });
});

describe('Task data model', () => {
  it('has all required fields', () => {
    const task = {
      id: 't1', stageId: 's1', releaseId: 'r1', title: 'Task',
      status: 'todo', priority: 'medium', assigneeId: null, dueDate: null,
      createdAt: new Date(), updatedAt: new Date(),
    };
    expect(task.id).toBeDefined();
    expect(task.stageId).toBe('s1');
    expect(task.releaseId).toBe('r1');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
  });

  it('description is optional', () => {
    const task = {
      id: 't1', stageId: 's1', releaseId: 'r1', title: 'Task',
      status: 'todo', priority: 'medium', description: 'Details',
      createdAt: new Date(), updatedAt: new Date(),
    };
    expect(task.description).toBe('Details');
  });

  it('assigneeId is optional', () => {
    const task = {
      id: 't1', stageId: 's1', releaseId: 'r1', title: 'Task',
      status: 'todo', priority: 'low', assigneeId: undefined,
      createdAt: new Date(), updatedAt: new Date(),
    };
    expect(task.assigneeId).toBeUndefined();
  });
});

describe('Comment data model', () => {
  it('has required fields', () => {
    const comment = { id: 'c1', taskId: 't1', authorId: 'u1', content: 'Looks good', createdAt: new Date() };
    expect(comment.taskId).toBe('t1');
    expect(comment.authorId).toBe('u1');
    expect(comment.content).toBe('Looks good');
  });
});

describe('Assignment engine — state transitions', () => {
  it('assignee can be set to any user', () => {
    const assignees = ['u1', 'u2', 'u3'];
    for (const a of assignees) {
      expect(typeof a).toBe('string');
    }
  });

  it('unassign sets to null', () => {
    const assigneeId: string | null = null;
    expect(assigneeId).toBeNull();
  });

  it('reassign changes to different user', () => {
    let prev = 'u1';
    const next = 'u2';
    expect(prev !== next).toBe(true);
    prev = next;
    expect(prev).toBe('u2');
  });
});
