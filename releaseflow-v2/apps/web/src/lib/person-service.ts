import {
  createPerson as repoCreate,
  updatePerson as repoUpdate,
  getPerson as repoGet,
  getPeopleByOrg as repoList,
  searchPeople as repoSearch,
  archivePerson as repoArchive,
  restorePerson as repoRestore,
  updateSkills as repoUpdateSkills,
  getAssignmentSummary as repoAssignmentSummary,
} from './people-repository';
import type { PersonRecord, CreatePersonFields, UpdatePersonFields } from './people-repository';

export type { PersonRecord, CreatePersonFields, UpdatePersonFields };

export interface PersonReadinessResult {
  ready: boolean;
  percentage: number;
  missing: string[];
}

export interface AssignmentSummary {
  current: number;
  completed: number;
  overdue: number;
  upcoming: number;
}

export async function createNewPerson(fields: CreatePersonFields): Promise<PersonRecord> {
  if (!fields.displayName.trim()) throw new Error('Display name is required');
  if (!fields.email.trim()) throw new Error('Email is required');
  if (!fields.organizationId) throw new Error('Organization ID is required');
  return repoCreate(fields);
}

export async function editPerson(personId: string, fields: UpdatePersonFields): Promise<void> {
  return repoUpdate(personId, fields);
}

export async function fetchPerson(personId: string): Promise<PersonRecord | null> {
  return repoGet(personId);
}

export async function fetchPeople(orgId: string): Promise<PersonRecord[]> {
  return repoList(orgId);
}

export async function fetchPersonSearch(orgId: string, queryStr: string): Promise<PersonRecord[]> {
  return repoSearch(orgId, queryStr);
}

export async function archivePerson(personId: string): Promise<void> {
  const person = await repoGet(personId);
  if (!person) throw new Error('Person not found');
  if (person.status === 'archived') throw new Error('Person is already archived');
  return repoArchive(personId);
}

export async function restorePerson(personId: string): Promise<void> {
  const person = await repoGet(personId);
  if (!person) throw new Error('Person not found');
  if (person.status !== 'archived') throw new Error('Person is not archived');
  return repoRestore(personId);
}

export async function updatePersonSkills(personId: string, skills: string[]): Promise<void> {
  return repoUpdateSkills(personId, skills);
}

export async function fetchAssignmentSummary(personId: string): Promise<AssignmentSummary> {
  return repoAssignmentSummary(personId);
}

export async function checkPersonReadiness(personId: string): Promise<PersonReadinessResult> {
  const person = await repoGet(personId);
  if (!person) return { ready: false, percentage: 0, missing: ['Person not found'] };

  const checks: [boolean, string][] = [
    [!person.displayName, 'Display Name'],
    [!person.email, 'Email'],
    [!person.avatarUrl, 'Profile Photo'],
    [!person.department, 'Department'],
    [!person.primaryRole || person.primaryRole === '—', 'Role'],
    [!person.skills || person.skills.length === 0, 'Skills'],
  ];

  const total = checks.length;
  const passed = checks.filter(([fail]) => !fail).length;
  const missing = checks.filter(([fail]) => fail).map(([, label]) => label);

  return {
    ready: missing.length === 0,
    percentage: Math.round((passed / total) * 100),
    missing,
  };
}
