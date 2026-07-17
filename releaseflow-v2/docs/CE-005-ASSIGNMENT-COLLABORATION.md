# CE-005 — Assignment Collaboration

**Status:** Implemented  
**Date:** 2026-07-17  
**Scope:** Assignment comments, replies, @mentions, watchers, read tracking, review requests/outcomes, activity integration, notification **event generation** (not delivery).

---

## Part 1 — Activity System Audit

### Existing architecture

```
Assignment (assignments/{id})
        │
        ▼  recordActivity()
activity_events  (entityType: 'task', entityId: assignmentId)
        │
        ▼  getActivityByEntity(orgId, 'task', assignmentId)
useAssignment() → activities[]
        │
        ▼
ActivityTimeline (Assignment workspace → Activity tab)
```

| Piece | Location | Notes |
|---|---|---|
| Activity repository | `apps/web/src/lib/activity-service.ts` | `activity_events` collection; immutable append via `recordActivity` |
| Timeline component | `apps/web/src/components/assignments/activity-timeline.tsx` | Renders action labels + actor names |
| Assignment events | `assignment-service.ts` lifecycle actions (`assigned`, `accepted`, `started`, …) | Pre-CE-005 |
| Identity resolution | `resolve-person-names.ts` + actor map on page | `actorId` → display name |

### Where collaboration events belong

All collaboration actions **extend** `activity_events` with `entityType: 'task'` and `entityId: assignmentId`.  
**Do not** create a parallel timeline store.

New action keys:

| Action | Source |
|---|---|
| `comment.added` / `reply.added` / `comment.edited` / `comment.deleted` / `comment.mentioned` | comments service |
| `review.requested` / `review.approved` / `review.rejected` / `review.changes_requested` | assignment service |
| `watcher.added` / `watcher.removed` | watchers service |

Notification **events** (separate from activity) land in `notification_events` via `generateNotificationEvent` — delivery is out of scope.

---

## Architecture Summary

### Comment architecture

- Collection: `assignment_comments`
- Soft delete only (`isDeleted`, `deletedAt`); UI shows “This comment was deleted.”
- One-level threading: top-level comment + `parentCommentId` replies; reply-to-reply rejected in service
- Pagination: latest 50 (`createdAt desc`), load older via cursor; displayed oldest→newest (newest bottom)
- Permissions (client role from membership, enforced in service):
  - Collaborator: create / reply / edit own / delete own
  - Release Manager / Admin / Owner: also delete any

### Mention architecture

- Suggestions: org people only (`getPeopleByOrg`)
- Picker on `@` with avatar, name, professional role
- **IDs stored in `mentionedUserIds[]`** from explicit selection (person ids) — not text parsing alone
- Render: plain text + URL linkification + mention highlight; no markdown/HTML/images

### Watcher architecture

- Collection: `assignment_watchers` (`assignmentId`, `userId`, `createdAt`)
- Auto-watch on create: assignee + assigner (creator / release manager path)
- Manual Watch / Unwatch on assignment page
- Activity + `watcher.added` / `watcher.removed` notification events

### Event architecture

| Layer | Collection | Purpose |
|---|---|---|
| Work log | `activity_events` | Immutable assignment timeline |
| Future notifications | `notification_events` | Typed events with `deliveredAt: null` |
| Legacy inbox | `notifications` | Existing assignment create inbox only |

Event types generated:  
`comment.created`, `comment.reply`, `comment.mentioned`, `review.requested`, `review.approved`, `review.rejected`, `review.changes_requested`, `watcher.added`, `watcher.removed`.

### Review architecture

```
In Progress → Submit For Review → status: review
                                    │
                    ┌───────────────┼────────────────┐
                    ▼               ▼                ▼
                 Approve     Request Changes      Reject
              (completed)    (in_progress)     (cancelled)
              outcome:approved  changes_requested  rejected
```

Fields on `assignments`: `reviewRequestedBy`, `reviewedBy`, `reviewedAt`, `reviewOutcome`.  
Review panel shown when review is relevant.

---

## Data Model

### `assignment_comments`

