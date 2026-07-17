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
  validateInvitationToken as repoValidate,
  acceptInvitationAtomically as repoAcceptAtomic,
  normalizeInvitation,
  type InvitationRecord,
  type InvitationStatus,
  type PlatformRole,
  type CreateInvitationFields,
  type InvitationValidation,
  type AtomicAcceptResult,
  type AtomicAcceptError,
} from './invitation-repository';
import { buildInvitationLink } from './invitation-token';
import { platformRoleToSystemRole, systemRoleToPlatformRole } from './platform-roles';
import { recordActivity } from './activity-service';
import { getAuthInstance } from './firebase';
import {
  createPerson,
  updatePerson,
  getPersonByEmail,
  getPersonByOrganizationAndUserId,
} from './people-repository';
import type { UpdatePersonFields } from './people-repository';
import { getUserProfile, createUserProfile } from './user-profile-repository';

export type {
  InvitationRecord,
  InvitationStatus,
  PlatformRole,
  CreateInvitationFields,
  InvitationValidation,
  AtomicAcceptResult,
  AtomicAcceptError,
};

export { normalizeInvitation };

/** Default invitation lifetime in days. */
export const INVITATION_EXPIRY_DAYS = 7;

interface InvitePersonInput {
  organizationId: string;
  organizationName: string;
  inviteeName: string;
  inviteeEmail: string;
  platformRole: PlatformRole;
  professionalRole: string;
  invitedByUserId: string;
  invitedByName: string;
  expiresInDays?: number;
}

