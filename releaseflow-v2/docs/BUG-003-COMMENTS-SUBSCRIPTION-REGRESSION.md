# BUG-003 — Mobile Comments Subscription Regression

**Status:** Fixed  
**Priority:** P0  
**Depends on:** MUX-002, UX-001  

## Observed behaviour

Comment / conversation appears briefly, then the list becomes empty within a fraction of a second.

## Root cause

### Assignment detail comments panel

1. User posts → optimistic row inserted → **visible**.
2. Live `subscribeAssignmentComments` used a **different** query shape than the stable list path (`orderBy createdAt asc` vs list’s `desc`).
3. On snapshot **error** (or empty **cache** snapshot before server data), the handler called `onData([])` / `setComments([])`.
4. That **replaced** optimistic/local state with an empty list → conversation “disappeared”.

Firestore empty **fromCache** snapshots before the server responds produce the same flash: populated (optimistic) → empty (cache) → (sometimes) server data.

### Comments workspace inbox

Secondary issues:

- `.catch(() => setThreads([]))` wiped a successful first paint if a remount/retry failed.
- Per-assignment failures inside `Promise.all` could fail the whole inbox.
- Access filter uses assignment visibility (correct); hardened so partial failures do not empty the list.

## Fix

| Layer | Change |
|-------|--------|
| `subscribeAssignmentComments` | Same query as `getAssignmentComments` (`assignmentId` + `createdAt desc`, reverse client-side) |
| Snapshot handler | Ignore empty **fromCache** snapshots until a server snapshot arrives |
| Error path | One-shot fallback; **never** emit `[]` on fallback failure |
| Panel | Merge snapshot with optimistic `pendingRef`; never clear on load error |
| Inbox | Wait for `orgsLoaded`; keep previous threads on error; isolate per-assignment errors |

## Access rule (unchanged, clarified)

If you can access the assignment, you can access its comments.

- Collaborator: `assignmentMatchesIdentity` (Person.id / assigneeUserId / auth uid)
- Manager: all org assignments
- **Not** `comment.authorId === currentUser`

## Architecture

```
Comment Form
  → assignment-comments-service (write)
  → assignment_comments
  → subscribeAssignmentComments (same collection + index as list)
  → merge optimistic + server
  → Comment list
```

## Acceptance

- Conversation remains visible after open and after post  
- No flicker populated → empty  
- New comments stay visible and appear for other clients via snapshot  
- Manager and collaborator see shared discussion when both can access the assignment  

## Files

- `lib/assignment-comments-repository.ts`
- `components/assignments/assignment-comments-panel.tsx`
- `lib/assignment-comments-inbox.ts`
- `app/(app)/comments/page.tsx`
- `docs/BUG-003-COMMENTS-SUBSCRIPTION-REGRESSION.md`