| Field | Type |
|---|---|
| id | string |
| assignmentId | string |
| organizationId | string |
| authorId | string (auth uid) |
| authorName | string |
| message | string |
| parentCommentId | string \| null |
| mentionedUserIds | string[] |
| isDeleted | boolean |
| createdAt | Timestamp |
| editedAt | Timestamp \| null |
| deletedAt | Timestamp \| null |

### `assignment_watchers`

| Field | Type |
|---|---|
| assignmentId | string |
| userId | string |
| createdAt | Timestamp |

### `assignment_comment_reads`

| Field | Type |
|---|---|
| assignmentId | string |
| commentId | string |
| userId | string |
| readAt | Timestamp |

### `notification_events`

| Field | Type |
|---|---|
| type | NotificationEventType |
| organizationId | string |
| actorId | string |
| recipientId | string \| null |
| entityId | string |
| entityType | string |
| metadata | object \| null |
| createdAt | Timestamp |
| deliveredAt | null (reserved) |

### Relationships

```
assignments 1──* assignment_comments
assignments 1──* assignment_watchers
assignment_comments 1──* assignment_comment_reads
assignments 1──* activity_events (entityType=task)
assignments 1──* notification_events (entityType=assignment)
```

**Integrity rule:** collaboration parents **only** assignments. No release/track/org/artist/person comments in this model.

### Indexes (see `firestore.indexes.json`)

- `assignment_comments`: assignmentId + createdAt (asc/desc); organizationId + createdAt
- `assignment_watchers`: assignmentId + userId; userId + createdAt
- `assignment_comment_reads`: assignmentId + userId; commentId + userId
- `notification_events`: organizationId + createdAt; recipientId + createdAt; entityId + type + createdAt

---

## File Summary

### New

| File | Purpose |
|---|---|
| `apps/web/src/lib/assignment-comments-repository.ts` | Firestore CRUD + pagination |
| `apps/web/src/lib/assignment-comments-service.ts` | Rules, activity, notification events |
| `apps/web/src/lib/assignment-watchers-repository.ts` | Watcher persistence |
| `apps/web/src/lib/assignment-watchers-service.ts` | Watch/unwatch + activity/events |
| `apps/web/src/lib/assignment-comment-reads-repository.ts` | Read tracking / unread count |
| `apps/web/src/lib/assignment-mentions-service.ts` | Mentions suggestions + render helpers |
| `apps/web/src/lib/notification-event-service.ts` | Event generation only |
| `apps/web/src/components/assignments/assignment-comments-panel.tsx` | Comments tab UI |
| `apps/web/src/components/assignments/mention-picker.tsx` | @ picker |
| `apps/web/src/components/assignments/review-panel.tsx` | Review status panel |
| `apps/web/src/__tests__/assignment-collaboration.test.ts` | CE-005 unit tests |
| `docs/CE-005-ASSIGNMENT-COLLABORATION.md` | This document |

### Modified

| File | Purpose |
|---|---|
| `apps/web/src/lib/assignment-repository.ts` | Review field writes (submit/approve/changes/reject) |
| `apps/web/src/lib/assignment-service.ts` | Auto-watch, review outcomes, notification events |
| `apps/web/src/app/(app)/assignments/[id]/page.tsx` | Wire comments, review, watch, manager actions |
| `apps/web/src/components/assignments/activity-timeline.tsx` | Collaboration action labels |
| `apps/web/src/stores/role-store.ts` | Map `administrator` / `project_manager` |
| `firestore.rules` | New collections |
| `firestore.indexes.json` | Composite indexes |

---

## Acceptance Criteria Checklist

- [x] Assignments support comments
- [x] One-level replies
- [x] @mentions with ID storage
- [x] Comments only on assignments
- [x] Soft delete
- [x] Activity timeline collaboration events
- [x] Review request/outcome events
- [x] Assignment watchers
- [x] Read tracking + “New comments” badge
- [x] Notification events generated, not delivered
- [x] Mobile: large sticky composer, collapsible replies
- [x] Manager vs collaborator permissions
- [x] Validation: TypeScript (`tsc --noEmit`) passes
- [x] Validation: Lint passes (warnings only, pre-existing non-null assertions)
- [x] Validation: Tests pass (538; includes `assignment-collaboration.test.ts`)
- [x] Validation: Production build passes

---

## Out of scope (confirmed)

Push/email delivery, DMs, group chat, file uploads, voice/video, rich markdown, previews.
