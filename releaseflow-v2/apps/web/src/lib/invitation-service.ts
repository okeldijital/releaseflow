import {
  createInvitation as repoCreateInvitation,
  getInvitationByToken,
  acceptInvitation as repoAccept,
  revokeInvitation as repoRevoke,
  getPendingInvitations,
  getInvitationsByEmail,
} from './invitation-repository';
import { createNotification } from './notification-service';
import { recordActivity } from './activity-service';
import { sendEmail, buildEmailParams } from './email/email-service';
import { renderInvitationEmail } from './email/templates/InvitationEmail';
import type { InvitationRecord } from './invitation-repository';

export type { InvitationRecord };

export async function inviteUser(fields: {
  organizationId: string;
  email: string;
  inviterId: string;
  inviterName: string;
  roleId: string;
  orgName: string;
  roleName: string;
  orgLogoUrl?: string;
}): Promise<InvitationRecord> {
  if (!fields.email.trim()) throw new Error('Email is required');
  if (!fields.roleId) throw new Error('Role is required');

  const invitation = await repoCreateInvitation({
    organizationId: fields.organizationId,
    email: fields.email,
    inviterId: fields.inviterId,
    roleId: fields.roleId,
  });

  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invitation.token}`;

  await createNotification({
    organizationId: fields.organizationId,
    type: 'invitation',
    title: `Invitation to ${fields.orgName}`,
    message: `${fields.inviterName} invited you to join ${fields.orgName} as ${fields.roleName}`,
    recipientId: fields.inviterId,
    recipientEmail: fields.email,
    entityType: 'invitation',
    entityId: invitation.id,
  });

  try {
    const html = renderInvitationEmail({
      orgName: fields.orgName,
      inviterName: fields.inviterName,
      roleName: fields.roleName,
      acceptUrl,
      expiresInDays: 7,
      orgLogoUrl: fields.orgLogoUrl,
    });

    await sendEmail(buildEmailParams(
      fields.email,
      `Join ${fields.orgName} on ReleaseFlow`,
      html,
    ));
    } catch {
      console.error('[InvitationService] Failed to send invitation email');
  }

  await recordActivity({
    entityType: 'right',
    entityId: invitation.id,
    organizationId: fields.organizationId,
    actorId: fields.inviterId,
    action: 'invitation.sent',
    details: `Invitation sent to ${fields.email} for ${fields.orgName}`,
  });

  return invitation;
}

export async function resolveInvitation(token: string): Promise<{
  invitation: InvitationRecord;
  isValid: boolean;
  reason?: string;
}> {
  const invitation = await getInvitationByToken(token);
  if (!invitation) return { invitation: null as unknown as InvitationRecord, isValid: false, reason: 'Invitation not found' };
  if (invitation.status !== 'sent') return { invitation, isValid: false, reason: `Invitation is ${invitation.status}` };

  const now = Date.now();
  const expiresAt = invitation.expiresAt
    ? (typeof invitation.expiresAt === 'object' && 'toDate' in invitation.expiresAt
      ? (invitation.expiresAt as { toDate: () => Date }).toDate().getTime()
      : new Date(String(invitation.expiresAt)).getTime())
    : 0;

  if (expiresAt < now) return { invitation, isValid: false, reason: 'Invitation has expired' };

  return { invitation, isValid: true };
}

export async function acceptUserInvitation(token: string, userId: string): Promise<{
  success: boolean;
  organizationId?: string;
  error?: string;
}> {
  const { invitation, isValid, reason } = await resolveInvitation(token);
  if (!isValid) return { success: false, error: reason };

  try {
    await repoAccept(token, userId);

    await recordActivity({
      entityType: 'right',
      entityId: invitation.id,
      organizationId: invitation.organizationId,
      actorId: userId,
      action: 'invitation.accepted',
      details: `User ${userId} accepted invitation to organization ${invitation.organizationId}`,
    });

    return { success: true, organizationId: invitation.organizationId };
  } catch {
    return { success: false, error: 'Failed to accept invitation' };
  }
}

export async function revokeUserInvitation(invitationId: string): Promise<void> {
  await repoRevoke(invitationId);
}

export async function fetchPendingInvitations(orgId: string): Promise<InvitationRecord[]> {
  return getPendingInvitations(orgId);
}

export async function fetchInvitationsByEmail(email: string): Promise<InvitationRecord[]> {
  return getInvitationsByEmail(email);
}
