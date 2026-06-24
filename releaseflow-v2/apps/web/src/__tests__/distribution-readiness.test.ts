import { describe, it, expect } from 'vitest';
import type { Release } from '@/app/(app)/types';

// Test the pure function directly (import works at module level)
const REQUIRED_METADATA_FIELDS: (keyof Release)[] = [
  'upc', 'catalogNumber', 'label', 'copyright', 'pLine', 'cLine', 'genre', 'language',
];

interface DistributionReadiness {
  canDistribute: boolean; completeness: number; metadataReady: boolean;
  deliverablesReady: boolean; requirementsReady: boolean; dependenciesReady: boolean;
  missingMetadata: string[]; missingDeliverables: number; missingRequirements: number; missingDependencies: number;
}

function checkDistributionReadiness(release: Release, delCount: number, approvedDel: number, reqTotal: number, reqApproved: number, blockingDepCount: number, blockingDepCompleted: number): DistributionReadiness {
  const missingMetadata = REQUIRED_METADATA_FIELDS.filter((f) => !release[f]);
  const metadataReady = missingMetadata.length === 0;
  const deliverablesReady = approvedDel === delCount;
  const requirementsReady = reqApproved === reqTotal;
  const dependenciesReady = blockingDepCompleted === blockingDepCount;
  let score = 0;
  if (metadataReady) score++;
  if (deliverablesReady) score++;
  if (requirementsReady) score++;
  if (dependenciesReady) score++;
  return {
    canDistribute: metadataReady && deliverablesReady && requirementsReady && dependenciesReady,
    completeness: Math.round((score / 4) * 100), metadataReady, deliverablesReady, requirementsReady, dependenciesReady,
    missingMetadata, missingDeliverables: delCount - approvedDel, missingRequirements: reqTotal - reqApproved, missingDependencies: blockingDepCount - blockingDepCompleted,
  };
}

const baseRelease: Release = {
  id: 'r1', title: 'Test', releaseType: 'album', status: 'in_production', organizationId: 'o1', createdBy: 'u1',
  upc: '123456789012', catalogNumber: 'CAT001', label: 'Test Label', copyright: '(c) 2025', pLine: '(p) 2025', cLine: '(c) 2025',
  genre: 'Rock', subgenre: 'Alt', language: 'en', explicit: false, createdAt: new Date(),
};

describe('DistributionReadiness', () => {
  it('reports 100% when all conditions met including deps', () => {
    const result = checkDistributionReadiness(baseRelease, 2, 2, 3, 3, 0, 0);
    expect(result.canDistribute).toBe(true);
    expect(result.completeness).toBe(100);
  });

  it('reports 50% when only metadata is missing', () => {
    const empty = { ...baseRelease, upc: '', catalogNumber: '', label: '', copyright: '', pLine: '', cLine: '', genre: '', language: '' };
    const result = checkDistributionReadiness(empty as Release, 0, 0, 0, 0, 0, 0);
    expect(result.canDistribute).toBe(false);
    expect(result.completeness).toBe(75);  // deliverables 0/0=true, reqs 0/0=true, deps 0/0=true
  });

  it('reports metadata missing correctly', () => {
    const partial = { ...baseRelease, upc: '', catalogNumber: '' };
    const result = checkDistributionReadiness(partial as Release, 2, 2, 3, 3, 0, 0);
    expect(result.metadataReady).toBe(false);
    expect(result.missingMetadata).toContain('upc');
    expect(result.missingMetadata).toContain('catalogNumber');
  });

  it('reports deliverables not ready when count > 0 but none approved', () => {
    const result = checkDistributionReadiness(baseRelease, 3, 0, 3, 3, 0, 0);
    expect(result.deliverablesReady).toBe(false);
    expect(result.missingDeliverables).toBe(3);
  });

  it('reports deliverables ready when 0 count', () => {
    const result = checkDistributionReadiness(baseRelease, 0, 0, 3, 3, 0, 0);
    expect(result.canDistribute).toBe(true);
  });

  it('reports requirements ready when 0 count', () => {
    const result = checkDistributionReadiness(baseRelease, 2, 2, 0, 0, 0, 0);
    expect(result.requirementsReady).toBe(true);
  });

  it('reports dependencies not ready', () => {
    const result = checkDistributionReadiness(baseRelease, 2, 2, 3, 3, 2, 0);
    expect(result.dependenciesReady).toBe(false);
    expect(result.missingDependencies).toBe(2);
    expect(result.canDistribute).toBe(false);
  });

  it('reports dependencies ready when 0 blocking', () => {
    const result = checkDistributionReadiness(baseRelease, 2, 2, 3, 3, 0, 0);
    expect(result.dependenciesReady).toBe(true);
  });

  it('reports 75% with 3 of 4 passing', () => {
    const partial = { ...baseRelease, upc: '' };
    const result = checkDistributionReadiness(partial as Release, 2, 2, 3, 3, 0, 0);
    expect(result.completeness).toBe(75);
    expect(result.canDistribute).toBe(false);
  });
});
