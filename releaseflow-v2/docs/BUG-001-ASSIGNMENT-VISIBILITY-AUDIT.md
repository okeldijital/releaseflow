# BUG-001 — Assignment Visibility & Delivery Pipeline Audit

**Status:** Audit complete (investigation only — no remediation shipped)  
**Type:** Domain consistency / data propagation  
**Date:** 2026-07-17  

This document traces one Assignment from **Create Assignment** through every consumer. Findings are grounded in repository code paths. No production document was opened in this environment; the field inventory is the **authoritative write shape** from `assignment-repository.createAssignment`.

---

## 1. Assignment propagation diagram

```
Manager (signed-in Firebase uid)
  │
  ▼
Assignment Workspace  /assignments/new  (or AssignmentDialog)
  │  assigneeId  ← Person.id  (ContributorSelector)
  │  assignerId  ← Firebase Auth uid
  │  entityType  ← 'release'
  │  entityId    ← Release.id
  │  organizationId ← org-store activeOrgId
  ▼
createNewAssignment()                 lib/assignment-service.ts
  │  AuthorizationService.requireManageAssignments
  │  findDuplicateAssignment
  ▼
createAssignment()                    lib/assignment-repository.ts
  │  addDoc(collection('assignments'), { ... })
  ▼
Firestore  collection: assignments    ✓ PERSISTED (observed on Release page)
  │
  ├─► recordActivity({
  │      entityType: 'task',          ⚠ NOT 'release' / NOT 'assignment'
  │      entityId: assignment.id,     ⚠ assignment id, not release id
  │      action: 'assigned',
  │      actorId: assignerId (uid)
  │   })
  │      → activity_events            ✓ written (wrong entity for Release feed)
  │
  ├─► generateNotificationEvent({
  │      type: 'assignment.assigned',
  │      recipientId: assigneeId,     ⚠ Person.id (not always Auth uid)
  │      entityType: 'assignment',
  │      entityId: assignment.id,
  │      deliveredAt: null
  │   })
  │      → notification_events        ✓ written
  │      ✗ processPendingEvents NOT called in create path
  │
  └─► autoWatchDefaults(assigneeId, assignerId)
         → assignment_watchers        ✓ best-effort

Later (optional, not on create):
  useNotificationBadge / Notifications page
    → refreshNotificationPipeline(orgId, uid)
      → processPendingEvents(orgId)
        → user_notifications for resolved Auth uids only

Consumers:
  Release Workspace     fetchAssignmentsByEntity(entityType, entityId)     ✓
  Assignments page      fetchAssignments(orgId) + client filters           ✗ empty (see root cause)
  Home (collaborator)   useAssignments → filter identityIds ∩ assigneeId   ✗ empty
  Schedule              loadScheduleAssignments → list / by assignee       ✗ empty if same failures
  Activity (release)    getActivityByEntity(org, 'release', releaseId)     ✗ never linked
  Notifications inbox   fetchInbox(user.uid) after processor               ✗ delayed / missed
  Contributor legacy    /contributor page queries **tasks** collection     ✗ wrong domain
```

### Where propagation stops (by surface)

| Stage | Status | Evidence |
|-------|--------|----------|
| Create UI → Service → Repository → Firestore `assignments` | **Works** | Release list shows doc via entity query |
| Activity on **Release** feed | **Stops** | Activity written as `entityType: 'task'`, `entityId: assignment.id` — Release page queries `entityType: 'release'`, `entityId: releaseId` |
| Notification **event** | **Works (write)** | `generateNotificationEvent` always `addDoc`s |
| Notification **processor → user_notifications** | **Stops / deferred** | Processor **not** invoked in `createNewAssignment`; only via `refreshNotificationPipeline` (badge poll / notifications page) |
| Notification delivery to assignee | **Stops if Person.userId missing** | `resolveUserId(personId)` returns `null` when Person has no linked Auth uid |
| Assignments Workspace list | **Stops or emptied** | `useAssignments` uses **different query** + **swallows all errors** into `[]` |
| Home / Schedule (mine) | **Stops** if list empty or person resolution fails | Depends on same org list / assigneeId = Person.id |

---

