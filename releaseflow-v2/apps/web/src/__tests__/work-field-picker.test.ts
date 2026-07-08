import { describe, it, expect } from 'vitest';
import type { WorkRecord } from '@/lib/work-repository';
import {
  toWorkOptions,
  filterWorksForSearch,
  mergeWorkOptions,
  type WorkOption,
} from '@/lib/work-field-picker-logic';

const catalogue: WorkOption[] = [
  { id: '1', title: 'Lifetime', iswc: 'T-345.678.901-2', status: 'active' },
  { id: '2', title: 'Celebration', status: 'active' },
  { id: '3', title: 'Love Again', iswc: 'T-456.789.012-3', status: 'archived', pro: 'ASCAP' },
];

describe('work-field-picker search logic', () => {
  it('returns all works for empty query', () => {
    expect(filterWorksForSearch(catalogue, '')).toHaveLength(3);
  });

  it('filters by title partial match', () => {
    expect(filterWorksForSearch(catalogue, 'Love')).toEqual([catalogue[2]]);
    expect(filterWorksForSearch(catalogue, 'life')).toEqual([catalogue[0]]);
  });

  it('filters by ISWC partial match', () => {
    const result = filterWorksForSearch(catalogue, '345.678');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('1');
  });

  it('is case-insensitive', () => {
    expect(filterWorksForSearch(catalogue, 'LOVE AGAIN')).toHaveLength(1);
    expect(filterWorksForSearch(catalogue, 'celebration')).toHaveLength(1);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterWorksForSearch(catalogue, 'zzzzz')).toHaveLength(0);
  });

  it('trims whitespace from query', () => {
    expect(filterWorksForSearch(catalogue, '  Lifetime  ')).toHaveLength(1);
  });
});

describe('work-field-picker helpers', () => {
  it('toWorkOptions maps WorkRecord to WorkOption', () => {
    const records = [
      { id: '1', title: 'Test', iswc: 'T-111', pro: 'BMI', status: 'active', organizationId: '' } as WorkRecord,
    ];
    const options = toWorkOptions(records);
    expect(options[0]!.title).toBe('Test');
    expect(options[0]!.iswc).toBe('T-111');
    expect(options[0]!.pro).toBe('BMI');
    expect(options[0]!.status).toBe('active');
  });

  it('toWorkOptions handles nullish iswc/pro', () => {
    const records = [
      { id: '2', title: 'No ISWC', iswc: null, pro: null, status: 'active', organizationId: '', registrationStatus: 'unregistered' } as WorkRecord,
    ];
    const options = toWorkOptions(records);
    expect(options[0]!.iswc).toBeNull();
    expect(options[0]!.pro).toBeNull();
  });

  it('mergeWorkOptions deduplicates by id', () => {
    const a: WorkOption[] = [{ id: '1', title: 'A', status: 'active' }];
    const b: WorkOption[] = [{ id: '1', title: 'A', status: 'active' }, { id: '2', title: 'B', status: 'active' }];
    const merged = mergeWorkOptions(a, b);
    expect(merged).toHaveLength(2);
  });

  it('mergeWorkOptions prefers later values on conflict', () => {
    const a: WorkOption[] = [{ id: '1', title: 'Old', status: 'active' }];
    const b: WorkOption[] = [{ id: '1', title: 'New', status: 'active' }];
    const merged = mergeWorkOptions(a, b);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.title).toBe('New');
  });
});
