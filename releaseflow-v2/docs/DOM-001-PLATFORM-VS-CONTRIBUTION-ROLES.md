# DOM-001 — Separate Platform Roles from Release Contribution Roles

**Priority:** P1 – Domain Model Refinement  
**Status:** Implemented  
**Prerequisites:** RBAC-001, AUTH-001

## Domain Model

```
Person (identity)
  id, displayName, email, avatar
  primaryRole  ← DEPRECATED (legacy craft label; not used for security or list UI)

Organization Membership
  organizationId, userId, roleId (system), status
  → platformRole (Administrator | Manager | Contributor)
  → AuthorizationService

Assignment
  assigneeId, entityType, entityId (release), role
  → contributionRole (Lyricist, Composer, Producer, …)
```

These models are never merged. Authorization uses **platform role only**.

## Migration Strategy

| Field | Status | Notes |
|-------|--------|--------|
| `person.primaryRole` | **Deprecated** | Still on document for backward compatibility. Not shown as identity subtitle. Not written from platform role on invite accept. |
| `invitation.professionalRole` | **Deprecated** | Invite UI no longer collects it; stored as empty string. |
| `membership.roleId` | **Authoritative** | Platform security role |
| `assignment.role` | **Authoritative** | Contribution role for that assignment |

No destructive data migration. Legacy values remain readable; new writes stop conflating them.

## UI Changes

### People list
- Subtitle = **Platform Role** (Contributor / Manager / Administrator)
- Filter = Platform Role + Status + Release (not Discipline)

### Person profile
- Header: name + platform role + status + email + organization
- **Security & Access**: platform role, membership, invitation status, member since
- **Administrator controls**: change platform role, activate/deactivate, remove member
- **Release Contributions**: grouped from assignments (role per release)

### Invitations
- Collect **Platform Role only**
- Creative roles assigned later via assignment dialog (**Contribution Role**)

## Files Modified

| File | Purpose |
|------|---------|
| `lib/people-platform.ts` | Resolve platform role; group contribution roles |
| `lib/platform-roles.ts` | Labels: Manager / Contributor |
| `app/(app)/people/page.tsx` | List shows platform role |
| `app/(app)/people/[id]/page.tsx` | Security & Access + contributions |
| `app/(app)/people/invitations/page.tsx` | No professional role field |
| `app/invite/[token]/page.tsx` | Platform role only on invite card |
| `hooks/useInvitation.ts` | Invite without professional role |
| `lib/invitation-repository.ts` | Accept does not set person primaryRole from platform role |
| `components/assignment-dialog.tsx` | Contribution Role label |
| `administration/members`, pickers, wizard | Invite platform-only |
| `__tests__/people-platform.test.ts` | Unit tests |
| `docs/DOM-001-…` | This document |

RBAC / AUTH-001 unchanged — still driven by `membership.roleId`.