## 2. Firestore document audit (write shape)

Source of truth for fields written at create:

`apps/web/src/lib/assignment-repository.ts` → `createAssignment`

| Spec field (audit) | Actual field | Written? | Typical value | Consumers |
|--------------------|--------------|----------|---------------|-----------|
| id | doc id | ✓ (auto) | Firestore id | All |
| organizationId | organizationId | ✓ | activeOrgId | listAssignments, schedule, notifications |
| releaseId | — | **✗ missing** | n/a | Release derived as `entityType==='release' ? entityId : null` |
| — | entityType | ✓ | `'release'` | getAssignmentsByEntity, context |
| — | entityId | ✓ | Release.id | getAssignmentsByEntity |
| assigneePersonId | — | **✗** | n/a | — |
| assigneeUserId | — | **✗** | n/a | — |
| — | assigneeId | ✓ | **Person.id** (AW-001) | Queries by assignee, collab filters, notifications recipient |
| membershipId | — | **✗** | n/a | — |
| contributionRole | — | **✗ name** | n/a | — |
| — | role | ✓ | contribution role string | UI, schedule role filter |
| status | status | ✓ | default `'assigned'` | Filters |
| priority | priority | ✓ | `'medium'` default | Filters |
| dueDate | dueDate | ✓ | Date / Timestamp | Schedule projection |
| createdBy | — | **✗** | n/a | — |
| — | assignerId | ✓ | **Firebase Auth uid** (not Person.id) | Activity actor, accept/review paths |
| createdAt | createdAt | ✓ | Timestamp | orderBy |
| updatedAt | updatedAt | ✓ | Timestamp | Home “continue” sort |
| archived | — | **✗** | uses status `'archived'` | list filter |
| deleted | — | **✗** | hard `deleteDoc` only | — |
| — | description | ✓ | optional | Detail |
| — | workflowId, stageId | ✓ null | unused by most UI | — |
| — | estimatedHours, actualHours | ✓ | optional | Stats |
| — | review* fields | ✓ null | CE-005 review | Detail |

### Missing / incorrect / legacy / duplicate

| Category | Finding |
|----------|---------|
| **Missing** | `releaseId`, `assigneePersonId`, `assigneeUserId`, `membershipId`, `contributionRole`, `createdBy`, soft-delete flags |
| **Incorrect dual identity** | `assigneeId` = **Person.id**; `assignerId` = **Auth uid**. Same field name family, different ID spaces |
| **Legacy parallel models** | Collection `tasks` (task-service, `/contributor` page); collection `resource_assignments` (resource-service) |
| **Duplicated concepts** | “Assignment” vs “Task” vs “ResourceAssignment” — three storage models for work |

---

## 3. Repository inventory

| Module | Collection | Role |
|--------|------------|------|
| **`lib/assignment-repository.ts`** | `assignments` | **Authoritative** CRUD + queries |
| **`lib/assignment-service.ts`** | (via repo) | Auth, activity, notifications, transitions |
| **`lib/task-service.ts` / tasks repo** | `tasks` | Legacy operational tasks (Release “Workflow” section still loads tasks) |
| **`lib/resource-service.ts`** | `resource_assignments` | Separate resource planning model |
| **`lib/schedule-service.ts`** | reads `assignments` only | Projection only (no own store) |
| **`lib/due-reminder-engine.ts`** | listAssignments | Emits due events |
| **`lib/release-readiness-service.ts`** | getAssignmentsByEntity | Readiness inputs |
| **`lib/release-service.ts`** | getAssignmentsByEntity | Cascade delete |
| **`lib/artist-repository.ts`** | raw `assignments` query | Artist merge/cleanup |
| **`lib/assignment-watchers-repository.ts`** | `assignment_watchers` | Side collection |
| **`lib/assignment-comments-repository.ts`** | `assignment_comments` | Side collection |

### Pages → repository path

