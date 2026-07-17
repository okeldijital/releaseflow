/**
 * DOM-001 — Platform vs contribution role separation.
 */

import { describe, expect, it } from 'vitest';
import {
  resolvePersonSecurity,
  groupContributionRolesByRelease,
  platformRoleLabel,
} from '@/lib/people-platform';
import type { PersonRecord } from '@/lib/people-repository';
import type { MembershipRecord } from '@/lib/organization-repository';
import type { InvitationRecord } from '@/lib/invitation-repository';

function person(partial: Partial<PersonRecord> & { id: string }): PersonRecord {
  return {
    organizationId: 'org1',
    displayName: 'Leko',
    email: 'leko@example.com',
    primaryRole: 'Lyricist', // legacy craft value — must not drive platform role
    status: 'active',
    ...partial,
  } as PersonRecord;
}

describe('DOM-001 people-platform', () => {
  it('labels platform roles for product language', () => {
    expect(platformRoleLabel('collaborator')).toBe('Contributor');
    expect(platformRoleLabel('release_manager')).toBe('Manager');
    expect(platformRoleLabel('administrator')).toBe('Administrator');
    expect(platformRoleLabel('contributor')).toBe('Contributor');
  });

  it('resolves platform role from membership, not person.primaryRole', () => {
    const p = person({ id: 'p1', userId: 'u1', primaryRole: 'Lyricist' });
    const memberships: MembershipRecord[] = [{
      id: 'm1',
      organizationId: 'org1',
      userId: 'u1',
      roleId: 'contributor',
      status: 'active',
    }];
    const sec = resolvePersonSecurity(p, memberships, []);
    expect(sec.platformRole).toBe('collaborator');
    expect(sec.platformRoleLabel).toBe('Contributor');
    expect(sec.platformRoleLabel).not.toBe('Lyricist');
  });

  it('falls back to pending invitation platform role', () => {
    const p = person({ id: 'p2', userId: undefined, invitationStatus: 'pending' });
    const invitations: InvitationRecord[] = [{
      id: 'i1',
      token: 'tok',
      status: 'pending',
      createdAt: null,
      expiresAt: null,
      organizationId: 'org1',
      organizationName: 'M2KR',
      inviteeName: 'Leko',
      inviteeEmail: 'leko@example.com',
      platformRole: 'release_manager',
      professionalRole: '',
      invitedByUserId: 'admin',
      invitedByName: 'Admin',
    }];
    const sec = resolvePersonSecurity(p, [], invitations);
    expect(sec.platformRoleLabel).toBe('Manager');
    expect(sec.membershipStatus).toBe('pending');
  });

  it('groups contribution roles by release from assignments only', () => {
    const groups = groupContributionRolesByRelease(
      [
        { entityType: 'release', entityId: 'r1', role: 'Lyricist' },
        { entityType: 'release', entityId: 'r1', role: 'Composer' },
        { entityType: 'release', entityId: 'r2', role: 'Producer' },
        { entityType: 'track', entityId: 't1', role: 'Engineer' },
      ],
      new Map([
        ['r1', 'Lefa EP'],
        ['r2', 'Future Album'],
      ]),
    );
    expect(groups).toHaveLength(2);
    const lefa = groups.find((g) => g.releaseId === 'r1')!;
    expect(lefa.releaseTitle).toBe('Lefa EP');
    expect(lefa.contributionRoles).toEqual(['Composer', 'Lyricist']);
    const future = groups.find((g) => g.releaseId === 'r2')!;
    expect(future.contributionRoles).toEqual(['Producer']);
  });

  it('never uses primaryRole as platform role when no membership', () => {
    const p = person({ id: 'p3', primaryRole: 'Producer' });
    const sec = resolvePersonSecurity(p, [], []);
    expect(sec.platformRole).toBeNull();
    expect(sec.platformRoleLabel).toBe('—');
  });
});
