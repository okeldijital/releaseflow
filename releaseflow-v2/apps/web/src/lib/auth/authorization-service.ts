/**
 * AUTH-001 — Central Authorization Service.
 *
 * Single authority for application-level permission evaluation.
 *
 *   Authenticated User → Org Membership → Platform Role → Permission Matrix
 *                              ↓
 *                     AuthorizationService
 *                     ├── UI (sync session)
 *                     ├── Routes
 *                     ├── Services / API (async explicit)
 *                     └── Offline queue
 *
 * Firestore Rules remain the final enforcement layer (independent).
 *
 * Rules:
 * - Fail closed (deny) when context cannot be resolved.
 * - Never default to administrator.
 * - Never persist auth state in localStorage/sessionStorage.
 * - Cache in memory only; invalidate on org/role/logout/invite accept.
 */

import type { Firestore } from '@firebase/firestore';
import { collection, query, where, limit, getDocs } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import {
  resolveRole,
  roleGrantsPermission,
  resolvePermissions,
} from '@releaseflow/core/auth/authorization';
import type { Permission } from '@releaseflow/core/auth/permissions';
import {
  CAPABILITIES,
  type CapabilityName,
} from '@releaseflow/core/auth/permissions';
import { isCollaboratorRole, normalizeRoleId } from '@releaseflow/core/auth/roles';

const AUTH_LOG = '[Authorization]';
const CACHE_TTL_MS = 60_000;

// ── Types ────────────────────────────────────────────────────────────

export type MembershipResolver = (
  organizationId: string,
  userId: string,
) => Promise<string | null>;

export interface AuthorizationOptions {
  membershipResolver?: MembershipResolver;
  db?: Firestore;
  bypassCache?: boolean;
}

export interface AuthorizationContext {
  userId: string;
  organizationId: string;
  roleId: string | null;
  permissions: Permission[];
  loadedAt: number;
}

export interface AuthorizationExplanation {
  allowed: boolean;
  permission: Permission | string;
  roleId: string | null;
  organizationId: string | null;
  userId: string | null;
  reason: string;
  decision: 'ALLOWED' | 'DENIED';
}

export class AuthorizationError extends Error {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly permission: Permission | string,
  ) {
    super(`Permission denied: ${permission} (org ${organizationId})`);
    this.name = 'AuthorizationError';
  }
}

// ── Internal caches ──────────────────────────────────────────────────

/** Membership role cache: `${orgId}:${userId}` → roleId */
const roleLookupCache = new Map<string, { roleId: string | null; at: number }>();

function cacheKey(organizationId: string, userId: string): string {
  return `${organizationId}:${userId}`;
}

function defaultMembershipResolver(db: Firestore): MembershipResolver {
  return async (organizationId, userId) => {
    const snap = await getDocs(
      query(
        collection(db, 'memberships'),
        where('userId', '==', userId),
        where('organizationId', '==', organizationId),
        where('status', '==', 'active'),
        limit(1),
      ),
    );
    if (snap.empty) return null;
    const data = snap.docs[0]?.data() as { roleId?: string | null; status?: string } | undefined;
    return resolveRole(data);
  };
}

async function lookupRoleId(
  organizationId: string,
  userId: string,
  options: AuthorizationOptions = {},
): Promise<string | null> {
  if (!organizationId || !userId) return null;

  const key = cacheKey(organizationId, userId);
  if (!options.bypassCache) {
    const hit = roleLookupCache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.roleId;
  }

  const resolver =
    options.membershipResolver
    ?? defaultMembershipResolver(options.db ?? (getDb() as Firestore));

  const roleId = await resolver(organizationId, userId);
  roleLookupCache.set(key, { roleId, at: Date.now() });
  return roleId;
}

function logDecision(payload: Record<string, unknown>): void {
  console.log(AUTH_LOG, payload);
}

// ── Authorization Service (singleton) ────────────────────────────────