| Page / surface | Service entry | Repository query |
|----------------|---------------|------------------|
| Release Workspace Assignments | `fetchAssignmentsByEntity` | `where entityType + entityId` |
| Assignments list | `useAssignments` → `fetchAssignments` | `where organizationId + orderBy createdAt desc` |
| Assignment detail | `fetchAssignment` | `getDoc assignments/{id}` |
| Home | `useAssignments` → same as list | then client filter by assignee |
| Schedule | `loadScheduleAssignments` | `listAssignments` and/or `getAssignmentsByAssignee` |
| People detail | `fetchAssignmentsByAssignee` | `where assigneeId + orderBy createdAt` |
| Contributor `/contributor` | **task-service** | `tasks` where assigneeId == **uid** |
| Notifications | `notification_events` → processor → `user_notifications` | not assignment query |

**Authoritative assignment store:** `assignments` via `assignment-repository.ts`.  
**Not acceptable long-term:** `tasks` and `resource_assignments` as alternate “assignment” UIs.

---

## 4. Consumer audit

### Release Workspace

| Item | Value |
|------|--------|
| Repository | `assignment-repository.getAssignmentsByEntity` |
| Service | `assignment-service.fetchAssignmentsByEntity` |
| UI | `AssignmentsSection` |
| Firestore query | `collection('assignments')` `where('entityType','==',type)` `where('entityId','==',id)` |
| Filters | Client: exclude `archived`, `cancelled`, `declined` |
| Ordering | **None** (document order) |
| Org filter | **None** |
| Auth on read | Firestore: any authenticated user may list |

### Assignments Workspace (`/assignments`)

| Item | Value |
|------|--------|
| Repository | `listAssignments` |
| Service | `fetchAssignments` via `useAssignments` |
| Firestore query | `where('organizationId','==',orgId)` `orderBy('createdAt','desc')` |
| Index | Present in `firestore.indexes.json` (orgId + createdAt) |
| Filters | Client: drop archived/cancelled/declined; **if collaborator** keep only `identityIds.has(assigneeId)` |
| Ordering | createdAt desc |
| Failure mode | `useAssignments` **catch → setAssignments([])** — no error UI |

### Contributor Home (`/home`)

| Item | Value |
|------|--------|
| Repository / service | Same `useAssignments` → `listAssignments` |
| Filters | `identityIds.has(assigneeId)` AND open statuses |
| identityIds | `resolveMyPersonIds(org, uid)` (= Person.id where Person.userId === uid) ∪ `{uid}` |
| Ordering | client sorts by updatedAt / dueDate |

### Schedule

| Item | Value |
|------|--------|
| Repository | `listAssignments` / `getAssignmentsByAssignee` |
| Service | `schedule-service.loadScheduleAssignments` then `enrichAssignments` |
| Source of truth | **Assignments collection only** (projection, not separate store) |
| Scope mine | By each `myPersonIds` + scan org list for uid match |
| Scope team | Full org list (managers) |
| Agenda/Week/Month | Client bucketing of same `ScheduleAssignmentItem[]` |

### Notifications

| Item | Value |
|------|--------|
| Event write | `generateNotificationEvent` → `notification_events` |
| Processor | `processPendingEvents` → `processNotificationEvent` → `user_notifications` |
| Trigger | **Not on create**; `refreshNotificationPipeline` from badge (60s) / notifications page |
| Recipient resolution | `resolveUserId(recipientId)` Person → userId, else treat as uid |
| Inbox query | `user_notifications` by **Auth uid** |

### Activity

| Item | Value |
|------|--------|
| Write on create | `entityType: 'task'`, `entityId: assignment.id`, `action: 'assigned'` |
| Release page read | `getActivityByEntity(org, 'release', releaseId)` |
| Home read | `getActivityByUser(uid)` (actor-based) |
| Assignment detail | `getActivityByEntity(org, 'task', assignmentId)` |

---

## 5. Query comparison (Release vs Assignments vs Home vs Schedule)

| Dimension | Release Workspace | Assignments / Home (load) | Schedule (manager) | Schedule (mine) |
|-----------|-------------------|---------------------------|--------------------|-----------------|
| Collection | `assignments` | `assignments` | `assignments` | `assignments` |
| where | entityType + entityId | **organizationId** | organizationId | assigneeId ∈ personIds |
| orderBy | none | **createdAt desc** | createdAt desc (list) | createdAt desc (by assignee) |
| Tenant | not filtered | **required** | required | optional client org filter |
| Status | client exclude terminal | client exclude terminal | exclude archived | exclude archived |
| Assignee | any | collab: person/uid set | team: all | person/uid match |
| Silent fail | catch → [] | **catch → []** | toast / cache | toast / cache |

