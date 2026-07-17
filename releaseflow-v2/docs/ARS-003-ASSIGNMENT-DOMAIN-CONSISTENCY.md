# ARS-003 — Assignment Domain Consistency Remediation

**Status:** Implemented (P0)  
**Priority:** Blocking  
**Depends on:** AUTH-001, DOM-001, AW-001, RBAC-001, BUG-001 audit  

## Root cause analysis (summary)

From BUG-001:

1. **Divergent queries** — Release used `entityType+entityId`; Assignments/Home used `organizationId+orderBy` inside a hook that swallowed all errors into `[]`.
2. **Identity split** — `assigneeId` = Person.id while lifecycle checks compared to Auth uid; collaborator filters often only matched uid.
3. **Notifications deferred** — `notification_events` written but `processPendingEvents` not run on create.
4. **Activity not on release** — create wrote `entityType: 'task'` / assignment id only.
5. **Parallel Task domain** — `/contributor` and Workflow still read `tasks`.

## Final architecture

```
Assignment (Firestore collection: assignments)
        │
        ▼
assignment-repository.ts     ← only write/read API for assignment docs
        │
        ▼
assignment-service.ts        ← auth, integrity, activity, notifications, events bus
        │
        ├─► Release Workspace (AssignmentsSection)
        ├─► Assignments Workspace (useAssignments)
        ├─► Collaborator Home (/home)
        ├─► Schedule projection (schedule-service)
        ├─► Activity (assignment + release)
        ├─► Notification events → processor → user_notifications
        └─► Readiness (existing assignment reads)

assignment-identity.ts       ← Person.id ↔ Auth uid resolution
assignment-events.ts         ← same-tab reload signal (not a second store)
```

## Repository audit

### assignment-repository

| Method | Notes |
|--------|--------|
| createAssignment | Writes `releaseId`, `assigneeUserId`, `assignerUserId` (ARS-003) |
| updateAssignment | unchanged |
| deleteAssignment | hard delete |
| getAssignment | by id |
| listAssignments | org filter + orderBy; **fallback** without orderBy; active status filter |
| getAssignmentsByAssignee | person id |
| getAssignmentsByEntity | optional org + terminal filter (default active only) |
| findDuplicateAssignment | org-scoped |

Shared: `isActiveAssignmentStatus` / `TERMINAL_ASSIGNMENT_STATUSES`.

### assignment-service

Sole creator via `createNewAssignment`:

1. `requireManageAssignments`
2. Release org integrity check
3. Resolve `assigneeUserId` from Person
4. Repository create
5. Activity on assignment + release
6. Notification event + **immediate** `processPendingEvents`
7. Watchers
8. `emitAssignmentsChanged`

### schedule-service

Projection only — `listAssignments` / `getAssignmentsByAssignee`; matches `assigneeUserId`.

### activity-service

Immutable `activity_events`. Create now dual-writes.

### notifications

Events only from service; processor creates `user_notifications`.

## Identity audit

| Location | Before | After |
|----------|--------|--------|
| create assignee | Person.id only | Person.id + assigneeUserId |
| accept/decline/start/review | `assigneeId === actorId` | `actorIsAssignee()` |
| Assignments page collab filter | `identityIds.has(assigneeId)` | `assignmentMatchesIdentity` |
| Home | same | same |
| Schedule mine | person + uid | + assigneeUserId |

## Query audit (after)

| Surface | Source |
|---------|--------|
| Release | `fetchAssignmentsByEntity` + org + live bus |
| Assignments | `fetchAssignments` via useAssignments |
| Home | useAssignments + identity filter |
| Schedule | loadScheduleAssignments + live bus |
| /contributor | **redirect → /home** |

## Notification pipeline (after)

```
create → notification_events → processPendingEvents (same request)
      → user_notifications → badge/inbox
```

## Legacy cleanup report

| Area | Action |
|------|--------|
| `/contributor` | Redirect to `/home` (no tasks query) |
| Release Workflow section | Still shows **tasks** (engine-generated) — documented residual |
| task-service, reporting, forecasting | Residual analytics/engine use of `tasks` — not operational collaborator path |
| resource_assignments | Unchanged; not collaborator assignment UX |

**Not deleted:** entire Task engine (workflow generation still depends on it). Operational collaborator paths no longer *prefer* tasks for assignments.

## Data integrity on create

| Check | Behaviour |
|-------|-----------|
| organizationId required | throw |
| release org match | throw if mismatch |
| assignee person org | throw if mismatch |
| assigneeUserId | resolved or null (invitee without login) |
| contribution role | string from AW-001 list |

## Real-time consistency

Same-tab: `emitAssignmentsChanged` → useAssignments, AssignmentsSection, Schedule, Home inbox refresh.  
Cross-tab: standard navigation/reload; badge poll still processes pending events.

## Before / after

**Before:** create → Firestore ok → Release entity query ok → org list silent empty → no notify process → no release activity → collab filter miss.

**After:** create → enriched fields → dual activity → process notifications → event bus → org list with fallback → identity via Person↔uid → schedule/home/assignments refresh.

## Files touched

- `lib/assignment-repository.ts`
- `lib/assignment-service.ts`
- `lib/assignment-identity.ts` (new)
- `lib/assignment-events.ts` (new)
- `hooks/useAssignment.ts`
- `components/assignments-section.tsx`
- `app/(app)/assignments/page.tsx`
- `app/(app)/home/page.tsx`
- `app/(app)/schedule/page.tsx`
- `app/(app)/releases/[id]/page.tsx` (activity labels)
- `app/(app)/contributor/page.tsx` (redirect)
- `lib/schedule-service.ts`
- `lib/release-service.ts` (cascade delete include terminal)
- `__tests__/assignment-identity.test.ts`
- `docs/ARS-003-ASSIGNMENT-DOMAIN-CONSISTENCY.md`

## Validation checklist

| Check | Status |
|-------|--------|
| Release uses Assignment Service | ✓ |
| Assignments page uses Assignment Service | ✓ |
| Collaborator Home uses Assignment Service | ✓ |
| Collaborator list uses Assignment Service | ✓ |
| Schedule projects from assignments | ✓ |
| Notification events + immediate process | ✓ |
| Activity assignment + release | ✓ |
| Identity Person → userId | ✓ |
| Legacy contributor path removed from tasks | ✓ |
| TypeScript / unit tests | ✓ (local) |

## Residual risks

1. **Cross-user live updates** still require the collaborator’s client to load after event bus (or badge poll); not multi-user Firestore listeners on all pages.
2. **Person without userId** cannot receive in-app notifications until invitation links Auth.
3. **Workflow section** on Release still lists `tasks` collection separately from Assignments section.

## Acceptance test (manual)

1. Admin opens release → Create Assignment (AW-001, locked release).
2. Without full page reload: assignment on Release list, Assignments page, Schedule (manager).
3. As collaborator (linked Person.userId): Home + Assignments + Schedule + notification.
4. Release Activity shows `assignment.created`.
5. No direct Firestore assignment queries in those pages.