class AuthorizationServiceImpl {
  private context: AuthorizationContext | null = null;
  private loading = false;

  // ── Context lifecycle ────────────────────────────────────────────

  /**
   * Resolve user + org membership into an in-memory authorization context.
   * Call on login, org switch, invitation accept. Invalidate first if needed.
   */
  async loadContext(
    userId: string,
    organizationId: string,
    options: AuthorizationOptions = {},
  ): Promise<AuthorizationContext> {
    this.loading = true;
    try {
      if (!userId || !organizationId) {
        this.context = null;
        this.loading = false;
        logDecision({
          Decision: 'DENIED',
          Reason: 'missing_user_or_org',
          User: userId || '(none)',
          Organization: organizationId || '(none)',
        });
        return {
          userId: userId || '',
          organizationId: organizationId || '',
          roleId: null,
          permissions: [],
          loadedAt: Date.now(),
        };
      }

      this.invalidateCache(organizationId, userId);
      const roleId = await lookupRoleId(organizationId, userId, {
        ...options,
        bypassCache: true,
      });
      // Fail closed: no membership → empty permissions (never admin).
      const permissions = roleId ? resolvePermissions(roleId) : [];

      this.context = {
        userId,
        organizationId,
        roleId,
        permissions,
        loadedAt: Date.now(),
      };

      // Self-heal rules member index (best-effort).
      if (roleId) {
        try {
          const { syncOrgMemberIndex } = await import('@/lib/organization-repository');
          await syncOrgMemberIndex(organizationId, userId, roleId, 'active');
        } catch {
          /* non-blocking */
        }
      }

      logDecision({
        User: userId,
        Organization: organizationId,
        Role: roleId,
        PermissionCount: permissions.length,
        Decision: 'CONTEXT_LOADED',
      });

      return this.context;
    } catch {
      // Fail closed — least privilege, never admin.
      this.context = {
        userId,
        organizationId,
        roleId: null,
        permissions: [],
        loadedAt: Date.now(),
      };
      logDecision({
        User: userId,
        Organization: organizationId,
        Decision: 'DENIED',
        Reason: 'context_load_failed',
      });
      return this.context;
    } finally {
      this.loading = false;
    }
  }

  /** Clear session context (logout / leave org). */
  clearContext(): void {
    this.context = null;
    this.loading = false;
    this.invalidateCache();
    logDecision({ Decision: 'CONTEXT_CLEARED' });
  }

  /** Invalidate membership role lookup cache. */
  invalidateCache(organizationId?: string, userId?: string): void {
    if (!organizationId && !userId) {
      roleLookupCache.clear();
      return;
    }
    for (const key of [...roleLookupCache.keys()]) {
      const [org, uid] = key.split(':');
      if (organizationId && org !== organizationId) continue;
      if (userId && uid !== userId) continue;
      roleLookupCache.delete(key);
    }
  }

  isLoading(): boolean {
    return this.loading;
  }

  hasContext(): boolean {
    return this.context != null && this.context.roleId != null;
  }

  getContext(): AuthorizationContext | null {
    return this.context;
  }

  getCurrentRole(): string | null {
    return this.context?.roleId ?? null;
  }

  getCurrentOrganization(): string | null {
    return this.context?.organizationId ?? null;
  }

  getCurrentUserId(): string | null {
    return this.context?.userId ?? null;
  }

  getPermissions(): Permission[] {
    return this.context?.permissions ?? [];
  }

  // ── Generic evaluation (session, sync) ───────────────────────────

