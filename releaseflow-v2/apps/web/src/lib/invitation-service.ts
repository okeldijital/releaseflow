import {
  createInvitation as repoCreate,
  getInvitationByToken as repoGetByToken,
  acceptInvitation as repoAccept,
  revokeInvitation as repoRevoke,
  resendInvitation as repoResend,
  expireOldInvitations as repoExpireOld,
  getPendingInvitations as repoListPending,
  getInvitationsByEmail as repoGetByEmail,
  getInvitationsByOrg as repoListByOrg,
} from './invitation-repository';
import type { InvitationRecord, CreateInvitationFields } from './invitation-repository';
import { recordActivity } from './activity-service';
import { getSystemRoleForDiscipline } from './disciplines';
import {
  createPerson,
  updatePerson,
  getPersonByEmail,
  getPersonByUserId,
} from './people-repository';
import { addPersonToOrganization } from './person-membership-repository';

export type { InvitationRecord, CreateInvitationFields };

export async function invitePerson(fields: CreateInvitationFields): Promise<InvitationRecord> {
  if (!fields.email.trim()) throw new Error('Email is required');
  if (!fields.organizationId) throw new Error('Organization ID is required');
  if (!fields.inviterId) throw new Error('Inviter ID is required');

  const roleId = fields.discipline ? getSystemRoleForDiscipline(fields.discipline) : fields.roleId;

  const invitation = await repoCreate({
    ...fields,
    roleId,
  });

  await recordActivity({
    entityType: 'release',
    entityId: invitation.id,
    organizationId: fields.organizationId,
    actorId: fields.inviterId,
    action: 'invitation.created',
    details: `Invitation sent to ${fields.email}`,
  });

  return invitation;
}

export async function fetchInvitationByToken(token: string): Promise<InvitationRecord | null> {
  return repoGetByToken(token);
}

export async function acceptPersonInvitation(
  token: string,
  user: { uid: string; email: string; displayName?: string | null }
): Promise<void> {
  const invitation = await repoGetByToken(token);
  if (!invitation) throw new Error('Invitation not found');
  if (invitation.status !== 'pending') throw new Error('Invitation is no longer valid');

  const email = user.email?.trim() || invitation.email;
  const displayName = user.displayName?.trim() || email;
  const primaryRole = invitation.discipline || invitation.roleId;

  const existingByEmail = await getPersonByEmail(invitation.organizationId, email);
  const existingByUserId = existingByEmail?.userId ? null : await getPersonByUserId(user.uid);
  const person = existingByEmail || existingByUserId;

  let personId: string;
  if (person) {
    await updatePerson(person.id, {
      invitationStatus: 'accepted',
      userId: user.uid,
      primaryRole: person.primaryRole || primaryRole,
    });
    personId = person.id;
  } else {
    const created = await createPerson({
      organizationId: invitation.organizationId,
      userId: user.uid,
      email,
      displayName,
      primaryRole,
    });
    personId = created.id;
  }

  try {
    await addPersonToOrganization({
      organizationId: invitation.organizationId,
      personId,
      role: primaryRole,
    });
  } catch {
    // already a member of this organization — safe to ignore
  }

  await repoAccept(token, user.uid);

  await recordActivity({
    entityType: 'release',
    entityId: invitation.id,
    organizationId: invitation.organizationId,
    actorId: user.uid,
    action: 'invitation.accepted',
    details: `Invitation accepted by ${user.uid}`,
  });
}

export async function cancelInvitation(invitationId: string, actorId: string, orgId: string): Promise<void> {
  const all = await repoListByOrg(orgId);
  const target = all.find((i) => i.id === invitationId);
  if (!target) throw new Error('Invitation not found');

  await repoRevoke(invitationId);

  await recordActivity({
    entityType: 'release',
    entityId: invitationId,
    organizationId: orgId,
    actorId,
    action: 'invitation.revoked',
    details: 'Invitation revoked',
  });
}

export async function resendPersonInvitation(invitationId: string, actorId: string, orgId: string): Promise<void> {
  await repoResend(invitationId);

  await recordActivity({
    entityType: 'release',
    entityId: invitationId,
    organizationId: orgId,
    actorId,
    action: 'invitation.resent',
    details: 'Invitation resent',
  });
}

export async function expireStaleInvitations(orgId: string): Promise<void> {
  await repoExpireOld(orgId);
}

export async function fetchPendingInvitations(orgId: string): Promise<InvitationRecord[]> {
  return repoListPending(orgId);
}

export async function fetchInvitationsByEmail(email: string): Promise<InvitationRecord[]> {
  return repoGetByEmail(email);
}

export async function fetchInvitationsByOrg(orgId: string): Promise<InvitationRecord[]> {
  return repoListByOrg(orgId);
}
