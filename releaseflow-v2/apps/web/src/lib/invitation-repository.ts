import {
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
} from '@firebase/firestore';
import { getDb } from './firebase';
import { generateInvitationToken } from './invitation-token';
import { platformRoleToSystemRole } from './platform-roles';

const LOG = '[Invitation Verification]';

/** CE-001 — Platform roles. Security-defining. No other values permitted. */
export type PlatformRole = 'administrator' | 'release_manager' | 'collaborator';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

/**
 * CE-001 — Invitation is the authoritative access contract.
 * Permissions are NOT stored here; they are inherited from `platformRole`.
 */
export interface InvitationRecord {
  id: string;
  token: string;
  status: InvitationStatus;
  createdAt: unknown;
  expiresAt: unknown;
  acceptedAt?: unknown;
  organizationId: string;
  organizationName: string;
  inviteeName: string;
  inviteeEmail: string;
  platformRole: PlatformRole;
  professionalRole: string;
  invitedByUserId: string;
  invitedByName: string;
  // Legacy fields retained for backwards compatibility with pre-CE-001 docs.
  // New code should not write these; they are normalized on read (see normalizeInvitation).
  email?: string;
  inviterId?: string;
  roleId?: string;
  discipline?: string;
  updatedAt?: unknown;
}

export interface CreateInvitationFields {
  organizationId: string;
  organizationName: string;
  inviteeName: string;
  inviteeEmail: string;
  platformRole: PlatformRole;
  professionalRole: string;
  invitedByUserId: string;
  invitedByName: string;
  /** Optional lifetime in days (default 7). */
  expiresInDays?: number;
}

const DEFAULT_EXPIRY_DAYS = 7;

/** Normalize a possibly-legacy Firestore document into the CE-001 contract. */
export function normalizeInvitation(raw: Record<string, unknown> & { id: string }): InvitationRecord {
  const email = (raw.inviteeEmail ?? raw.email ?? '') as string;
  const inviterName = (raw.invitedByName ?? '') as string;
  const orgName = (raw.organizationName ?? '') as string;

  // Backwards compatibility: derive platformRole from legacy roleId/discipline.
  let platformRole = raw.platformRole as PlatformRole | undefined;
  if (!platformRole) {
    platformRole = legacyRoleToPlatformRole(raw.roleId as string | undefined, raw.discipline as string | undefined);
  }

  return {
    id: raw.id,
    token: (raw.token as string) ?? '',
    status: (raw.status as InvitationStatus) ?? 'pending',
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt,
    acceptedAt: raw.acceptedAt,
    organizationId: (raw.organizationId as string) ?? '',
    organizationName: orgName,
    inviteeName: (raw.inviteeName as string) ?? '',
    inviteeEmail: email,
    platformRole: platformRole ?? 'collaborator',
    professionalRole: (raw.professionalRole as string) ?? (raw.discipline as string) ?? '',
    invitedByUserId: (raw.invitedByUserId as string) ?? (raw.inviterId as string) ?? '',
    invitedByName: inviterName,
    email,
    inviterId: raw.inviterId as string | undefined,
    roleId: raw.roleId as string | undefined,
    discipline: raw.discipline as string | undefined,
    updatedAt: raw.updatedAt,
  };
}

function legacyRoleToPlatformRole(roleId?: string, discipline?: string): PlatformRole | undefined {
  if (roleId === 'admin' || roleId === 'administrator') return 'administrator';
  if (roleId === 'release_manager' || roleId === 'project_manager') return 'release_manager';
  if (roleId === 'contributor' || roleId === 'member' || roleId === 'viewer') return 'collaborator';
  if (discipline === 'Administrator') return 'administrator';
  if (discipline === 'Project Manager' || discipline === 'Label Manager') return 'release_manager';
  return undefined;
}

