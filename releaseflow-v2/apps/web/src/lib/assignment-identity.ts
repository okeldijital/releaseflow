/**
 * ARS-003 — Assignment identity resolution.
 *
 * Canonical assignee is Person.id (assigneeId).
 * Optional denormalized assigneeUserId is Auth uid.
 * Actors in services are Auth uids; never compare Person.id === uid alone.
 */

import type { AssignmentRecord } from './assignment-repository';
import { getPeopleByOrg } from './people-repository';
import { fetchPerson } from './person-service';

/**
 * Resolve all identity keys that represent the signed-in user for assignment matching:
 * - Auth uid
 * - Person.id where Person.userId === uid (org-scoped)
 */
export async function resolveActorIdentityKeys(
  organizationId: string,
  authUid: string,
): Promise<Set<string>> {
  const keys = new Set<string>();
  if (authUid) keys.add(authUid);
  if (!organizationId || !authUid) return keys;

  try {
    const people = await getPeopleByOrg(organizationId);
    for (const p of people) {
      if (p.userId === authUid) keys.add(p.id);
    }
  } catch {
    // keep uid only
  }
  return keys;
}

/**
 * Synchronous match when identity keys are already resolved.
 * Matches assigneeId (Person) and optional assigneeUserId (Auth).
 */
export function assignmentMatchesIdentity(
  assignment: Pick<AssignmentRecord, 'assigneeId' | 'assigneeUserId'>,
  identityKeys: Set<string>,
): boolean {
  if (assignment.assigneeId && identityKeys.has(assignment.assigneeId)) return true;
  if (assignment.assigneeUserId && identityKeys.has(assignment.assigneeUserId)) return true;
  return false;
}

/**
 * True when actorUid is the assignee of this assignment (Person or Auth link).
 */
export async function actorIsAssignee(
  assignment: Pick<AssignmentRecord, 'assigneeId' | 'assigneeUserId' | 'organizationId'>,
  actorUid: string,
): Promise<boolean> {
  if (!actorUid) return false;
  if (assignment.assigneeUserId && assignment.assigneeUserId === actorUid) return true;
  if (assignment.assigneeId === actorUid) return true; // legacy docs that stored uid

  // Resolve Person.userId for canonical Person.id assignee
  if (assignment.assigneeId) {
    try {
      const person = await fetchPerson(assignment.assigneeId);
      if (person?.userId && person.userId === actorUid) return true;
    } catch {
      /* ignore */
    }
  }

  // Org-scoped fallback
  if (assignment.organizationId) {
    const keys = await resolveActorIdentityKeys(assignment.organizationId, actorUid);
    return assignmentMatchesIdentity(assignment, keys);
  }
  return false;
}

/**
 * Resolve Auth uid for notification delivery from Person.id or uid.
 */
export async function resolveAssigneeAuthUid(
  assigneeId: string,
  organizationId: string,
): Promise<string | null> {
  if (!assigneeId) return null;
  try {
    const person = await fetchPerson(assigneeId);
    if (person?.userId) {
      if (person.organizationId && person.organizationId !== organizationId) {
        // still return userId if linked — org mismatch is logged by callers
      }
      return person.userId;
    }
  } catch {
    /* treat as uid */
  }
  // If assigneeId looks like a uid already stored (legacy), use it
  return assigneeId;
}
