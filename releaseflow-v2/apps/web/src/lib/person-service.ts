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
  getPersonByOrganizationAndUserId,
} from './people-repository';
import type { PersonRecord, CreatePersonFields, UpdatePersonFields } from './people-repository';
import { getUserProfile } from './user-profile-repository';

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

/**
 * Service-mediated "Add Person" roster creation.
 *
 * ARCHITECTURE: creates an UNLINKED Person (no userId) as a roster/contact
 * entry for the organization. This is not an authenticated collaborator until
 * an invitation links a Firebase account (see invitation-service). It does not
 * conflict with the organizationId + userId identity rule because no userId is
 * assigned here. UI must call this service function, never the repository.
 */
export async function createNewPerson(fields: CreatePersonFields): Promise<PersonRecord> {
  if (!fields.displayName.trim()) throw new Error('Display name is required');
  if (!fields.email.trim()) throw new Error('Email is required');
  if (!fields.organizationId) throw new Error('Organization ID is required');
  return repoCreate(fields);
}

export async function editPerson(personId: string, fields: UpdatePersonFields): Promise<void> {
  return repoUpdate(personId, fields);
}

/**
 * Guarantees that the authenticated organization owner is represented by a
 * Person record inside the given organization, mirroring the collaboration
 * identity that invited collaborators receive. The only intentional
 * difference is `primaryRole = 'Owner'`.
 *
 * Duplicate protection is organization-scoped (organizationId + userId),
 * via the canonical `getPersonByOrganizationAndUserId` lookup. The Person
 * model is one-Person-per-organization, so this never inspects or mutates
 * Person records in other organizations.
 *
 * Identity fields (email / displayName) are resolved from the existing user
 * profile via the user-profile repository. A missing profile still yields a
 * Person so that provisioning never blocks organization creation.
 */
export async function ensureOwnerPerson(organizationId: string, userId: string): Promise<void> {
  if (!organizationId || !userId) return;

  const existing = await getPersonByOrganizationAndUserId(organizationId, userId);

  if (existing) {
    // A Person already exists — only backfill missing identity fields,
    // never overwrite profile data (displayName, email, avatar, bio, etc.).
    const patch: UpdatePersonFields = {};
    if (!existing.userId) patch.userId = userId;
    if (!existing.invitationStatus) patch.invitationStatus = 'accepted';
    if (!existing.status) patch.status = 'active';
    // DOM-001: do not force platform labels onto primaryRole
    if (Object.keys(patch).length > 0) {
      await repoUpdate(existing.id, patch);
    }
    return;
  }

  const profile = await getUserProfile(userId);
  const email = profile?.email ?? '';
  const displayName = profile?.displayName || profile?.email || 'Owner';

  const created = await repoCreate({
    organizationId,
    userId,
    email,
    displayName,
    // DOM-001: primaryRole deprecated; platform role lives on membership (owner).
    primaryRole: '',
  });
  // createPerson persists status = 'active'; mark the owner as an accepted
  // member so the record is indistinguishable from an accepted collaborator.
  await repoUpdate(created.id, { invitationStatus: 'accepted' });
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

  // DOM-001: readiness no longer requires primaryRole (contribution roles on assignments).
  const checks: [boolean, string][] = [
    [!person.displayName, 'Display Name'],
    [!person.email, 'Email'],
    [!person.avatarUrl, 'Profile Photo'],
    [!person.department, 'Department'],
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