### Why Release ✓ and Assignments ✗ can diverge

Code-backed explanations (any one is sufficient):

1. **Different query predicates**  
   Release does **not** require `organizationId`.  
   Assignments list **requires** `organizationId == activeOrgId`.  
   If the written `organizationId` is empty, wrong, or a different tenant than the viewer’s `activeOrgId`, entity query still returns the row; org list does not.

2. **`useAssignments` obliterates results on any error after fetch**  
   ```ts
   // hooks/useAssignment.ts
   try {
     data = await fetchAssignments(activeOrgId);
     // resolvePersonNames, fetchReleasesByOrg enrichment...
     setAssignments(...);
   } catch {
     setAssignments([]);  // masks index errors, permission errors, enrichment failures
   }
   ```
   Release `AssignmentsSection` only calls `fetchAssignmentsByEntity` — fewer failure points.

3. **Collaborator client filter** (Home + Assignments when `isCollaboratorWorkspace`)  
   Requires `assigneeId ∈ personIds(user) ∪ {uid}`.  
   Create stores **Person.id**. If `resolveMyPersonIds` returns `[]` (Person.userId not linked), filter drops every assignment.

4. **Composite index**  
   Org list needs `organizationId + createdAt`. Index is declared in repo; if **not deployed** in the live Firebase project, list query fails → silent `[]`. Entity query needs a different composite (entityType + entityId); if that works in prod, Firebase likely auto-created it.

---

## 6. Contributor assignment resolution

```
Auth.uid
  → resolveMyPersonIds(orgId, uid)
      → people where person.userId === uid → Person.id[]
  → identityIds = Person.ids ∪ {uid}
  → assignment.assigneeId must equal Person.id (canonical AW-001)
```

| Linkage | Create path | Consumer expectation |
|---------|-------------|----------------------|
| Person | `assigneeId = person.id` | Yes (canonical) |
| User | not stored on assignment | Resolved via Person.userId for notifications |
| Membership | not stored | Platform role via membership elsewhere |
| Assigner | `assignerId = Auth.uid` | Accept/review sometimes compare assignee to **uid** |

**acceptUserAssignment** requires `existing.assigneeId !== actorId` with actor = uid:

```ts
if (existing.assigneeId !== actorId) throw new Error('Only the assignee can accept');
```

If `assigneeId` is Person.id and `actorId` is Auth.uid, **assignee can never accept** unless they are the same string (they are not). This is a hard identity bug for lifecycle, even when list visibility is fixed.

---

## 7. Notification pipeline audit

```
Assignment Created
  → generateNotificationEvent          INVOKED ✓
  → notification_events doc            WRITTEN ✓  (deliveredAt: null)
  → processPendingEvents               NOT INVOKED on create ✗
  → (later) badge/notifications page   INVOKED best-effort
  → resolveUserId(Person.id)           FAILS if Person.userId unset ✗
  → user_notifications                 SKIPPED if no uid
  → Unread badge / Notification Centre DEPENDS on above
  → Email queue                        Only if prefs + processor ran
```

| Stage | State |
|-------|--------|
| Event generation | **Invoked** |
| Immediate process | **Not implemented** on create path |
| Processor when UI polls | **Invoked** (best-effort, errors swallowed) |
| Person without Auth link | **Failed** delivery (null uid) |
| Email | Only after successful user_notification path + prefs |

---

## 8. Schedule audit

```
Assignment (Firestore)
  → loadScheduleAssignments (read assignments)
  → enrichAssignments (names + release context)
  → Agenda / Week / Month (client buckets)
```

- Schedule **does not** maintain a separate projection collection.
- If `listAssignments` / `getAssignmentsByAssignee` returns empty (same causes as §5), **all views are empty**.
- Due date required for calendar placement; create form requires dueDate — OK when list works.

---

## 9. Authorization audit

