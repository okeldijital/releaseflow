# RBAC-001 — Role-Based Access Control Audit & Enforcement

**Priority:** P0 – Security / Release Blocking  
**Status:** Implemented

## Root Cause Analysis

Collaborators inherited **administrator capabilities** for several independent reasons:

### 1. Binary UI shell (primary UX defect)

`apps/web/src/app/(app)/layout.tsx` treated only `AppRole === 'contributor'` as restricted. **Every other role** (including loading default `viewer`, `release_manager`, mis-resolved roles) received the full **admin navigation** (Releases, Administration, People, etc.).

While `roleLoading` / `role === 'viewer'`, the route guard **bailed out**, so admin chrome flashed and admin routes were not redirected.

### 2. Role resolution not org-scoped

`getUserRole(userId)` returned the **first** active membership in Firestore order — not the **active organization**. Multi-org users could show owner/admin privileges while working in a collaborator org.

### 3. Service layer did not enforce permissions

`createReleaseWithFullWorkflow`, `removeRelease`, `invitePerson` never called `hasPermission`. The permission matrix existed in `@releaseflow/core` but was only used for media/artwork.

### 4. Firestore Rules did not enforce RBAC

- `memberships` → any authenticated user could **write any `roleId`** (privilege escalation).
- `releases` create → only required `createdBy == auth.uid` — **no membership / role check**.
- Rules comments stated RBAC was “server-side only” without covering client SDK writes.

### 5. Not an invitation mapping bug (when data is correct)

Invitation accept correctly maps:

| Invitation `platformRole` | Membership `roleId` |
|---------------------------|---------------------|
| `collaborator` | `contributor` |
| `release_manager` | `release_manager` → alias `project_manager` |
| `administrator` | `administrator` |

Professional role goes to Person/profile — **not** membership. When membership `roleId` was `contributor`, the matrix already denied `release.write`; the UI and services simply **ignored** it.

---

## Authorization Architecture

```
Authentication (Firebase Auth)
        ↓
Organization Membership (memberships.roleId)
        ↓
normalizeRoleId / ROLE_ALIASES
        ↓
ROLE_PERMISSIONS (packages/core)
        ↓
Authorization Service (hasPermission / requirePermission)
        ↓
┌───────────────┬────────────────┬──────────────────┐
│ UI (role-store│ Route guards   │ Services         │
│  permissions) │ (app layout)   │ (release, invite)│
└───────────────┴────────────────┴──────────────────┘
        ↓
Firestore Rules (membership + member index + release create)
```

**Professional roles** are informational only.  
**No administrator fallback** — missing membership or unknown role → deny / least privilege (`contributor`).

### Session cache

- `role-store` holds permissions for the active org.
- `authorization-service` caches roleId for 60s; invalidated on org switch / role change.

---

## Permission Matrix (platform roles)

| Capability | Administrator | Manager | Collaborator |
|------------|:-------------:|:-------:|:------------:|
| View releases | ✓ | ✓ | ✓ |
| Create / edit release | ✓ | ✓ | ✗ |
| Delete release | ✓ | ✗ | ✗ |
| Invite users | ✓ | ✓ | ✗ |
| Remove users | ✓ | ✗ | ✗ |
| Manage organization | ✓ | ✗ | ✗ |
| Administration shell | ✓ | ✗ | ✗ |
| Manage assignments | ✓ | ✓ | Own (view) |
| Comment | ✓ | ✓ | ✓ |
| Team schedule | ✓ | ✓ | ✗ |
| Personal schedule | ✓ | ✓ | ✓ |
| Reschedule | ✓ | ✓ | ✗ |
| Readiness view | ✓ | ✓ | Limited |
| Go / No-Go | ✓ | ✓ | ✗ |

Canonical ids: `owner` | `administrator` | `project_manager` (Manager) | `contributor` (Collaborator).

---

## Files Modified

| File | Purpose |
|------|---------|
| `packages/core/src/auth/permissions.ts` | Expanded permission set + CAPABILITIES |
| `packages/core/src/auth/roles.ts` | RBAC-001 matrix; collaborator/manager helpers |
| `packages/core/src/auth/registry.ts` | Registry entries for all permissions |
| `apps/web/src/lib/auth/authorization-service.ts` | Cache, logging, getPermissionsForUser |
| `apps/web/src/lib/organization-repository.ts` | Org-scoped getUserRole; member index sync |
| `apps/web/src/stores/role-store.ts` | Org-scoped resolve; permission can(); fail-closed |
| `apps/web/src/hooks/usePermissions.ts` | UI hook over session permissions |
| `apps/web/src/app/(app)/layout.tsx` | Permission nav + route guards; no admin flash |
| `apps/web/src/lib/release-service.ts` | requirePermission create/edit/delete/status |
| `apps/web/src/lib/invitation-service.ts` | requirePermission user.invite |
| `apps/web/src/lib/invitation-repository.ts` | Update membership role on re-accept; member index |
| `apps/web/src/lib/pwa/offline-queue.ts` | Block unauthorized reschedule offline |
| `firestore.rules` | Membership escalation block; release create role; member index |
| `apps/web/src/__tests__/authorization.test.ts` | Matrix + deny collaborator createRelease |
| `docs/RBAC-001-AUTHORIZATION.md` | This document |

---

## Deploy note

Deploy Firestore rules for production enforcement:

```bash
firebase deploy --only firestore:rules
```

Member index documents are written on org create, invitation accept, and role resolve (self-heal).

---

## Validation checklist

- [x] Collaborator cannot create release (service + matrix + rules)
- [x] Collaborator cannot access administration / people / tracks / artists / dashboard
- [x] Manager can create release / invite; cannot delete release / org manage
- [x] Administrator retains full control
- [x] No admin fallback on missing membership
- [x] Role re-resolved on org switch
- [x] Authorization structured logging
- [ ] Manual UAT: collaborator invite → home only → no New Release
- [ ] Manual UAT: admin create/delete/invite
- [ ] Manual UAT: manager create + no org settings
