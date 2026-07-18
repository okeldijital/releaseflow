# NOT-002 — Email Notification Delivery

**Status:** Implemented  
**Priority:** P1  
**Depends on:** NOT-001, BUG-005  

---

## Objective

Important business events produce:

1. **In-app** `user_notifications` (Inbox — system of record)  
2. **Email** via `email_queue` → Email Worker → Resend  

UI and domain services **never** call Resend for notification mail.

---

## Architecture

```
Business Event
      │
      ▼
notification_events
      │
      ▼
Notification Processor
      ├──────────────────┐
      ▼                  ▼
user_notifications    email_queue (pending)
      │                  │
      ▼                  ▼
Inbox              POST /api/notifications/process-email-queue
                         │
                         ▼
                   Email Worker (Admin SDK)
                         │
                         ▼
                      Resend
                         │
                         ▼
                    Recipient inbox
```

Failures in the email path **never** roll back or block Inbox writes.

---

## Email-eligible events (`emailImportant: true`)

| Domain | Types |
|--------|--------|
| Assignments | assigned, reassigned, completed, due_soon, due_today, due_tomorrow, overdue |
| Comments | created, reply, mentioned |
| Reviews | requested, approved, rejected, changes_requested |
| Releases | created, date_changed, approved, published, delayed |
| Invitations | accepted, revoked |

**Not emailed:** started, accepted, archived, watcher add/remove, readiness noise, etc.

Password reset remains Firebase Auth templates (BUG-004A), not this queue.

---

## Queue document (`email_queue`)

```
id, organizationId, recipientUid, recipientEmail,
notificationId, eventId, eventType, template, subject, payload,
status, attempts, createdAt, sentAt, failedAt, lastError, dedupeKey
```

Statuses: `pending` → `sending` → `sent` | `failed` | `cancelled`

### Deduplication

1. Same `notificationId` → skip  
2. Same `dedupeKey` (`eventId:recipientUid`) within **5 minutes** while pending/sending/sent → skip  

Inbox rows are **not** deduplicated away.

---

## Preferences

Per user (`notification_preferences`):

- Channel masters: `inAppEnabled`, `emailEnabled`, `pushEnabled`  
- Per-category flags (e.g. `commentReply`, `assignmentAssigned`)  

Email requires: type `emailImportant` **and** `email` channel **and** category enabled.

---

## Worker

| Piece | Role |
|-------|------|
| `lib/email/email-worker.ts` | Claim, render, send, retry, status |
| `app/api/notifications/process-email-queue/route.ts` | Auth + Admin + worker |
| `lib/email/trigger-email-worker.ts` | Client fire-and-forget after process |

Retry: up to **5** attempts; then permanent `failed`.

---

## Templates

`lib/email/notification-email-templates.ts`

- ReleaseFlow logo  
- Dark layout (email-safe)  
- Org name, title, body, actor, entity  
- Primary CTA with deep link  
- Footer + preference note  

CTA labels by type (View Comment, Open Assignment, Open Release, …).

---

## Deep links

Same as registry / `notificationHref`:

| Event | Path |
|-------|------|
| Comment / mention | `/assignments/{id}?tab=comments` |
| Review | `/assignments/{id}?tab=review` |
| Assignment | `/assignments/{id}` |
| Release | `/releases/{id}` |

Absolute URLs use `NEXT_PUBLIC_APP_URL` / `APP_URL`.

---

## Files

| Path | Purpose |
|------|---------|
| `lib/email-queue-repository.ts` | Enqueue + dedupe |
| `lib/email/email-worker.ts` | Delivery |
| `lib/email/notification-email-templates.ts` | HTML |
| `lib/email/trigger-email-worker.ts` | Client trigger |
| `app/api/notifications/process-email-queue/route.ts` | Worker API |
| `lib/notification-processor.ts` | Enqueue + trigger |
| `lib/notification-type-registry.ts` | emailImportant matrix |
| `firestore.rules` | Client create pending only |

---

## Ops requirements

Vercel / server env:

- `RESEND_API_KEY`  
- `EMAIL_FROM` (e.g. `ReleaseFlow <noreply@send.okeldijital.africa>`)  
- `FIREBASE_SERVICE_ACCOUNT` (Admin worker)  
- `NEXT_PUBLIC_APP_URL` / `APP_URL` for deep links  

---

## Acceptance

1. Event → `notification_events`  
2. Processor → `user_notifications`  
3. Processor → `email_queue` when email enabled  
4. Worker → Resend → status `sent`  
5. Inbox immediate  
6. Email template + deep link correct  
7. Email failure does not block inbox  
8. Preferences respected  
9. Dedupe suppresses duplicate emails, not inbox rows  

---

## Tests

`__tests__/not-002-email-delivery.test.ts` — matrix, wiring, template render.  
