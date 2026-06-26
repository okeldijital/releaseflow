import { describe, it, expect } from 'vitest';
import { computeReadiness } from '@/lib/readiness-engine';
import { checkDistributionReadiness } from '@/lib/distribution-service';
import { computeProgress } from '@/lib/workflow-progress';
import { computeWorkflowHealth } from '@/lib/workflow-health';
import type { Stage, ReleaseRequirement, Deliverable, Release, Dependency } from '@/app/(app)/types';

const mockRelease = {
  id: 'r1', title: 'Test', releaseType: 'single', status: 'in_production',
  organizationId: 'o1', createdBy: 'u1', createdAt: new Date(),
  upc: '123', catalogNumber: 'CAT1', label: 'Test Label', copyright: '(c)',
  pLine: '(p)', cLine: '(c)', genre: 'Pop', subgenre: '', language: 'en', explicit: false,
} as Release;

describe('Readiness Engine', () => {
  it('computes 100% when all requirements approved and stages completed', () => {
    const reqs: ReleaseRequirement[] = [
      { id: '1', releaseId: 'r1', name: 'Master', status: 'approved', createdAt: null, updatedAt: null },
      { id: '2', releaseId: 'r1', name: 'Artwork', status: 'approved', createdAt: null, updatedAt: null },
    ];
    const stages: Stage[] = [
      { id: '1', workflowId: 'w1', name: 'A', order: 1, status: 'completed' },
      { id: '2', workflowId: 'w1', name: 'B', order: 2, status: 'completed' },
    ];
    const result = computeReadiness(reqs, stages, []);
    expect(result.percentage).toBe(100);
    expect(result.ready).toBe(true);
    expect(result.breakdown.dependencies).toBeNull();
  });

  it('accounts for missing deliverables', () => {
    const reqs: ReleaseRequirement[] = [
      { id: '1', releaseId: 'r1', name: 'Master', status: 'approved', createdAt: null, updatedAt: null },
    ];
    const dels: Deliverable[] = [
      { id: '1', releaseId: 'r1', type: 'audio', title: 'WAV', status: 'draft', ownerId: 'u1', createdAt: null },
    ];
    const result = computeReadiness(reqs, [], dels);
    expect(result.percentage).toBeLessThan(100);
  });

  it('reduces score when blocking dependencies are incomplete', () => {
    const deps: Dependency[] = [
      { id: '1', releaseId: 'r1', title: 'Legal', category: 'legal', owner: 'u1', status: 'pending', blocking: true, createdAt: null, updatedAt: null },
    ];
    const result = computeReadiness([], [], [], deps);
    expect(result.percentage).toBeLessThan(100);
    expect(result.breakdown.dependencies).toBeTruthy();
    expect(result.breakdown.dependencies!.pct).toBe(0);
  });
});

describe('Distribution Readiness', () => {
  it('reports ready when all conditions met', () => {
    const result = checkDistributionReadiness(mockRelease as Release, 2, 2, 3, 3, 0, 0);
    expect(result.canDistribute).toBe(true);
    expect(result.completeness).toBe(100);
  });

  it('identifies missing metadata', () => {
    const incomplete = { ...mockRelease, upc: '', catalogNumber: '' };
    const result = checkDistributionReadiness(incomplete as Release, 1, 1, 1, 1, 0, 0);
    expect(result.canDistribute).toBe(false);
    expect(result.missingMetadata.length).toBeGreaterThan(0);
  });
});

describe('Workflow Progress', () => {
  it('computes 0% for no stages', () => {
    expect(computeProgress([]).progress).toBe(0);
  });

  it('computes 50% for half completed', () => {
    const stages: Stage[] = [
      { id: '1', workflowId: 'w1', name: 'A', order: 1, status: 'completed' },
      { id: '2', workflowId: 'w1', name: 'B', order: 2, status: 'in_progress' },
    ];
    expect(computeProgress(stages).progress).toBe(50);
  });
});

describe('Workflow Health', () => {
  it('returns red when a stage is blocked', () => {
    const stages: Stage[] = [
      { id: '1', workflowId: 'w1', name: 'A', order: 1, status: 'blocked' },
    ];
    expect(computeWorkflowHealth({ stages })).toBe('red');
  });

  it('returns green when all stages completed', () => {
    const stages: Stage[] = [
      { id: '1', workflowId: 'w1', name: 'A', order: 1, status: 'completed' },
    ];
    expect(computeWorkflowHealth({ stages })).toBe('green');
  });
});