export async function createInvitation(fields: CreateInvitationFields): Promise<InvitationRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const now = Timestamp.now();
  const token = generateInvitationToken();
  const expiresInDays = fields.expiresInDays ?? DEFAULT_EXPIRY_DAYS;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const record: Omit<InvitationRecord, 'id'> = {
    token,
    status: 'pending',
    createdAt: now,
    expiresAt: Timestamp.fromDate(expiresAt),
    organizationId: fields.organizationId,
    organizationName: fields.organizationName,
    inviteeName: fields.inviteeName,
    inviteeEmail: fields.inviteeEmail,
    platformRole: fields.platformRole,
    professionalRole: fields.professionalRole,
    invitedByUserId: fields.invitedByUserId,
    invitedByName: fields.invitedByName,
  };

  // UAT-001: document id == token so unauthenticated verification uses get()
  // (public) rather than list/query (auth-only under firestore.rules).
  const ref = doc(db, 'invitations', token);
  await setDoc(ref, record);
  console.log(LOG, '✓ Invitation persisted', {
    documentId: token,
    tokenLength: token.length,
    organizationId: fields.organizationId,
    email: fields.inviteeEmail,
    platformRole: fields.platformRole,
    status: 'pending',
    expiresAt: expiresAt.toISOString(),
  });
  return { id: token, ...record };
}

export async function getInvitationByToken(token: string): Promise<InvitationRecord | null> {
  const db = getDb();
  if (!db) {
    console.error(LOG, '✗ Firestore not initialized (getDb returned null)');
    return null;
  }

  const normalized = token.trim();
  console.log(LOG, '✓ Firestore lookup started', {
    tokenLength: normalized.length,
    tokenPrefix: normalized.slice(0, 8),
  });

  // Primary path: doc id == token (CE-001 / UAT-001) — works unauthenticated via allow get.
  try {
    const byId = await getDoc(doc(db, 'invitations', normalized));
    if (byId.exists()) {
      console.log(LOG, '✓ Invitation found (by document id)', { documentId: byId.id });
      return normalizeInvitation({ id: byId.id, ...byId.data() });
    }
    console.log(LOG, '· No document with id=token; trying legacy token field query');
  } catch (err) {
    console.error(LOG, '✗ getDoc(by token id) failed', {
      type: err instanceof Error ? err.name : typeof err,
      message: err instanceof Error ? err.message : String(err),
      code: (err as { code?: string })?.code,
    });
    throw err;
  }

  // Legacy fallback: random-id docs with a `token` field (requires list permission = authenticated).
  try {
    const snap = await getDocs(
      query(collection(db, 'invitations'), where('token', '==', normalized), limit(1)),
    );
    if (snap.empty) {
      console.log(LOG, '✗ Invitation not found (legacy query empty)');
      return null;
    }
    const docData = snap.docs[0]!;
    console.log(LOG, '✓ Invitation found (legacy token field)', { documentId: docData.id });
    return normalizeInvitation({ id: docData.id, ...docData.data() });
  } catch (err) {
    console.error(LOG, '✗ legacy token query failed', {
      type: err instanceof Error ? err.name : typeof err,
      message: err instanceof Error ? err.message : String(err),
      code: (err as { code?: string })?.code,
    });
    throw err;
  }
}

/** Validate an invitation for acceptance. Returns the normalized record or a reason. */
export type InvitationValidation =
  | { ok: true; invitation: InvitationRecord }
  | { ok: false; reason: 'not_found' | 'expired' | 'revoked' | 'accepted' | 'invalid' };

