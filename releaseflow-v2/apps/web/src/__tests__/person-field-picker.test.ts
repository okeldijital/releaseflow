import { describe, it, expect } from 'vitest';
import {
  filterPeopleForSearch,
  toPersonOptions,
  mergePersonOptions,
  type PersonOption,
} from '@/lib/person-field-picker-logic';

const catalogue: PersonOption[] = [
  { id: '1', name: 'Jane Doe', email: 'jane@example.com', primaryRole: 'Producer', department: 'Production', status: 'active' },
  { id: '2', name: 'John Smith', email: 'john@example.com', primaryRole: 'Mix Engineer', status: 'active' },
  { id: '3', name: 'Alice Wonder', email: 'alice@example.com', primaryRole: 'Photographer', department: 'Creative', status: 'archived' },
];

describe('person-field-picker search logic', () => {
  it('returns all for empty search', () => {
    expect(filterPeopleForSearch(catalogue, '')).toEqual(catalogue);
  });

  it('filters by name', () => {
    expect(filterPeopleForSearch(catalogue, 'Jane')).toEqual([catalogue[0]]);
    expect(filterPeopleForSearch(catalogue, 'john')).toEqual([catalogue[1]]);
  });

  it('filters by email', () => {
    expect(filterPeopleForSearch(catalogue, 'alice@example.com')).toEqual([catalogue[2]]);
  });

  it('filters by department', () => {
    expect(filterPeopleForSearch(catalogue, 'Production')).toEqual([catalogue[0]]);
    expect(filterPeopleForSearch(catalogue, 'Creative')).toEqual([catalogue[2]]);
  });

  it('filters by role', () => {
    expect(filterPeopleForSearch(catalogue, 'Mix Engineer')).toEqual([catalogue[1]]);
  });

  it('returns empty for no match', () => {
    expect(filterPeopleForSearch(catalogue, 'xyz')).toEqual([]);
  });
});

describe('person picker helpers', () => {
  it('maps records to picker options', () => {
    const records = [
      { id: 'a1', displayName: 'Jane Doe', email: 'jane@test.com', primaryRole: 'Producer', status: 'active' as const },
      { id: 'a2', displayName: 'John Smith', email: 'john@test.com', primaryRole: 'Engineer', status: 'active' as const },
    ];
    const opts = toPersonOptions(records as Parameters<typeof toPersonOptions>[0]);
    expect(opts).toHaveLength(2);
    expect(opts[0]!.name).toBe('Jane Doe');
    expect(opts[0]!.email).toBe('jane@test.com');
  });

  it('merges without duplicates', () => {
    const a: PersonOption[] = [{ id: '1', name: 'Jane', email: 'j@t.com', primaryRole: 'Producer', status: 'active' }];
    const b: PersonOption[] = [{ id: '1', name: 'Jane', email: 'j@t.com', primaryRole: 'Producer', status: 'active' }];
    expect(mergePersonOptions(a, b)).toEqual(a);
  });

  it('combines distinct options', () => {
    const a: PersonOption[] = [{ id: '1', name: 'Jane', email: 'j@t.com', primaryRole: 'Producer', status: 'active' }];
    const b: PersonOption[] = [{ id: '2', name: 'John', email: 'jo@t.com', primaryRole: 'Engineer', status: 'active' }];
    expect(mergePersonOptions(a, b)).toHaveLength(2);
  });
});