| Action | Gate |
|--------|------|
| Create | `AuthorizationService.requireManageAssignments` in service ✓ |
| Reads (client) | **No** AuthorizationService filter in repository; Firestore allows any auth user to list `assignments` |
| Collaborator UI filter | Client-side only (`isCollaboratorWorkspace` + identityIds) |
| Schedule team scope | Role check in `loadScheduleAssignments` (`canViewTeamSchedule`) |

RBAC is **unlikely** to hide a row from managers if the org list query succeeds. Collaborator filtering **can** hide rows when person linkage is wrong. Rules are not role-scoped.

---

## 10. Firestore rules audit

```
match /assignments/{id} {
  allow read, list: if isAuth();
  allow create: if isAuth() && request.resource.data.entityId != null;
  allow update, delete: if isAuth();
}
```

| Actor | Expected | Actual rules |
|-------|----------|--------------|
| Manager create | allow | allow if entityId set |
| Contributor read own | allow own | **allow all authenticated** (broader) |
| Manager read org | allow org | **allow all authenticated** |

Rules do **not** silently filter by assignee or org. They are not the cause of “missing” rows (over-permissive, not under).

---

## 11. Single source of truth audit

| Model | Collection | Still used by |
|-------|------------|---------------|
| **Assignment** | `assignments` | AW-001, Release Assignments, Schedule, Home (via useAssignments) |
| **Task** | `tasks` | Release “Workflow” section, `/contributor` dashboard |
| **ResourceAssignment** | `resource_assignments` | resource-service |

**Not acceptable** (current state):

- Release Workflow shows **tasks**, Assignments section shows **assignments** — two domains on one page.
- `/contributor` never reads `assignments`.
- No denormalized `ReleaseAssignment` / `ScheduleAssignment` types — good — but dual Task model breaks SoT.

Ideal:

```
Assignment (single document)
  → assignment-repository (only)
  → schedule-service (projection)
  → notification-processor (side effect)
  → activity (linked to release + assignment)
```

---

## Root cause (exact divergences)

Do not treat these as speculation — each is a concrete code path:

### RC-1 — Primary list path diverges from entity path (Assignments / Home empty for managers)

- **Release:** `getAssignmentsByEntity(entityType, entityId)` — no org predicate, no orderBy.  
- **Assignments/Home:** `listAssignments(organizationId)` + `orderBy('createdAt')` inside `useAssignments`, with **total error swallow → []**.  

Any of: missing/undeployed composite index, `organizationId` mismatch on the document, or enrichment throw after a successful fetch → **empty Assignments UI while Release still shows the doc**.

### RC-2 — Identity model split (Person vs Auth uid)

- Create: `assigneeId = Person.id`, `assignerId = Auth.uid`.  
- Collaborator filters and schedule “mine” depend on `resolveMyPersonIds` (Person.userId linkage).  
- Accept/decline compare assignee to **Auth.uid** → **broken for Person-id assignees**.  
- Notifications: recipient is Person.id; delivery needs Person.userId.

### RC-3 — Notification processor not on create path

- Event is written; **user_notifications are not created in `createNewAssignment`**.  
- Processing is opportunistic (badge / notifications page). Collaborator who never triggers pipeline (or has no userId on Person) sees **no notification**.

### RC-4 — Activity not attached to Release

- Create records `entityType: 'task'`, `entityId: assignment.id`.  
- Release Activity queries `entityType: 'release'`, `entityId: releaseId`.  
- **No assignment activity appears on the Release feed by design of this mismatch.**

### RC-5 — Parallel Task domain

- Workflow / contributor surfaces still use **`tasks`**, not **`assignments`**.  
- Even a healthy Assignment document will never appear on those surfaces until they read the assignment repository.

---

## Remediation plan (minimum architecture)

Avoid new parallel services/models. Sequence:

### P0 — Make the same document visible everywhere (read path)

1. **Stop swallowing list errors** in `useAssignments` — surface error; log Firestore code (especially `failed-precondition` missing index).  
2. **Normalize list query** to the same repository helpers; verify production index `assignments: organizationId ASC, createdAt DESC` is deployed.  
3. **Assert on create** that `organizationId` is non-empty and equals the release’s `organizationId` (fetch release if needed).  
4. **Collaborator identity:** always resolve Person ids for the signed-in user; never filter solely on uid for AW-001 data. Optionally dual-match `assigneeId === personId || assigneeId === uid` until data backfill.