  /**
   * Session-scoped permission check. Fail closed if context missing/loading.
   */
  can(permission: Permission | string): boolean {
    if (this.loading || !this.context) {
      logDecision({
        Permission: permission,
        Decision: 'DENIED',
        Reason: this.loading ? 'context_loading' : 'no_context',
      });
      return false;
    }
    if (!this.context.roleId) {
      logDecision({
        Permission: permission,
        Decision: 'DENIED',
        Reason: 'no_active_membership',
        Organization: this.context.organizationId,
        User: this.context.userId,
      });
      return false;
    }
    const allowed = this.context.permissions.includes(permission as Permission);
    logDecision({
      Permission: permission,
      Decision: allowed ? 'ALLOWED' : 'DENIED',
      Reason: allowed ? 'role_grants_permission' : 'role_lacks_permission',
      Role: this.context.roleId,
      Organization: this.context.organizationId,
      User: this.context.userId,
    });
    return allowed;
  }

  cannot(permission: Permission | string): boolean {
    return !this.can(permission);
  }

  /**
   * Explain a permission decision for the current session (debugging).
   */
  explain(permission: Permission | string): AuthorizationExplanation {
    const ctx = this.context;
    if (this.loading || !ctx) {
      return {
        allowed: false,
        permission,
        roleId: null,
        organizationId: null,
        userId: null,
        reason: this.loading ? 'Authorization context is still loading' : 'No authorization context loaded',
        decision: 'DENIED',
      };
    }
    if (!ctx.roleId) {
      return {
        allowed: false,
        permission,
        roleId: null,
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        reason: 'No active organization membership',
        decision: 'DENIED',
      };
    }
    const allowed = ctx.permissions.includes(permission as Permission);
    return {
      allowed,
      permission,
      roleId: ctx.roleId,
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      reason: allowed
        ? `Platform Role = ${ctx.roleId}; permission ${permission} granted by role`
        : `Platform Role = ${ctx.roleId}; permission ${permission} missing from role grants`,
      decision: allowed ? 'ALLOWED' : 'DENIED',
    };
  }

  /**
   * Require permission for the current session (throws AuthorizationError).
   */
  requireSync(permission: Permission | string): void {
    if (!this.can(permission)) {
      throw new AuthorizationError(
        this.context?.organizationId ?? '',
        this.context?.userId ?? '',
        permission,
      );
    }
  }

  // ── Async evaluation (services / API — explicit org+user) ────────

  /**
   * Async permission check for a specific user+org (or session if omitted).
   */
  async canAsync(
    permission: Permission,
    organizationId?: string | null,
    userId?: string | null,
    options: AuthorizationOptions = {},
  ): Promise<boolean> {
    const org = organizationId ?? this.context?.organizationId;
    const uid = userId ?? this.context?.userId;

    if (!org || !uid) {
      logDecision({
        Permission: permission,
        Decision: 'DENIED',
        Reason: 'missing_user_or_org',
        User: uid ?? '(none)',
        Organization: org ?? '(none)',
      });
      return false;
    }

    // Fast path: session context matches.
    if (
      this.context
      && this.context.organizationId === org
      && this.context.userId === uid
      && !options.bypassCache
    ) {
      return this.can(permission);
    }

    const roleId = await lookupRoleId(org, uid, options);
    if (!roleId) {
      logDecision({
        Permission: permission,
        Decision: 'DENIED',
        Reason: 'no_active_membership',
        User: uid,
        Organization: org,
      });
      return false;
    }

    const allowed = roleGrantsPermission(roleId, permission);
    logDecision({
      Permission: permission,
      Decision: allowed ? 'ALLOWED' : 'DENIED',
      Reason: allowed ? 'role_grants_permission' : 'role_lacks_permission',
      Role: roleId,
      User: uid,
      Organization: org,
    });
    return allowed;
  }

  async cannotAsync(
    permission: Permission,
    organizationId?: string | null,
    userId?: string | null,
    options?: AuthorizationOptions,
  ): Promise<boolean> {
    return !(await this.canAsync(permission, organizationId, userId, options));
  }