export async function validateInvitationToken(token: string): Promise<InvitationValidation> {
  console.log(LOG, '✓ Validation started', { tokenLength: token?.trim().length ?? 0 });

  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    console.log(LOG, '✗ Validation failed: invitation does not exist');
    return { ok: false, reason: 'not_found' };
  }
  console.log(LOG, '✓ Invitation exists', {
    id: invitation.id,
    status: invitation.status,
    organizationId: invitation.organizationId,
    email: invitation.inviteeEmail,
  });

  if (invitation.status === 'accepted') {
    console.log(LOG, '✗ Validation failed: already accepted');
    return { ok: false, reason: 'accepted' };
  }
  if (invitation.status === 'revoked') {
    console.log(LOG, '✗ Validation failed: revoked');
    return { ok: false, reason: 'revoked' };
  }
  if (invitation.status === 'expired') {
    console.log(LOG, '✗ Validation failed: status=expired');
    return { ok: false, reason: 'expired' };
  }
  if (invitation.status !== 'pending') {
    console.log(LOG, '✗ Validation failed: invalid status', { status: invitation.status });
    return { ok: false, reason: 'invalid' };
  }
  console.log(LOG, '✓ Status valid (pending)');

  const expiresAt = toDate(invitation.expiresAt);
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    console.log(LOG, '✗ Validation failed: past expiresAt', { expiresAt: expiresAt.toISOString() });
    return { ok: false, reason: 'expired' };
  }
  console.log(LOG, '✓ Expiry valid', { expiresAt: expiresAt?.toISOString() ?? null });
  console.log(LOG, '✓ Validation succeeded');

  return { ok: true, invitation };
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const v = value as { toDate?: () => Date; seconds?: number };
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  if (value instanceof Date) return value;
  return null;
}

export async function acceptInvitation(
  token: string,
  userId: string,
  opts: { professionalRole?: string; platformRole?: PlatformRole } = {},
): Promise<InvitationRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore unavailable');
  const invitation = await getInvitationByToken(token);
  if (!invitation) throw new Error('Invitation not found');
  if (invitation.status !== 'pending') throw new Error('Invitation is no longer valid');

  const now = Timestamp.now();
  const systemRole = platformRoleToSystemRole(invitation.platformRole);
  const professionalRole = opts.professionalRole ?? invitation.professionalRole;
  const platformRole = opts.platformRole ?? invitation.platformRole;

  const existing = await getDocs(
    query(
      collection(db, 'memberships'),
      where('userId', '==', userId),
      where('organizationId', '==', invitation.organizationId),
      where('status', '==', 'active'),
      limit(1),
    ),
  );
  if (existing.empty) {
    await addDoc(collection(db, 'memberships'), {
      organizationId: invitation.organizationId,
      userId,
      roleId: systemRole,
      status: 'active',
      invitedBy: invitation.invitedByUserId,
      createdAt: now,
    });
  }

  await updateDoc(doc(db, 'invitations', invitation.id), {
    status: 'accepted',
    acceptedAt: now,
    platformRole,
    professionalRole,
    updatedAt: now,
  });

  return { ...invitation, status: 'accepted', acceptedAt: now, professionalRole, platformRole };
}

/** CE-002 — Error types for atomic invitation acceptance. */
export type AtomicAcceptError =
  | 'not_found'
  | 'expired'
  | 'revoked'
  | 'accepted'
  | 'invalid'
  | 'email_mismatch'
  | 'org_not_found';

/** CE-002 — Result of atomic invitation acceptance. */
export type AtomicAcceptResult =
  | { ok: true; invitation: InvitationRecord }
  | { ok: false; reason: AtomicAcceptError; message: string };

/**
 * CE-002 — Atomic invitation acceptance.
 *
 * Pre-queries resolve document references before the transaction (the v4.x
 * Firestore SDK only supports `transaction.get(documentRef)` — not queries).
 * Within the transaction we re-read the invitation document (the critical
 * concurrency guard) by reference, then perform all writes atomically.
 *
 * Performs the following writes inside a single Firestore transaction:
 *   1. Revalidates invitation (status, expiry, email match, org exists).
 *   2. Creates membership (if one does not already exist).
 *   3. Creates/updates Person record.
 *   4. Creates/updates User profile.
 *   5. Assigns platform role (via membership roleId).
 *   6. Assigns professional role (via Person primaryRole).
 *   7. Sets default organization (only if user has no existing default).
 *   8. Marks invitation as accepted.
 *   9. Records activity_events entry.
 *
 * If ANY step fails the entire transaction is rolled back and the invitation
 * remains in the pending state. There is never a partially-accepted invitation.
 */
