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
import { createNotification } from './notification-service';

export type { InvitationRecord, CreateInvitationFields };

export async function invitePerson(fields: CreateInvitationFields): Promise<InvitationRecord> {
  if (!fields.email.trim()) throw new Error('Email is required');
  if (!fields.organizationId) throw new Error('Organization ID is required');
  if (!fields.inviterId) throw new Error('Inviter ID is required');

  const invitation = await repoCreate(fields);

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

export async function acceptPersonInvitation(token: string, userId: string): Promise<void> {
  const invitation = await repoGetByToken(token);
  if (!invitation) throw new Error('Invitation not found');
  if (invitation.status !== 'pending') throw new Error('Invitation is no longer valid');

  await repoAccept(token, userId);

  await recordActivity({
    entityType: 'release',
    entityId: invitation.id,
    organizationId: invitation.organizationId,
    actorId: userId,
    action: 'invitation.accepted',
    details: `Invitation accepted by ${userId}`,
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
