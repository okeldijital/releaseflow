# AUTH-001 — Central Authorization Service

**Priority:** High (Architectural Hardening)  
**Status:** Implemented  
**Prerequisite:** RBAC-001

## Authorization Architecture

```
Authenticated User
        ↓
Organization Membership (memberships.roleId)
        ↓
Platform Role → ROLE_PERMISSIONS (packages/core)
        ↓
AuthorizationService  ← single application authority
├── UI (sync session: canCreateRelease, …)
├── Routes (layout guards)
├── Services (requireCreateRelease, …)
├── API routes (canAsync + membershipResolver)
└── Offline queue (canRescheduleAsync)

Firestore Rules → independent final enforcement layer
```

### Permission resolution

1. `loadContext(userId, organizationId)` loads active membership role once.
2. Permissions expanded from `ROLE_PERMISSIONS` / aliases.
3. Session methods read the in-memory context only (no Firestore per button).
4. Services/API pass explicit `orgId` + `userId` via async methods.

### Cache lifecycle

| Event | Action |
|-------|--------|
| `loadContext` | Invalidate lookup cache for user+org; reload |
| Org switch | `loadContext` again |
| Logout | `clearContext()` |
| Invitation accept | Next layout `resolveRole` reloads context |
| Role change | Invalidate + reload |

- **In-memory only** — never localStorage/sessionStorage.
- Membership lookup cache TTL: 60s (also force-bypassed on loadContext).

### Fail-closed

If context is missing, loading, or membership absent → **DENIED**.  
Never defaults to administrator.

### Firestore relationship

Application decisions go through `AuthorizationService`.  
Firestore Rules independently enforce membership writes and release create roles. They do not call this service.

---

## Service API

Singleton: `AuthorizationService` from `@/lib/auth/authorization-service`.

### Context

| Method | Description |
|--------|-------------|
| `loadContext(userId, orgId, opts?)` | Resolve membership → permissions |
| `clearContext()` | Logout / reset |
| `invalidateCache(org?, user?)` | Drop lookup cache |
| `getCurrentRole()` | Platform role id or null |
| `getCurrentOrganization()` | Active org id or null |
| `getCurrentUserId()` | Active user id or null |
| `getPermissions()` | Effective permission list |
| `hasContext()` / `isLoading()` | State flags |

### Generic

| Method | Description |
|--------|-------------|
| `can(permission)` | Session sync allow |
| `cannot(permission)` | Session sync deny |
| `require(permission, org?, user?, opts?)` | Async throw if denied |
| `requireSync(permission)` | Session throw if denied |
| `explain(permission)` | Session decision + reason |
| `canAsync` / `cannotAsync` / `explainAsync` | Explicit org+user |

### Business capabilities (session sync)

`canCreateRelease`, `canEditRelease`, `canDeleteRelease`, `canPublishRelease`, `canApproveRelease`, `canInviteCollaborators`, `canInviteUsers`, `canManageOrganization`, `canViewAdministration`, `canManageAssignments`, `canAssignWork`, `canViewTeamSchedule`, `canRescheduleAssignments`, `canViewReleaseReadiness`, `canViewReadiness`, `canGoNoGo`, `canComment`, `canReviewAssignment`, `canViewNotifications`, `canManageUsers`, `canViewAnalytics`, `canManagePeople`, `canViewReleases`, `canViewAssignments`, `canViewPersonalSchedule`, `isCollaboratorWorkspace`.

### Service requires (async)

`requireCreateRelease`, `requireEditRelease`, `requireDeleteRelease`, `requirePublishRelease`, `requireInviteCollaborators`, `requireManageOrganization`, `requireManageAssignments`, `requireReschedule`, `requireMediaUpload`, `requireArtworkUpload`, …

### React

```ts
const { canCreateRelease, canInviteCollaborators } = usePermissions();
// delegates to AuthorizationService session context
```

---

## Refactoring Summary

| Location | Conversion |
|----------|------------|
| `role-store` | Thin binding; `loadContext` / `can` / `clearContext` |
| `usePermissions` | All capability flags from service |
| `(app)/layout` | Route + nav guards via capability methods |
| `release-service` | `requireCreateRelease` / edit / delete / publish |
| `invitation-service` | `requireInviteCollaborators` |
| `media-service` / `artwork-service` | `canAsync` |
| API media/artwork routes | `canAsync` + membershipResolver |
| `offline-queue` | `canRescheduleAsync` |
| `assignment-service.canManageReview` | Session capability check |

Deprecated wrappers kept for tests: `hasPermission`, `requirePermission` → delegate to service.

---

## Files

| File | Change |
|------|--------|
| `apps/web/src/lib/auth/authorization-service.ts` | Full AuthorizationService singleton |
| `packages/core/src/auth/permissions.ts` | Expanded CAPABILITIES |
| `apps/web/src/stores/role-store.ts` | Service binding |
| `apps/web/src/hooks/usePermissions.ts` | Capability API for UI |
| `apps/web/src/app/(app)/layout.tsx` | Guards via service |
| `apps/web/src/lib/release-service.ts` | Service requires |
| `apps/web/src/lib/invitation-service.ts` | Service require invite |
| `apps/web/src/lib/media/media-service.ts` | canAsync |
| `apps/web/src/lib/artwork/artwork-service.ts` | canAsync |
| `apps/web/src/lib/assignment-service.ts` | canManageReview via service |
| `apps/web/src/lib/pwa/offline-queue.ts` | Service gate |
| `apps/web/src/app/api/media/upload-signature/route.ts` | Service |
| `apps/web/src/app/api/artwork/destroy/route.ts` | Service |
| `apps/web/src/__tests__/authorization-service-auth001.test.ts` | AUTH-001 tests |
| `docs/AUTH-001-AUTHORIZATION-SERVICE.md` | This doc |

Firestore rules: **unchanged** from RBAC-001.
