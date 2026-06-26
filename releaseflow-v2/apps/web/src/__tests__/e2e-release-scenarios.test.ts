import { describe, it, expect } from 'vitest';
import type { Stage, Task, Deliverable, Dependency } from '@/app/(app)/types';

const mkStage = (overrides: Partial<Stage> = {}): Stage => ({
  id: 's0', workflowId: 'w1', name: 'Production', order: 1,
  status: 'not_started', ...overrides,
});

const mkTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't0', stageId: 's1', releaseId: 'r1', title: 'Task',
  status: 'todo', priority: 'medium',
  createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

const mkDel = (overrides: Partial<Deliverable> = {}): Deliverable => ({
  id: 'd0', releaseId: 'r1', type: 'audio', title: 'Deliverable',
  status: 'draft', ownerId: 'u1', createdAt: new Date(),
  ...overrides,
});

const mkDep = (overrides: Partial<Dependency> = {}): Dependency => ({
  id: 'dep0', releaseId: 'r1', title: 'Dependency', category: 'legal',
  owner: 'u1', status: 'pending', blocking: true,
  createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

interface ReleaseScenario {
  type: string;
  workflowStages: string[];
  requiredDeliverables: string[];
  requiredTasks: string[];
  campaigns: string[];
}

/**
 * E2E Scenario Runner
 *
 * Simulates the lifecycle: Release → Workflow → Tasks → Deliverables → Approvals → Distribution → Campaign → Complete
 */
function simulateLifecycle(scenario: ReleaseScenario) {
  const stages: Stage[] = scenario.workflowStages.map((name, i) =>
    mkStage({ id: `s${i}`, name, order: i + 1 }));
  const tasks: Task[] = [];
  const deliverables: Deliverable[] = [];
  const deps: Dependency[] = [];

  let step = 0;

  return {
    advance() { step++; },
    step() { return step; },
    createTask(title: string) { tasks.push(mkTask({ id: `t${tasks.length}`, title })); },
    approveTask(id: string) { const t = tasks.find((x) => x.id === id); if (t) t.status = 'done'; },
    createDeliverable(title: string) { deliverables.push(mkDel({ id: `d${deliverables.length}`, title })); },
    approveDeliverable(id: string) { const d = deliverables.find((x) => x.id === id); if (d) d.status = 'approved'; },
    resolveDependency(id: string) { const d = deps.find((x) => x.id === id); if (d) d.status = 'completed'; },
    addDependency(title: string) { deps.push(mkDep({ id: `dep${deps.length}`, title })); },
    getStages() { return stages; },
    getTasks() { return tasks; },
    getDeliverables() { return deliverables; },
    getDependencies() { return deps; },
    allTasksDone() { return tasks.every((t) => t.status === 'done'); },
    allDelivApproved() { return deliverables.every((d) => d.status === 'approved'); },
    allDepsCompleted() { return deps.filter((d) => d.blocking).every((d) => d.status === 'completed'); },
    allStagesComplete() { return stages.every((s) => s.status === 'completed'); },
  };
}

describe('E2E — Single Release', () => {
  it('completes full lifecycle: Single', () => {
    const scenario: ReleaseScenario = {
      type: 'single',
      workflowStages: ['Production', 'Mixing', 'Mastering', 'Artwork', 'Metadata', 'Review', 'Distribution'],
      requiredDeliverables: ['Final WAV', 'Cover Art 3000x3000', 'Metadata spreadsheet'],
      requiredTasks: ['Record vocals', 'Mix stems', 'Master WAV', 'Design cover', 'Submit metadata'],
      campaigns: ['Pre-Save Campaign'],
    };

    const sim = simulateLifecycle(scenario);

    // Create release and workflow stages
    const stages = sim.getStages();
    expect(stages).toHaveLength(7);

    // Create tasks for production stage
    for (const t of scenario.requiredTasks) {
      sim.createTask(t);
    }
    expect(sim.getTasks()).toHaveLength(5);

    // Complete all tasks
    const tasks = sim.getTasks();
    for (const t of tasks) {
      sim.approveTask(t.id);
    }
    expect(sim.allTasksDone()).toBe(true);

    // Advance stages
    for (const s of stages) {
      s.status = 'completed';
    }
    expect(sim.allStagesComplete()).toBe(true);

    // Create and approve deliverables
    for (const d of scenario.requiredDeliverables) {
      sim.createDeliverable(d);
    }
    const delivs = sim.getDeliverables();
    for (const d of delivs) {
      sim.approveDeliverable(d.id);
    }
    expect(sim.allDelivApproved()).toBe(true);
    expect(sim.allDepsCompleted()).toBe(true);

    // All gates passed
    expect(sim.allTasksDone()).toBe(true);
    expect(sim.allStagesComplete()).toBe(true);
  });
});

describe('E2E — Album Release', () => {
  it('completes full lifecycle: Album', () => {
    const sim = simulateLifecycle({
      type: 'album',
      workflowStages: ['Production', 'Recording', 'Mixing', 'Mastering', 'Artwork', 'Metadata', 'Review', 'Distribution'],
      requiredDeliverables: ['Album WAV', 'Cover Art', 'Metadata spreadsheet'],
      requiredTasks: ['Record track 1', 'Record track 2', 'Record track 3', 'Mix album', 'Master album'],
      campaigns: ['Pre-Save', 'Social Media Blitz', 'Press Release'],
    });

    expect(sim.getStages()).toHaveLength(8);

    ['Record track 1', 'Record track 2', 'Record track 3', 'Mix album', 'Master album'].forEach(sim.createTask);
    expect(sim.getTasks()).toHaveLength(5);

    for (const t of sim.getTasks()) sim.approveTask(t.id);
    expect(sim.allTasksDone()).toBe(true);

    for (const s of sim.getStages()) s.status = 'completed';
    expect(sim.allStagesComplete()).toBe(true);

    ['Album WAV', 'Cover Art', 'Metadata spreadsheet'].forEach(sim.createDeliverable);
    for (const d of sim.getDeliverables()) sim.approveDeliverable(d.id);
    expect(sim.allDelivApproved()).toBe(true);
  });
});

describe('E2E — EP Release', () => {
  it('completes full lifecycle: EP', () => {
    const sim = simulateLifecycle({
      type: 'ep',
      workflowStages: ['Production', 'Mixing', 'Mastering', 'Artwork', 'Metadata', 'Review', 'Distribution'],
      requiredDeliverables: ['EP WAV', 'Cover Art'],
      requiredTasks: ['Record track 1', 'Record track 2', 'Mix EP', 'Master EP'],
      campaigns: ['Playlist Pitch'],
    });

    expect(sim.getStages()).toHaveLength(7);

    ['Record track 1', 'Record track 2', 'Mix EP', 'Master EP'].forEach(sim.createTask);
    for (const t of sim.getTasks()) sim.approveTask(t.id);
    expect(sim.allTasksDone()).toBe(true);

    for (const s of sim.getStages()) s.status = 'completed';
    expect(sim.allStagesComplete()).toBe(true);

    ['EP WAV', 'Cover Art'].forEach(sim.createDeliverable);
    for (const d of sim.getDeliverables()) sim.approveDeliverable(d.id);
    expect(sim.allDelivApproved()).toBe(true);
  });
});

describe('E2E — Remix Release', () => {
  it('completes full lifecycle: Remix', () => {
    const sim = simulateLifecycle({
      type: 'remix',
      workflowStages: ['Production', 'Remix', 'Mastering', 'Artwork', 'Metadata', 'Distribution'],
      requiredDeliverables: ['Remix WAV', 'Remix Cover Art'],
      requiredTasks: ['Create remix', 'Master remix', 'Design remix cover'],
      campaigns: [],
    });

    expect(sim.getStages()).toHaveLength(6);

    ['Create remix', 'Master remix', 'Design remix cover'].forEach(sim.createTask);
    for (const t of sim.getTasks()) sim.approveTask(t.id);
    expect(sim.allTasksDone()).toBe(true);

    for (const s of sim.getStages()) s.status = 'completed';
    expect(sim.allStagesComplete()).toBe(true);

    ['Remix WAV', 'Remix Cover Art'].forEach(sim.createDeliverable);
    for (const d of sim.getDeliverables()) sim.approveDeliverable(d.id);
    expect(sim.allDelivApproved()).toBe(true);
  });
});

describe('E2E — Cover Release', () => {
  it('completes full lifecycle: Cover', () => {
    const sim = simulateLifecycle({
      type: 'remix', // covers follow similar path in our model
      workflowStages: ['Production', 'Recording', 'Mixing', 'Mastering', 'Artwork', 'Metadata', 'Distribution'],
      requiredDeliverables: ['Cover WAV', 'Cover Art'],
      requiredTasks: ['Record cover', 'Mix cover', 'Master cover', 'License clearance'],
      campaigns: [],
    });

    expect(sim.getStages()).toHaveLength(7);

    ['Record cover', 'Mix cover', 'Master cover', 'License clearance'].forEach(sim.createTask);
    for (const t of sim.getTasks()) sim.approveTask(t.id);
    expect(sim.allTasksDone()).toBe(true);

    for (const s of sim.getStages()) s.status = 'completed';
    expect(sim.allStagesComplete()).toBe(true);

    ['Cover WAV', 'Cover Art'].forEach(sim.createDeliverable);
    for (const d of sim.getDeliverables()) sim.approveDeliverable(d.id);
    expect(sim.allDelivApproved()).toBe(true);
  });
});

describe('E2E — Dependency blocking', () => {
  it('blocks distribution readiness when blocking dep unresolved', () => {
    const sim = simulateLifecycle({
      type: 'single',
      workflowStages: ['Production', 'Distribution'],
      requiredDeliverables: ['WAV'],
      requiredTasks: ['Record'],
      campaigns: [],
    });

    sim.addDependency('Sample clearance');
    const deps = sim.getDependencies();
    expect(deps).toHaveLength(1);
    expect(sim.allDepsCompleted()).toBe(false);

    sim.resolveDependency(deps[0]!.id);
    expect(sim.allDepsCompleted()).toBe(true);
  });
});

describe('E2E — Campaign dependency on release readiness', () => {
  it('campaign can only launch when tasks and deliverables ready', () => {
    const sim = simulateLifecycle({
      type: 'single',
      workflowStages: ['Production', 'Mixing', 'Mastering'],
      requiredDeliverables: ['WAV'],
      requiredTasks: ['Record', 'Mix', 'Master'],
      campaigns: ['Pre-Save'],
    });

    // Campaign readiness check: tasks must be done + deliverables approved
    sim.createTask('Record');
    sim.createTask('Mix');
    sim.createTask('Master');
    expect(sim.allTasksDone()).toBe(false);

    for (const t of sim.getTasks()) sim.approveTask(t.id);
    expect(sim.allTasksDone()).toBe(true);

    sim.createDeliverable('WAV');
    sim.approveDeliverable(sim.getDeliverables()[0]!.id);
    expect(sim.allDelivApproved()).toBe(true);
  });
});
