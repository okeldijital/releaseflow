# CE-006 — Notification Engine

**Status:** Implemented  
**Date:** 2026-07-17  
**Prerequisites:** CE-001 … CE-005

---

## Part 1 — Event audit (CE-005)

Immutable collection: `notification_events` via `generateNotificationEvent()`.

| Event type | Source (CE-005/006) |
|---|---|
| `comment.created` | assignment-comments-service |
| `comment.reply` | assignment-comments-service |
| `comment.mentioned` | assignment-comments-service |
| `review.requested` | assignment-service |
| `review.approved` | assignment-service |
| `review.rejected` | assignment-service |
| `review.changes_requested` | assignment-service |
| `watcher.added` | assignment-watchers-service |
| `watcher.removed` | assignment-watchers-service |
| `assignment.assigned` | assignment-service (migrated from direct `createNotification`) |
| `assignment.accepted` | assignment-service |
| `assignment.started` | assignment-service |
| `assignment.due_soon` | due-reminder-engine |
| `assignment.overdue` | due-reminder-engine |
| `invitation.accepted` / `invitation.revoked` | registry ready (emit from invitation flows later) |

**Rule:** Assignment collaboration and assignment lifecycle emit **events only**.  
Legacy `createNotification()` remains for older modules (tasks/triggers) outside CE-006 scope; **assignment-service no longer calls it**.

---

## Architecture Summary

```
Assignment / Collaboration Action
        │
        ▼  generateNotificationEvent()
notification_events  (immutable)
        │
        ▼  processPendingEvents() / processNotificationEvent()
notification_processing  (idempotency: eventId)
        │
        ▼
user_notifications  (per-user, read/unread)
        │
        ├── In-app center (/notifications) + badges
        ├── email_queue (status=pending, not sent)
        └── push_subscriptions (stored, not delivered)
```

### Event processing

1. Load recent `notification_events` for the active org.  
2. Skip if `notification_processing/{eventId}` exists.  
3. Resolve recipients (explicit `recipientId`, assignment watchers, assignee/assigner).  
4. **Exclude actor** (never notify self).  
5. Respect `notification_preferences` (channel + type).  
6. Create `user_notifications` (dedupe by `userId` + `eventId`).  
7. Optionally enqueue `email_queue` jobs.  
8. Mark `notification_processing`.

### Badge calculation

`useNotificationBadge` → `getUnreadUserNotificationCount(userId, orgId)` on a 60s poll, also after pipeline refresh. Wired to AppShell topbar, sidebar, bottom nav.

### Email / Push

- **Email:** jobs only (`pending`). No provider.  
- **Push:** multi-device `push_subscriptions`. No service worker / delivery.

### Due reminders

`runDueReminderEngine` scans assignments and emits `assignment.due_soon` / `assignment.overdue` events with `metadata.reminderKey` for daily dedupe. Processor converts them to user notifications.

---

## Data Model

### `user_notifications`

`id, organizationId, userId, eventId, type, title, message, entityType, entityId, assignmentId, releaseId, actorId, actorName, isRead, readAt, createdAt`

### `notification_processing`

`eventId` (doc id), `processedAt`, `processorVersion`

### `notification_preferences`

`userId` (doc id), `emailEnabled`, `pushEnabled`, `inAppEnabled`, `preferences{…}`, `updatedAt`

### `email_queue`

`notificationId, recipient, subject, template, payload, status, createdAt`  
Status: `pending | processing | sent | failed`

### `push_subscriptions`

`userId, endpoint, keys, platform, createdAt, updatedAt`

### Indexes

See `firestore.indexes.json` — `user_notifications` (userId+createdAt, userId+isRead, userId+eventId), `notification_events` (org+createdAt, org+entityId), `email_queue` (status+createdAt), `push_subscriptions` (userId+endpoint).

---

## File Summary

### New

| File | Purpose |
|---|---|
| `notification-type-registry.ts` | Extensible type registry (no switch UI) |
| `notification-processor.ts` | Event → user notification |
| `notification-processing-repository.ts` | Idempotency ledger |
| `user-notifications-repository.ts` | Inbox persistence |
| `notification-preferences-repository.ts` | User prefs |
| `email-queue-repository.ts` | Email jobs |
| `push-subscriptions-repository.ts` | Device subscriptions |
| `due-reminder-engine.ts` | Due/overdue **events** |
| `notification-engine-service.ts` | UI-facing API |
| `hooks/useNotificationBadge.ts` | Shell badge |
| `components/profile/notification-preferences-panel.tsx` | Settings UI |
| `__tests__/notification-engine.test.ts` | Unit tests |
| `docs/CE-006-NOTIFICATION-ENGINE.md` | This doc |

### Modified

| File | Purpose |
|---|---|
| `notification-event-service.ts` | Expanded types + query helpers |
| `assignment-service.ts` | Events only for assign/accept/start |
| `app/(app)/notifications/page.tsx` | New center (Today/Yesterday/Earlier) |
| `app/(app)/layout.tsx` | Badges + topbar count |
| `app/(app)/profile/page.tsx` | Notification prefs |
| `packages/ui` sidebar/bottom-nav | `NavItem.badge` |
| `firestore.rules` / `firestore.indexes.json` | Security + indexes |

---

## Validation

| Check | Result |
|---|---|
| TypeScript | Pass |
| Lint | Pass (pre-existing warnings only) |
| Tests | **549 passed** (incl. `notification-engine.test.ts`) |
| Production build | Pass |

## Acceptance

- [x] Events consumed by processor  
- [x] User notifications generated  
- [x] Duplicate processing prevented  
- [x] In-app center + deep links  
- [x] Read / mark all read  
- [x] Badges  
- [x] Preferences  
- [x] Email queue / push storage (no delivery)  
- [x] Due reminder events  
- [x] No self-notify  
- [x] Assignment service event-driven  
- [x] All validation gates pass
