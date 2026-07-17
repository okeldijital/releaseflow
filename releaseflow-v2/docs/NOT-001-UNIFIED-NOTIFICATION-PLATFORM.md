# NOT-001 — Unified Notification Platform

**Status:** Implemented (in-app + queues); FCM/email workers pending server deploy  
**Priority:** P0  
**Depends on:** ARS-004, UX-001, MUX-002, CE-006  

---

## Objective

Deliver every significant operational event to the right users through:

| Channel | Status |
|---------|--------|
| **In-app Notification Center (Inbox)** | Live — `/notifications` |
| **Mobile push (FCM)** | Queue + subscriptions; worker TBD |
| **Email** | Queue for *important* types; worker TBD |

The Notification Center is the user’s **operational inbox** — not chat, not a second comments UI.

---

## Separation of concerns

| Concept | Role |
|---------|------|
| **Event** | Something happened (immutable `notification_events`) |
| **Activity** | Historical audit trail on an entity |
| **Comment** | Discussion attached to an assignment |
| **Notification** | Delivery mechanism: attention required |

Pages and components **never** author notifications. They perform domain actions; services emit events.

```
Business Event
      │
      ▼  generateNotificationEvent()
notification_events   (immutable)
      │
      ▼  processNotificationEvent() / processPendingEvents()
Notification Processor (idempotent)
      │
      ├────────► user_notifications     → In-app Inbox + badge
      ├────────► push_queue             → FCM worker
      └────────► email_queue            → Email worker
```

---

## Event matrix (recipients)

Actor is **always excluded**.

### Assignment lifecycle

| Event | Type key | Recipients | Email | Push |
|-------|----------|------------|-------|------|
| Created / assigned | `assignment.assigned` | Assignee | ✓ | ✓ |
| Accepted | `assignment.accepted` | Assigner, watchers | ✗ | ✓ |
| Started | `assignment.started` | Assigner, watchers | ✗ | ✓ |
| Completed | `assignment.completed` | Assigner, watchers | ✓ | ✓ |
| Reassigned | `assignment.reassigned` | Old assignee, new assignee, assigner | ✓ | ✓ |
| Archived | `assignment.archived` | Watchers | ✗ | ✗ |
| Rescheduled | `assignment.rescheduled` | Assignee, watchers | ✗ | ✓ |

### Comments

| Event | Type key | Recipients | Email | Push |
|-------|----------|------------|-------|------|
| Comment added | `comment.created` | Assignee, assigner, watchers | Optional (off by default importance) | ✓ |
| Reply | `comment.reply` | Same | Optional | ✓ |
| Mention | `comment.mentioned` | Explicit mentioned user only | ✓ | ✓ |

Author never notified of their own comment.

### Review

| Event | Type key | Recipients |
|-------|----------|------------|
| Requested | `review.requested` | Assigner, watchers |
| Approved | `review.approved` | Assignee, watchers |
| Rejected | `review.rejected` | Assignee, watchers |
| Changes requested | `review.changes_requested` | Assignee, watchers |

### Schedule

| Event | Type key | Recipients |
|-------|----------|------------|
| Due soon / today / tomorrow | `assignment.due_*` | Assignee |
| Overdue | `assignment.overdue` | Assignee (email important) |

### Release (registry ready; emit from release flows)

| Event | Type key |
|-------|----------|
| Created | `release.created` |
| Date changed | `release.date_changed` |
| Approved | `release.approved` |
| Published | `release.published` |
| Delayed | `release.delayed` |
| Readiness / blockers | `release.ready`, `release.not_ready`, … |

Release fan-out uses `entity_followers` + explicit metadata `followerIds`.

---

## Delivery matrix

| Channel | When | Mechanism |
|---------|------|-----------|
| In-app | Preference `inApp` + type enabled | `user_notifications` |
| Email | Type `emailImportant` + user email on | `email_queue` (`pending`) |
| Push | Type `pushEligible` + user push on | `push_queue` (`pending`) + `push_subscriptions` |

### Payload (user_notifications)

```
id, organizationId, userId (recipient), eventId, type,
title, message, entityType, entityId, assignmentId, releaseId,
actorId, actorName, isRead, readAt, createdAt,
deliveryStatus, channels { inApp, emailQueued, pushQueued }
```

---

## Notification lifecycle

1. Domain service mutates assignment / comment / release.  
2. Service calls `generateNotificationEvent({ type, organizationId, actorId, … })`.  
3. Service (or badge pipeline) calls `processPendingEvents(orgId)`.  
4. Processor skips if `notification_processing/{eventId}` exists (**idempotent**).  
5. Resolve recipients from **registry matrix** (not page logic).  
6. Exclude actor.  
7. For each recipient: check prefs → create inbox row → enqueue email/push.  
8. Mark event processed.  
9. Live badge (`subscribeUnreadCount`) updates; Inbox lists Today / Yesterday / Earlier.