  /**
   * Require permission (async). Primary API for services and routes.
   */
  async require(
    permission: Permission | string,
    organizationId?: string | null,
    userId?: string | null,
    options?: AuthorizationOptions,
  ): Promise<void> {
    const allowed = await this.canAsync(
      permission as Permission,
      organizationId,
      userId,
      options,
    );
    if (!allowed) {
      throw new AuthorizationError(
        organizationId ?? this.context?.organizationId ?? '',
        userId ?? this.context?.userId ?? '',
        permission,
      );
    }
  }

  async explainAsync(
    permission: Permission | string,
    organizationId?: string | null,
    userId?: string | null,
    options?: AuthorizationOptions,
  ): Promise<AuthorizationExplanation> {
    const org = organizationId ?? this.context?.organizationId ?? null;
    const uid = userId ?? this.context?.userId ?? null;
    if (!org || !uid) {
      return {
        allowed: false,
        permission,
        roleId: null,
        organizationId: org,
        userId: uid,
        reason: 'Missing user or organization',
        decision: 'DENIED',
      };
    }
    const roleId = await lookupRoleId(org, uid, options);
    if (!roleId) {
      return {
        allowed: false,
        permission,
        roleId: null,
        organizationId: org,
        userId: uid,
        reason: 'No active organization membership',
        decision: 'DENIED',
      };
    }
    const allowed = roleGrantsPermission(roleId, permission as Permission);
    return {
      allowed,
      permission,
      roleId,
      organizationId: org,
      userId: uid,
      reason: allowed
        ? `Platform Role = ${roleId}; permission ${permission} granted by role`
        : `Platform Role = ${roleId}; permission ${permission} missing from role grants`,
      decision: allowed ? 'ALLOWED' : 'DENIED',
    };
  }

  // ── Capability helpers (business language) ───────────────────────

  private cap(name: CapabilityName): boolean {
    return this.can(CAPABILITIES[name]);
  }

  private async capAsync(
    name: CapabilityName,
    organizationId?: string | null,
    userId?: string | null,
    options?: AuthorizationOptions,
  ): Promise<boolean> {
    return this.canAsync(CAPABILITIES[name], organizationId, userId, options);
  }

  private async requireCap(
    name: CapabilityName,
    organizationId?: string | null,
    userId?: string | null,
    options?: AuthorizationOptions,
  ): Promise<void> {
    return this.require(CAPABILITIES[name], organizationId, userId, options);
  }

  canCreateRelease(): boolean { return this.cap('createRelease'); }
  canEditRelease(): boolean { return this.cap('editRelease'); }
  canDeleteRelease(): boolean { return this.cap('deleteRelease'); }
  canPublishRelease(): boolean { return this.cap('publishRelease'); }
  canApproveRelease(): boolean { return this.cap('approveRelease'); }
  canInviteCollaborators(): boolean { return this.cap('inviteCollaborators'); }
  canInviteUsers(): boolean { return this.cap('inviteUsers'); }
  canManageOrganization(): boolean { return this.cap('manageOrganization'); }
  canViewAdministration(): boolean { return this.cap('viewAdministration'); }
  canManageAssignments(): boolean { return this.cap('manageAssignments'); }
  canAssignWork(): boolean { return this.cap('assignWork'); }
  canViewTeamSchedule(): boolean { return this.cap('viewTeamSchedule'); }
  canRescheduleAssignments(): boolean { return this.cap('rescheduleAssignments'); }
  canViewReleaseReadiness(): boolean { return this.cap('viewReleaseReadiness'); }
  canViewReadiness(): boolean { return this.cap('viewReadiness'); }
  canGoNoGo(): boolean { return this.cap('goNoGo'); }
  canComment(): boolean { return this.cap('comment'); }
  canReviewAssignment(): boolean { return this.cap('reviewAssignment'); }
  canViewNotifications(): boolean { return this.cap('viewNotifications'); }
  canManageUsers(): boolean { return this.cap('manageUsers'); }
  canViewAnalytics(): boolean { return this.cap('viewAnalytics'); }
  canManagePeople(): boolean { return this.cap('managePeople'); }
  canViewReleases(): boolean { return this.cap('viewReleases'); }
  canViewAssignments(): boolean { return this.cap('viewAssignments'); }
  canViewPersonalSchedule(): boolean { return this.cap('viewPersonalSchedule'); }