### P0 — Notifications

5. Call `processPendingEvents(organizationId)` (or a dedicated `processEvent(id)`) **immediately after** `generateNotificationEvent` in `createNewAssignment` (and other lifecycle events).  
6. When creating, resolve `assigneeUserId` from Person; store both `assigneeId` (person) and `assigneeUserId` (auth) for delivery without guesswork.  
7. If Person has no `userId`, still create in-app placeholder or mark event undeliverable with explicit metadata (do not silent-skip without audit log).

### P1 — Identity & lifecycle

8. Standardize document contract:

```
assigneeId        // Person.id (canonical)
assigneeUserId    // Auth uid | null
assignerId        // Person.id preferred; migrate from uid
assignerUserId    // Auth uid
entityType / entityId
releaseId         // denormalized when entity is release/track
role              // contribution role
organizationId
```

9. Fix accept/decline/start checks to compare actor against **person ids + uid**, same helper as schedule.

### P1 — Activity

10. On create, write **two** activity links (or one with dual metadata):  
    - `entityType: 'assignment' | 'task'`, `entityId: assignment.id`  
    - `entityType: 'release'`, `entityId: releaseId` with action `assignment.created`  
    so Release Activity and Assignment detail both see it.

### P2 — Single domain

11. Migrate Release Workflow section and `/contributor` off **`tasks`** onto **`assignments`** (or explicitly deprecate tasks).  
12. Leave `resource_assignments` out of contributor UX or fold later — do not feed Schedule from it.  
13. Keep **one** repository: `assignment-repository.ts`; schedule/home/notifications only project.

### Explicitly do not

- Create `ReleaseAssignmentService` / `DashboardAssignmentRepository`.  
- Duplicate write paths for “list view copies”.  
- Fix only UI empty states without fixing query + identity + processor.

---

## Acceptance criteria mapping

| Criterion | Current | After remediation |
|-----------|---------|-------------------|
| Release Workspace | ✓ | ✓ |
| Assignments Workspace | ✗ | ✓ same query contract + org id |
| Contributor Home | ✗ | ✓ person resolution + list |
| Contributor Assignments | ✗ | ✓ same |
| Schedule Agenda/Week/Month | ✗ | ✓ same reads |
| Activity feed (release) | ✗ | ✓ dual entity activity |
| Notification Centre | ✗ | ✓ process on create + userId |
| Email pipeline | ✗ | ✓ after processor |
| Single repository/model | Partial | ✓ assignments only for work UX |

---

## Verification checklist (for the next engineer with Firebase access)

1. Open one assignment that appears on Release.  
2. Copy document JSON from Firestore console → fill the field table with real values.  
3. Confirm `organizationId` equals active org in the Assignments page session.  
4. Run list query in console: `organizationId == X orderBy createdAt`.  
5. Check `notification_events` for that assignment id; check `deliveredAt` / processing docs.  
6. Check Person doc for assignee: is `userId` set?  
7. Reproduce Accept as collaborator — expect failure under RC-2 until fixed.

---

## File reference index

| Path | Relevance |
|------|-----------|
| `lib/assignment-repository.ts` | Write shape + queries |
| `lib/assignment-service.ts` | createNewAssignment, activity, events |
| `hooks/useAssignment.ts` | Assignments/Home load + silent catch |
| `components/assignments-section.tsx` | Release consumer |
| `app/(app)/assignments/page.tsx` | Collab filter |
| `app/(app)/home/page.tsx` | Home filter |
| `lib/schedule-service.ts` | Schedule load + resolveMyPersonIds |
| `lib/notification-event-service.ts` | Event write |
| `lib/notification-processor.ts` | Delivery |
| `lib/notification-engine-service.ts` | refreshNotificationPipeline |
| `lib/activity-service.ts` | Activity write/read |
| `firestore.rules` | assignments open to isAuth |
| `firestore.indexes.json` | orgId+createdAt, assigneeId+createdAt |

---

*End of BUG-001 audit. No production code was changed for this investigation.*
