# ARS-004 — Assignment Domain Finalization

**Status:** Implemented  
**Priority:** P0  
**Depends on:** ARS-003  

## Objective

Complete the Assignment migration: remove remaining Task operational UI, enforce Person.userId integrity, add Firestore real-time listeners owned by the repository, centralize identity resolution, and lock contracts with regression tests.

No new product features.

---

## ARS-004.1 — Remove legacy Task UI

| Surface | Before | After |
|---------|--------|--------|
| Release Workflow section | `getTasksByEntity` task cards | Stage orchestration from readiness categories only; work via Assignments |
| `/work` | Task list | Redirect → `/assignments` |
| `/contributor` | Task list (ARS-003) | Redirect → `/home` |
| Dashboard “Waiting for You” | `getTasksByAssignee` | `useAssignments` + identity filter |

**Workflow architecture (enforced in UX):**

```
Workflow Stage (orchestration UI)
        │
        ▼
Assignments (execution — only work model shown to users)
        │
        ▼
Contributor
```

Task engine may still generate internal data for engines; **no operational Task list** is shown on Release / work / collaborator paths.

---

## ARS-004.2 — Person.userId integrity

### Invitation path

`acceptPersonInvitation` now **always** sets:

- `userId: user.uid`
- `invitationStatus: 'accepted'`
- `status: 'active'`

### Create assignment

`createNewAssignment` **rejects** if assignee Person has no `userId` (actionable error + integrity log). No silent notification fallbacks.

### Migration

```bash
node scripts/migrate-person-userids.mjs --org=<organizationId>          # dry-run report
node scripts/migrate-person-userids.mjs --org=<organizationId> --apply  # write links
```

Report: linked / would_link / missing / duplicates / applied.

---

## ARS-004.3 — Firestore real-time

Repository owns listeners:

- `subscribeOrgAssignments(orgId, onData, onError?)`
- `subscribeEntityAssignments(entityType, entityId, onData, onError?, opts?)`

Service re-exports them. **Pages never call `onSnapshot`.**

`useAssignments` and `AssignmentsSection` subscribe via the service.

Same-tab `assignment-events` bus remains as a secondary signal; cross-browser updates come from Firestore snapshots.

---

## ARS-004.4 — Identity strategy

**Canonical chain:**

```
Assignment.assigneeId  →  Person.id
Person.userId          →  Firebase Auth uid
Assignment.assigneeUserId  →  denormalized Auth uid at write time
```

All actor/assignee matching for operational UX uses `assignment-identity.ts`:

- `resolveActorIdentityKeys`
- `assignmentMatchesIdentity`
- `actorIsAssignee`

Updated: Assignments page, Home, Assignment detail, Readiness, Dashboard.

---

## ARS-004.5 — Repository / service only

| Workspace | Path |
|-----------|------|
| Home | useAssignments → service/repo + snapshot |
| Assignments list | same |
| Release assignments | AssignmentsSection → subscribeEntityAssignments |
| Schedule | schedule-service → assignment-repository list APIs |
| Readiness | assignment loads via readiness helpers |
| Notifications | events + processor (not assignment list queries) |

---

## ARS-004.6 — Regression suite

`__tests__/ars-004-assignment-lifecycle.test.ts` — contract tests for:

- integrity error on missing userId
- subscriptions in repository
- no task-service on Release page
- redirects
- invitation userId write
- identity module usage

Manual E2E (two browsers) still required for true multi-client snapshot verification.

---

## Before / after

**Before:** Tasks on Release Workflow; Person.userId optional; same-tab bus only; ad-hoc identity compares.

**After:** Assignments only for work UI; userId required on create; Firestore listeners; centralized identity.

---

## Residual

- Internal engines (`task-service`, forecasting, etc.) may still touch `tasks` for analytics.
- Campaign tasks are campaign domain, not release Assignment.
- Migration must be run per org in production with Admin credentials.

---

## Acceptance checklist

| Criterion | Status |
|-----------|--------|
| No operational Task list on Release/work/home/dashboard | ✓ |
| Workflow stages without Task entities | ✓ |
| Person.userId on invite accept | ✓ |
| Create rejects missing userId | ✓ |
| Migration script | ✓ |
| Repository snapshot listeners | ✓ |
| Identity via assignment-identity | ✓ |
| Contract regression tests | ✓ |
| Production build | (verify CI) |