  /**
   * True when the current role is collaborator-tier (restricted shell).
   * Derived from permissions / role via core helper — not ad-hoc string compares in UI.
   */
  isCollaboratorWorkspace(): boolean {
    if (this.loading || !this.context?.roleId) return true; // fail closed for elevated UI
    return isCollaboratorRole(this.context.roleId);
  }

  // Async capability requires for services
  requireCreateRelease(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.requireCap('createRelease', orgId, userId, options);
  }
  requireEditRelease(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.requireCap('editRelease', orgId, userId, options);
  }
  requireDeleteRelease(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.requireCap('deleteRelease', orgId, userId, options);
  }
  requirePublishRelease(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.requireCap('publishRelease', orgId, userId, options);
  }
  requireInviteCollaborators(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.requireCap('inviteCollaborators', orgId, userId, options);
  }
  requireManageOrganization(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.requireCap('manageOrganization', orgId, userId, options);
  }
  requireManageAssignments(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.requireCap('manageAssignments', orgId, userId, options);
  }
  requireReschedule(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.requireCap('rescheduleAssignments', orgId, userId, options);
  }
  requireMediaUpload(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.requireCap('uploadMedia', orgId, userId, options);
  }
  requireArtworkUpload(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.requireCap('uploadArtwork', orgId, userId, options);
  }

  canCreateReleaseAsync(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.capAsync('createRelease', orgId, userId, options);
  }
  canRescheduleAsync(orgId: string, userId: string, options?: AuthorizationOptions) {
    return this.capAsync('rescheduleAssignments', orgId, userId, options);
  }

  /** Normalized platform role label for display only. */
  getNormalizedRole(): string | null {
    return normalizeRoleId(this.context?.roleId) ?? this.context?.roleId ?? null;
  }
}

/** Singleton — the only application authorization entry point. */
export const AuthorizationService = new AuthorizationServiceImpl();

// ── Backward-compatible functional exports (delegate to service) ─────

export function invalidateAuthorizationCache(
  organizationId?: string,
  userId?: string,
): void {
  AuthorizationService.invalidateCache(organizationId, userId);
}

export async function resolveMembershipRole(
  organizationId: string,
  userId: string | null | undefined,
  options: AuthorizationOptions = {},
): Promise<string | null> {
  if (!organizationId || !userId) return null;
  return lookupRoleId(organizationId, userId, options);
}

/**
 * @deprecated Prefer AuthorizationService.canAsync / .require
 */
export async function hasPermission(
  organizationId: string,
  userId: string | null | undefined,
  permission: Permission,
  options: AuthorizationOptions = {},
): Promise<boolean> {
  return AuthorizationService.canAsync(permission, organizationId, userId, options);
}

/**
 * @deprecated Prefer AuthorizationService.require
 */
export async function requirePermission(
  organizationId: string,
  userId: string | null | undefined,
  permission: Permission,
  options?: AuthorizationOptions,
): Promise<void> {
  return AuthorizationService.require(permission, organizationId, userId, options);
}

export async function getPermissionsForUser(
  organizationId: string,
  userId: string | null | undefined,
  options?: AuthorizationOptions,
): Promise<{ roleId: string | null; permissions: Permission[] }> {
  if (!organizationId || !userId) return { roleId: null, permissions: [] };
  const roleId = await lookupRoleId(organizationId, userId, options);
  if (!roleId) return { roleId: null, permissions: [] };
  return { roleId, permissions: resolvePermissions(roleId) };
}

export { CAPABILITIES, roleGrantsPermission, resolvePermissions };
export type { CapabilityName };