async function requestInvitationEmailDelivery(invitationId: string): Promise<void> {
  try {
    const auth = getAuthInstance();
    const user = auth?.currentUser;
    if (!user) {
      console.warn('[invitation-service] No authenticated user; skipping invitation email request.');
      return;
    }

    const idToken = await user.getIdToken();
    const res = await fetch(`/api/invitations/${invitationId}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      console.error('[invitation-service] Invitation email delivery failed:', body.error ?? res.statusText);
    }
  } catch (err) {
    console.error('[invitation-service] Failed to request invitation email delivery:', err);
  }
}

export async function invitePerson(fields: InvitePersonInput): Promise<InvitationRecord> {
  const tInviteStart = Date.now();
  if (!fields.inviteeEmail.trim()) throw new Error('Email is required');
  if (!fields.organizationId) throw new Error('Organization ID is required');
  if (!fields.invitedByUserId) throw new Error('Inviter ID is required');

  // AUTH-001 — invite only via AuthorizationService.
  const { AuthorizationService } = await import('@/lib/auth/authorization-service');
  await AuthorizationService.requireInviteCollaborators(
    fields.organizationId,
    fields.invitedByUserId,
  );

  const tFirestoreStart = Date.now();
  const invitation = await repoCreate({
    organizationId: fields.organizationId,
    organizationName: fields.organizationName,
    inviteeName: fields.inviteeName,
    inviteeEmail: fields.inviteeEmail,
    platformRole: fields.platformRole,
    professionalRole: fields.professionalRole,
    invitedByUserId: fields.invitedByUserId,
    invitedByName: fields.invitedByName,
    expiresInDays: fields.expiresInDays ?? INVITATION_EXPIRY_DAYS,
  });
  const firestoreCreateMs = Date.now() - tFirestoreStart;

  console.log('[Invitation] Firestore invitation created', {
    invitationId: invitation.id,
    organizationId: invitation.organizationId,
    email: invitation.inviteeEmail,
    platformRole: invitation.platformRole,
  });
  console.log('[Timing] Firestore create', { ms: firestoreCreateMs });

  console.log('[Invitation] Requesting server email delivery');

  await requestInvitationEmailDelivery(invitation.id);

  await recordActivity({
    entityType: 'release',
    entityId: invitation.id,
    organizationId: fields.organizationId,
    actorId: fields.invitedByUserId,
    action: 'invitation.created',
    details: `Invitation sent to ${fields.inviteeEmail} as ${fields.platformRole}`,
  });

  const totalInviteMs = Date.now() - tInviteStart;
  console.log('[Timing] Total invitePerson', { ms: totalInviteMs });

  return invitation;
}

/** CE-001 — Build the public, shareable invitation URL for a token. */
export function getInvitationLink(token: string): string {
  return buildInvitationLink(token);
}

export async function fetchInvitationByToken(token: string): Promise<InvitationRecord | null> {
  return repoGetByToken(token);
}

export async function validateInvitation(token: string): Promise<InvitationValidation> {
  return repoValidate(token);
}

export async function acceptPersonInvitation(
  token: string,
  user: { uid: string; email: string; displayName?: string | null },
  opts: { professionalRole?: string; displayName?: string } = {},
): Promise<void> {
  const result = await validateInvitation(token);
  if (!result.ok) throw new Error('Invitation is no longer valid');

  const invitation = result.invitation;
  const email = user.email?.trim() || invitation.inviteeEmail;
  const displayName = opts.displayName?.trim() || user.displayName?.trim() || invitation.inviteeName || email;
  const professionalRole = opts.professionalRole?.trim() || invitation.professionalRole;

  // Stage 2 — canonical identity: organizationId + userId.
  let person = await getPersonByOrganizationAndUserId(invitation.organizationId, user.uid);

  // Stage 3 — reconnection only: an invitation-created Person may still be
  // keyed by email because it has never been linked to a Firebase account.
  if (!person) {
    person = await getPersonByEmail(invitation.organizationId, email);
  }

  const platformRole = invitation.platformRole;
  const systemRole = platformRoleToSystemRole(platformRole);

  if (person) {
    // Update missing identity fields only; never overwrite existing profile data.
    const patch: UpdatePersonFields = { invitationStatus: 'accepted' };
    if (!person.userId) patch.userId = user.uid;
    if (!person.primaryRole) patch.primaryRole = systemRoleToPlatformRole(systemRole);
    if (!person.displayName && displayName) patch.displayName = displayName;
    await updatePerson(person.id, patch);
  } else {
    await createPerson({
      organizationId: invitation.organizationId,
      userId: user.uid,
      email,
      displayName,
      primaryRole: systemRoleToPlatformRole(systemRole),
    });
  }

  // Ensure the user profile document exists. Collaborators who accept an
  // invitation skip the standard onboarding flow (which normally creates this),
  // so we provision it here with the information we already have.
  const existingProfile = await getUserProfile(user.uid);
  if (!existingProfile) {
    await createUserProfile(user.uid, {
      displayName,
      email,
    });
  }

  // The repository creates the membership (with the correct system role derived
  // from the platform role) and marks the invitation accepted. The collaborator
  // never chooses organisation, role, or workspace — all come from the invitation.
  await repoAccept(token, user.uid, { professionalRole, platformRole });

  await recordActivity({
    entityType: 'release',
    entityId: invitation.id,
    organizationId: invitation.organizationId,
    actorId: user.uid,
    action: 'invitation.accepted',
    details: `Invitation accepted by ${user.uid} as ${platformRole}`,
  });
}

/**
 * CE-002 — Accept an invitation atomically.
 *
 * All validation and writes occur inside a single Firestore transaction.
 * Returns a typed result indicating success or the specific failure reason.
 * Never partially accepts an invitation.
 */
export async function acceptInvitationAtomically(
  token: string,
  user: { uid: string; email: string; displayName?: string | null },
): Promise<AtomicAcceptResult> {
  return repoAcceptAtomic(token, user);
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

export async function resendPersonInvitation(
  invitationId: string,
  actorId: string,
  orgId: string,
  opts: { expiresInDays?: number } = {},
): Promise<void> {
  await repoResend(invitationId, opts);

  const invitation = await repoGetById(invitationId);
  if (invitation) {
    await requestInvitationEmailDelivery(invitation.id);
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