### Retry strategy

- Safe to re-run `processPendingEvents` — processed events skip.  
- Per-user create deduped by `(userId, eventId)`.  
- Queue failures do not roll back inbox row.  
- Worker retries: leave status `pending` / `failed` with backoff (server worker TBD).  
- **Never** re-send push/email for the same `notificationId` without worker-side dedupe key.

---

## FCM architecture

```
push_subscriptions  (endpoint / keys / platform per device)
        ▲
        │ register (client PWA / native)
        │
Browser / App
        │
push_queue (pending jobs: title, body, deepLink, userId)
        │
        ▼  Admin SDK / Cloud Function
      FCM
        │
        ▼
  Device → tap → deepLink (e.g. /assignments/{id}?tab=comments)
```

Client **never** sends FCM. It only registers subscriptions and enqueues jobs.

---

## Email architecture

```
email_queue (pending)
  notificationId, recipient, subject, template, payload, deepLink
        │
        ▼  Worker (Resend / SES / existing email provider)
      Send template
        │
        ▼ status: sent | failed
```

Only **important** types enqueue by default (assignment created/reassigned/completed, overdue, review, release published, mentions). Status chatter stays in-app + optional push.

---

## Deep-link specification

| Context | Path |
|---------|------|
| Assignment | `/assignments/{id}` |
| Comment / mention | `/assignments/{id}?tab=comments` |
| Review request / reject / changes | `/assignments/{id}?tab=review` |
| Release | `/releases/{id}` |
| Track | `/tracks/{id}` |
| Person | `/people/{id}` |

Implemented in `notification-type-registry` + `notificationHref()`.

---

## Notification Center (Inbox)

- Route: `/notifications`  
- Grouping: **Today / Yesterday / Earlier**  
- Filters: All · Assignments · Releases · Comments · Reviews · Schedule  
- Actions: open (mark read + navigate), mark all read  
- Shell: bell / nav badge via `useNotificationBadge` (live `onSnapshot` + pipeline poll)

Preferences: Profile → channels (in-app / email / push) + per-category toggles.

---

## Preferences

Per user (`notification_preferences/{uid}`):

- Master: `inAppEnabled`, `emailEnabled`, `pushEnabled`  
- Categories: `assignmentAssigned`, `assignmentLifecycle`, `commentReply`, `commentMention`, `reviewRequested`, `reviewOutcome`, `dueReminder`, `overdueReminder`, `releaseUpdates`, invitations  

---

## Files

| Area | Path |
|------|------|
| Type registry + matrix | `lib/notification-type-registry.ts` |
| Event write | `lib/notification-event-service.ts` |
| Processor | `lib/notification-processor.ts` |
| Inbox API | `lib/notification-engine-service.ts` |
| User rows | `lib/user-notifications-repository.ts` |
| Prefs | `lib/notification-preferences-repository.ts` |
| Email queue | `lib/email-queue-repository.ts` |
| Push queue | `lib/push-queue-repository.ts` |
| Push devices | `lib/push-subscriptions-repository.ts` |
| Due engine | `lib/due-reminder-engine.ts` |
| Badge | `hooks/useNotificationBadge.ts` |
| Inbox UI | `app/(app)/notifications/page.tsx` |
| Prefs UI | `components/profile/notification-preferences-panel.tsx` |
| Assignment emits | `lib/assignment-service.ts` |
| Comment emits | `lib/assignment-comments-service.ts` |
| Rules | `firestore.rules` (`push_queue`) |
| Tests | `__tests__/not-001-notification-platform.test.ts` |

---

## Acceptance (automated + UAT)

### Assignment

- [x] Create → event `assignment.assigned` → assignee inbox  
- [x] Accept / start → assigner (+ watchers)  
- [x] Complete → assigner (+ watchers)  
- [x] Reassign → old + new + assigner (metadata)  
- [x] Archive → watchers  

### Comment

- [x] Post → participants notified; author excluded  
- [x] Deep link → `?tab=comments`  

### Center

- [x] Unread badge live update  
- [x] Mark read / mark all  
- [x] Category filters  
- [x] Today / Yesterday / Earlier  

### Push / Email

- [x] Jobs enqueued with prefs  
- [ ] Worker delivery (server milestone)  
- [ ] No duplicate FCM/email for same notificationId (worker must enforce)  

---

## Success criteria

Every meaningful action generates a **business event** that yields notifications on the user’s selected channels. The Notification Center is the single operational inbox; push and email extend it. Notifications stay contextual and actionable — ReleaseFlow does not become a general messaging platform.

---

## Relation to CE-006

NOT-001 **extends** CE-006:

- Precise recipient matrix (not blanket fan-out)  
- Missing lifecycle events wired  
- Categories + Inbox filters  
- `deliveryStatus` + channel flags  
- `push_queue` + email importance policy  
- Live badge subscription  
- Canonical product doc for the unified platform  
