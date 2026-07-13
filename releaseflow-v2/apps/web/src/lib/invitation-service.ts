import {
  createInvitation as repoCreate,
  getInvitationByToken as repoGetByToken,
  getInvitationById as repoGetById,
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
import { sendEmail, buildEmailParams } from './email/email-service';
import { renderInvitationEmail } from './email/templates/InvitationEmail';
import { getOrganization } from './organization-repository';
import { getUserProfile } from './user-profile-repository';
import {
  createPerson,
  updatePerson,
  getPersonByEmail,
  getPersonByOrganizationAndUserId,
} from './people-repository';
import type { UpdatePersonFields } from './people-repository';

export type { InvitationRecord, CreateInvitationFields };

function buildInvitationUrl(token: string): string {
  const base = process.env.APP_URL;
  if (!base) {
    console.warn('[invitation-service] Missing APP_URL environment variable.');
    return '';
  }
  return `${base}/invite/${token}`;
}

async function sendInvitationEmail(invitation: InvitationRecord): Promise<void> {
  const [org, inviter] = await Promise.all([
    getOrganization(invitation.organizationId),
    getUserProfile(invitation.inviterId),
  ]);

  if (!org) {
    console.warn(`[invitation-service] Organization not found for ${invitation.organizationId}`);
    return;
  }

  const inviterName = inviter?.displayName?.trim() || 'Someone';
  const roleName = invitation.discipline || invitation.roleId;
  const acceptUrl = buildInvitationUrl(invitation.token);
  if (!acceptUrl) return;

  const html = renderInvitationEmail({
    orgName: org.name,
    inviterName,
    roleName,
    acceptUrl,
    expiresInDays: 7,
  });

  try {
    await sendEmail(buildEmailParams(
      invitation.email,
      `You're invited to join ${org.name}`,
      html,
    ));
  } catch (err) {
    console.error('[invitation-service] Failed to send invitation email:', err);
  }
}

export async function invitePerson(fields: CreateInvitationFields): Promise<InvitationRecord> {
  if (!fields.email.trim()) throw new Error('Email is required');
  if (!fields.organizationId) throw new Error('Organization ID is required');
  if (!fields.inviterId) throw new Error('Inviter ID is required');

  const roleId = fields.discipline ? getSystemRoleForDiscipline(fields.discipline) : fields.roleId;

  const invitation = await repoCreate({
    ...fields,
    roleId,
  });

  await sendInvitationEmail(invitation);

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

  // Stage 2 — canonical identity: organizationId + userId. Once a Person is
  // linked to a Firebase account this is the stable, email-independent key.
  let person = await getPersonByOrganizationAndUserId(invitation.organizationId, user.uid);

  // Stage 3 — reconnection only: an invitation-created Person may still be
  // keyed by email because it has never been linked to a Firebase account.
  if (!person) {
    person = await getPersonByEmail(invitation.organizationId, email);
  }

  if (person) {
    // Update missing identity fields only; never overwrite existing profile data.
    const patch: UpdatePersonFields = { invitationStatus: 'accepted' };
    if (!person.userId) patch.userId = user.uid; // permanently link the Firebase identity
    if (!person.primaryRole) patch.primaryRole = primaryRole;
    await updatePerson(person.id, patch);
  } else {
    await createPerson({
      organizationId: invitation.organizationId,
      userId: user.uid,
      email,
      displayName,
      primaryRole,
    });
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

  const invitation = await repoGetById(invitationId);
  if (invitation) {
    await sendInvitationEmail(invitation);
  }

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
