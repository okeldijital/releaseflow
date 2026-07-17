/**
 * DOM-001 — Resolve organization platform (security) roles for people.
 *
 * Platform roles come from memberships (or pending invitations).
 * Contribution roles come only from assignments — never from Person.
 */

import type { PersonRecord } from './people-repository';
import type { MembershipRecord } from './organization-repository';
import type { InvitationRecord, PlatformRole } from './invitation-repository';
import {
  systemRoleToPlatformRole,
  PLATFORM_ROLE_LABELS,
} from './platform-roles';

export type MembershipStatus = 'active' | 'pending' | 'inactive' | 'suspended';

export interface PersonSecurityContext {
  /** Platform security role (Administrator / Manager / Contributor) */
  platformRole: PlatformRole | null;
  platformRoleLabel: string;
  membership: MembershipRecord | null;
  membershipStatus: MembershipStatus | 'none';
  pendingInvitation: InvitationRecord | null;
  memberSince: unknown | null;
}

/** Display labels aligned with DOM-001 product language. */
export const DOM_PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  administrator: 'Administrator',
  release_manager: 'Manager',
  collaborator: 'Contributor',
};

export function platformRoleLabel(role: PlatformRole | string | null | undefined): string {
  if (!role) return '—';
  if (role in DOM_PLATFORM_ROLE_LABELS) {
    return DOM_PLATFORM_ROLE_LABELS[role as PlatformRole];
  }
  // membership roleId aliases
  const mapped = systemRoleToPlatformRole(role);
  return DOM_PLATFORM_ROLE_LABELS[mapped] ?? PLATFORM_ROLE_LABELS[mapped] ?? role;
}

/**
 * Build security context for a person from memberships + invitations.
 * Prefer membership.roleId (authoritative for access). Fall back to pending invitation.
 */
export function resolvePersonSecurity(
  person: PersonRecord,
  memberships: MembershipRecord[],
  invitations: InvitationRecord[] = [],
): PersonSecurityContext {
  const membership = person.userId
    ? memberships.find((m) => m.userId === person.userId) ?? null
    : null;

  if (membership) {
    const platformRole = systemRoleToPlatformRole(membership.roleId);
    const membershipStatus: MembershipStatus =
      membership.status === 'active' ? 'active'
        : membership.status === 'pending' ? 'pending'
          : 'inactive';
    return {
      platformRole,
      platformRoleLabel: platformRoleLabel(membership.roleId),
      membership,
      membershipStatus,
      pendingInvitation: null,
      memberSince: membership.createdAt ?? person.createdAt ?? null,
    };
  }

  const email = person.email?.trim().toLowerCase() ?? '';
  const pendingInvitation = invitations.find(
    (i) =>
      i.status === 'pending'
      && (i.inviteeEmail?.trim().toLowerCase() === email
        || (person.userId && i.inviteeEmail?.trim().toLowerCase() === email)),
  ) ?? null;

  if (pendingInvitation) {
    return {
      platformRole: pendingInvitation.platformRole,
      platformRoleLabel: platformRoleLabel(pendingInvitation.platformRole),
      membership: null,
      membershipStatus: 'pending',
      pendingInvitation,
      memberSince: pendingInvitation.createdAt ?? person.createdAt ?? null,
    };
  }

  // No membership yet — person may be directory-only (pre-invite).
  return {
    platformRole: null,
    platformRoleLabel: '—',
    membership: null,
    membershipStatus: 'none',
    pendingInvitation: null,
    memberSince: person.createdAt ?? null,
  };
}

/** Group assignment contribution roles by release entity. */
export function groupContributionRolesByRelease(
  assignments: { entityType: string; entityId: string; role: string; title?: string }[],
  releaseTitles: Map<string, string>,
): { releaseId: string; releaseTitle: string; contributionRoles: string[] }[] {
  const byRelease = new Map<string, Set<string>>();
  for (const a of assignments) {
    if (a.entityType !== 'release') continue;
    if (!a.role?.trim()) continue;
    let set = byRelease.get(a.entityId);
    if (!set) {
      set = new Set();
      byRelease.set(a.entityId, set);
    }
    set.add(a.role.trim());
  }
  return [...byRelease.entries()].map(([releaseId, roles]) => ({
    releaseId,
    releaseTitle: releaseTitles.get(releaseId) ?? releaseId,
    contributionRoles: [...roles].sort(),
  }));
}
