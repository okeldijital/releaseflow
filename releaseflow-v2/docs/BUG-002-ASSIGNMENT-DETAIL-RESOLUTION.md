# BUG-002 — Assignment Detail Resolution

**Status:** Fixed  
**Priority:** P0  
**Depends on:** ARS-003, ARS-004  

## Root cause

Assignments appeared in list/home/schedule because those paths load from **query/subscription** APIs.

The detail page used:

```ts
if (!assignmentId || !activeOrgId) { setLoading(false); return; }

const [a, acts, links] = await Promise.all([
  fetchAssignment(assignmentId),
  getActivityByEntity(...),   // can throw (index / permission)
  fetchDeliverableLinks(...), // can throw
]);
// catch { setAssignment(null) }  → "Assignment not found"
```

Two failures:

1. **Coupled Promise.all** — any side-channel failure (activity feed, deliverable links) cleared a successful document load and surfaced **Assignment not found**.
2. **Early exit when `activeOrgId` missing** — finished loading with `assignment === null` before org hydration completed, same not-found UI.
3. **Generic catch → null** — all errors looked identical to a missing document.

Navigation and document IDs were correct (`/assignments/${assignment.id}`).

## Navigation flow (verified)

```
AssignmentCard / AssignmentsSection / Schedule card
  → href `/assignments/${assignment.id}`   // Firestore document id
  → Route app/(app)/assignments/[id]
  → useParams().id
  → useAssignment(id)
  → loadAssignmentDetail(id)  // Assignment Service
  → getAssignment(id)         // Repository getDoc(assignments, id)
  → UI
```

Never uses releaseId, taskId, workflowId, or entityId as the route key.

## Final architecture

```
Card / Notification / Schedule
        │  assignment.id
        ▼
Assignment Service.loadAssignmentDetail(id, { organizationId })
        │
        ├─ ok → AssignmentRecord
        ├─ not_found
        ├─ org_mismatch
        ├─ permission_denied
        ├─ network / unavailable
        └─ invalid_id
        ▼
useAssignment — enrich names + best-effort activity/links/context
        ▼
Assignment Detail Workspace
```

## Repository

`getAssignment(id)`:

- Trims id; throws `INVALID_ASSIGNMENT_ID` if empty
- Throws `FIRESTORE_UNAVAILABLE` if `getDb()` is null
- `getDoc(doc(assignments, id))`
- Returns `null` **only** when `exists() === false`

## Error handling (UI)

| Code | Title |
|------|--------|
| not_found | Assignment not found |
| org_mismatch | Wrong organization |
| permission_denied | Permission denied |
| network / unavailable | Unable to load assignment (+ Retry) |
| invalid_id | Invalid assignment |

## Authorization

Managers open any assignment in the **active organization** (`org_mismatch` if wrong org).  
Collaborator action gates still use `assignment-identity.ts` for assignee-only actions.

## Files

- `lib/assignment-repository.ts` — strict getAssignment
- `lib/assignment-service.ts` — `loadAssignmentDetail`
- `hooks/useAssignment.ts` — isolated primary load
- `app/(app)/assignments/[id]/page.tsx` — error states
- `__tests__/bug-002-assignment-detail.test.ts`
- `docs/BUG-002-ASSIGNMENT-DETAIL-RESOLUTION.md`

## Acceptance

Valid list rows open the same document via service/repository lookup. Side-channel failures no longer produce false “not found.”