export async function acceptInvitationAtomically(
  token: string,
  user: { uid: string; email: string; displayName?: string | null },
): Promise<AtomicAcceptResult> {
  const ACCEPT_LOG = '[Invitation Acceptance]';
  const db = getDb();
  if (!db) {
    console.error(ACCEPT_LOG, '✗ Firestore unavailable');
    return { ok: false, reason: 'not_found', message: 'Service unavailable.' };
  }

  const normalizedToken = token.trim();
  console.log(ACCEPT_LOG, '✓ Accept started', {
    tokenLength: normalizedToken.length,
    tokenPrefix: normalizedToken.slice(0, 8),
    uid: user.uid,
    email: user.email,
  });

  // ── Pre-query: resolve document references ──────────────────────────
  // These queries run BEFORE the transaction to obtain the doc IDs / refs
  // that we need inside the transaction (which only accepts get(docRef)).

  const invitationRecord = await getInvitationByToken(normalizedToken);
  if (!invitationRecord) {
    console.error(ACCEPT_LOG, '✗ Invitation lookup returned null before transaction');
    return { ok: false, reason: 'not_found', message: 'This invitation link is invalid.' };
  }
  console.log(ACCEPT_LOG, '✓ Invitation loaded for accept', {
    id: invitationRecord.id,
    status: invitationRecord.status,
    organizationId: invitationRecord.organizationId,
  });
  const invitationRef = doc(db, 'invitations', invitationRecord.id);
  const orgRef = doc(db, 'organizations', invitationRecord.organizationId);
  const userProfileRef = doc(db, 'users', user.uid);

  // Resolve existing membership (we only need to know its id, if any).
  const membershipSnap = await getDocs(
    query(
      collection(db, 'memberships'),
      where('userId', '==', user.uid),
      where('organizationId', '==', invitationRecord.organizationId),
      where('status', '==', 'active'),
      limit(1),
    ),
  );
  const existingMembershipId = membershipSnap.empty ? null : membershipSnap.docs[0]!.id;

  // Resolve existing Person by userId, then by email fallback.
  const personByUserIdSnap = await getDocs(
    query(
      collection(db, 'people'),
      where('organizationId', '==', invitationRecord.organizationId),
      where('userId', '==', user.uid),
      limit(1),
    ),
  );
  let existingPersonId = personByUserIdSnap.empty ? null : personByUserIdSnap.docs[0]!.id;
  let existingPersonData = personByUserIdSnap.empty ? null : personByUserIdSnap.docs[0]!.data() as Record<string, unknown>;

  if (!existingPersonId) {
    const personByEmailSnap = await getDocs(
      query(
        collection(db, 'people'),
        where('organizationId', '==', invitationRecord.organizationId),
        where('email', '==', user.email ?? invitationRecord.inviteeEmail),
        limit(1),
      ),
    );
    existingPersonId = personByEmailSnap.empty ? null : personByEmailSnap.docs[0]!.id;
    existingPersonData = personByEmailSnap.empty ? null : personByEmailSnap.docs[0]!.data() as Record<string, unknown>;
  }

  try {
    return await runTransaction(db, async (transaction) => {
      // ── Re-read invitation inside transaction (critical concurrency guard) ──
      const invitationSnap = await transaction.get(invitationRef);
      if (!invitationSnap.exists()) {
        return { ok: false, reason: 'not_found', message: 'This invitation link is invalid.' };
      }

      const invitationRaw = { id: invitationSnap.id, ...invitationSnap.data() } as Record<string, unknown> & { id: string };
      const invitation = normalizeInvitation(invitationRaw);

      // Validate invitation state.
      if (invitation.status === 'accepted') {
        return { ok: false, reason: 'accepted', message: 'This invitation has already been used.' };
      }
      if (invitation.status === 'revoked') {
        return { ok: false, reason: 'revoked', message: 'This invitation has been revoked.' };
      }
      if (invitation.status !== 'pending') {
        return { ok: false, reason: 'invalid', message: 'This invitation is no longer valid.' };
      }

      const expiryDate = toDate(invitation.expiresAt);
      if (expiryDate && expiryDate.getTime() < Date.now()) {
        return { ok: false, reason: 'expired', message: 'This invitation has expired.' };
      }

      // Validate invitee email matches authenticated user.
      const userEmail = (user.email ?? '').trim().toLowerCase();
      const inviteeEmail = invitation.inviteeEmail.trim().toLowerCase();
      if (userEmail && inviteeEmail && userEmail !== inviteeEmail) {
        return {
          ok: false,
          reason: 'email_mismatch',
          message: 'This invitation was sent to a different email address.',
        };
      }

      // Validate organization still exists.
      const orgSnap = await transaction.get(orgRef);
      if (!orgSnap.exists()) {
        return { ok: false, reason: 'org_not_found', message: 'The organization for this invitation no longer exists.' };
      }

      // Re-read user profile inside transaction.
      const userProfileSnap = await transaction.get(userProfileRef);

      // ── All reads complete; begin writes ───────────────────────────

      const now = Timestamp.now();
      const systemRole = platformRoleToSystemRole(invitation.platformRole);
      const displayName = user.displayName?.trim()
        || invitation.inviteeName
        || (user.email ? user.email.split('@')[0] : '')
        || 'Collaborator';
      const email = (user.email?.trim() || invitation.inviteeEmail);
      const { platformRole, professionalRole, invitedByUserId } = invitation;

      // Step 2: Create membership (if not already present).
      if (!existingMembershipId) {
        const membershipRef = doc(collection(db, 'memberships'));
        transaction.set(membershipRef, {
          organizationId: invitation.organizationId,
          userId: user.uid,
          roleId: systemRole,
          status: 'active',
          invitedBy: invitedByUserId,
          createdAt: now,
        });
      }

      // Step 3: Create/update Person record.
      if (existingPersonId) {
        const patch: Record<string, unknown> = { updatedAt: now };
        if (!existingPersonData?.userId) patch.userId = user.uid;
        if (!existingPersonData?.displayName && displayName) patch.displayName = displayName;
        if (!existingPersonData?.primaryRole) patch.primaryRole = platformRole;
        patch.invitationStatus = 'accepted';
        transaction.update(doc(db, 'people', existingPersonId), patch);
      } else {
        const personRef = doc(collection(db, 'people'));
        transaction.set(personRef, {
          organizationId: invitation.organizationId,
          userId: user.uid,
          email,
          displayName,
          primaryRole: platformRole,
          status: 'active',
          invitationStatus: 'accepted',
          createdAt: now,
          updatedAt: now,
        });
      }

      // Step 4-7: Create/update user profile.
      if (userProfileSnap.exists()) {
        const existingProfile = userProfileSnap.data() as Record<string, unknown>;
        const profilePatch: Record<string, unknown> = { updatedAt: now };
        if (!existingProfile.displayName && displayName) profilePatch.displayName = displayName;
        if (!existingProfile.role && professionalRole) profilePatch.role = professionalRole;
        if (!existingProfile.defaultOrganizationId) {
          profilePatch.defaultOrganizationId = invitation.organizationId;
          profilePatch.onboardingCompleted = true;
          profilePatch.onboardingCompletedAt = now;
        }
        if (Object.keys(profilePatch).length > 1) {
          transaction.update(userProfileRef, profilePatch);
        }
      } else {
        transaction.set(userProfileRef, {
          displayName,
          email,
          avatarUrl: null,
          role: professionalRole || null,
          roleCategory: null,
          onboardingCompleted: true,
          onboardingCompletedAt: now,
          defaultOrganizationId: invitation.organizationId,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Step 8: Mark invitation as accepted.
      transaction.update(invitationRef, {
        status: 'accepted',
        acceptedAt: now,
        updatedAt: now,
      });

      // Step 9: Record activity entry.
      const activityRef = doc(collection(db, 'activity_events'));
      transaction.set(activityRef, {
        entityType: 'release',
        entityId: invitation.id,
        organizationId: invitation.organizationId,
        actorId: user.uid,
        action: 'invitation.accepted',
        metadata: { details: `Invitation accepted by ${user.uid} as ${platformRole}` },
        createdAt: now,
      });

      console.log(ACCEPT_LOG, '✓ Transaction writes staged (membership, person, profile, accepted)');
      return {
        ok: true as const,
        invitation: { ...invitation, status: 'accepted' as const, acceptedAt: now },
      };
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    console.error(ACCEPT_LOG, '✗ Transaction failed', {
      type: err instanceof Error ? err.name : typeof err,
      message: err instanceof Error ? err.message : String(err),
      code,
      stack: err instanceof Error ? err.stack : undefined,
    });
    // Do not mask permission / transaction failures as "invalid invitation".
    const permissionDenied =
      code === 'permission-denied'
      || (err instanceof Error && /permission/i.test(err.message));
    return {
      ok: false,
      reason: 'invalid',
      message: permissionDenied
        ? 'Could not complete invitation acceptance (permission denied). Please contact support or try again after rules deploy.'
        : (err instanceof Error ? err.message : 'Something went wrong. Please try again.'),
    };
  }
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'invitations', invitationId), { status: 'revoked', updatedAt: Timestamp.now() });
}

export async function resendInvitation(
  invitationId: string,
  opts: { expiresInDays?: number } = {},
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const snap = await getDoc(doc(db, 'invitations', invitationId));
  if (!snap.exists()) throw new Error('Invitation not found');
  const now = Timestamp.now();
  const expiresInDays = opts.expiresInDays ?? DEFAULT_EXPIRY_DAYS;
  const newExpiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  await updateDoc(doc(db, 'invitations', invitationId), {
    status: 'pending',
    expiresAt: Timestamp.fromDate(newExpiresAt),
    updatedAt: now,
  });
}

export async function expireOldInvitations(orgId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const now = Timestamp.now();
  const snap = await getDocs(
    query(collection(db, 'invitations'), where('organizationId', '==', orgId), where('status', '==', 'pending')),
  );
  const batch: Promise<void>[] = [];
  for (const d of snap.docs) {
    const data = d.data() as { expiresAt?: unknown };
    const expiresAt = toDate(data.expiresAt);
    if (expiresAt && expiresAt.getTime() < Date.now()) {
      batch.push(updateDoc(doc(db, 'invitations', d.id), { status: 'expired', updatedAt: now }));
    }
  }
  await Promise.all(batch);
}

export async function getPendingInvitations(orgId: string): Promise<InvitationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'invitations'), where('organizationId', '==', orgId), where('status', '==', 'pending')),
  );
  return snap.docs.map((d) => normalizeInvitation({ id: d.id, ...d.data() }));
}

export async function getInvitationsByEmail(email: string): Promise<InvitationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'invitations'), where('email', '==', email)));
  return snap.docs.map((d) => normalizeInvitation({ id: d.id, ...d.data() }));
}

export async function getInvitationsByOrg(orgId: string): Promise<InvitationRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'invitations'), where('organizationId', '==', orgId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => normalizeInvitation({ id: d.id, ...d.data() }));
}

export async function getInvitationById(invitationId: string): Promise<InvitationRecord | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'invitations', invitationId));
  if (!snap.exists()) return null;
  return normalizeInvitation({ id: snap.id, ...snap.data() });
}
