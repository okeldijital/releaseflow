# BUG-005 — Notification Delivery Regression

**Status:** Fixed (server-side processor + hardened client fan-out)  
**Priority:** P0  
**Depends on:** NOT-001, NOT-002  

---

## Reproduction

1. Manager opens assignment.  
2. Manager posts a comment.  
3. Collaborator **sees** the comment (real-time comments work).  
4. Collaborator Inbox empty; badge unchanged; no email.

---

## Event trace (expected)

| Stage | Collection / action |
|-------|---------------------|
| Comment write | `assignment_comments` |
| Event | `notification_events` type `comment.created` |
| Process | Admin `process-events` or client `processPendingEvents` |
| Inbox | `user_notifications` per recipient |
| Email | `email_queue` → worker → Resend |

---

## Root causes (code-proven)

### 1. Client processor vs Firestore rules (primary)

Processing ran **as the manager** (comment author). Fan-out required:

| Operation | Rule | Result as manager |
|-----------|------|-------------------|
| Read `notification_preferences/{collaborator}` | owner-only | **permission-denied** |
| List `user_notifications` where `userId == collaborator` (dedupe) | owner-only | **permission-denied** |

Earlier mitigation (defaults + ignore dedupe errors) helped but remained fragile on the client, and any uncaught failure still zeroed out delivery. Empty-recipient / all-fail paths also **marked events processed**, preventing retries.

### 2. Identity resolution

`resolveUserId(personId)` returned **null** when a Person doc existed **without** `userId`, so the assignee never entered the recipient set even though they could open the assignment via other identity paths.

### 3. Email

Email depends on successful inbox path + queue + Admin worker. If inbox fan-out never ran, **email_queue** stayed empty.

Comments UI does **not** use this pipeline — it uses live `assignment_comments` snapshots — which is why collaboration worked while notifications failed.

---

## Fix (no architecture redesign)

Still:

```
Business event → notification_events → processor → user_notifications + email_queue
```

### A. Server-side processor (primary)

| Piece | Role |
|-------|------|
| `lib/server/notification-processor-admin.ts` | Admin fan-out (rules bypass) |
| `POST /api/notifications/process-events` | Auth + process org events + drain email |
| `lib/notification/trigger-process-events.ts` | Client trigger after domain writes |

### B. Client hardening (fallback)

- Prefs: defaults on foreign-user read failure  
- Dedupe: ignore list denial  
- Per-recipient try/catch  
- **Do not** mark processed when all recipient writes fail  
- Stronger `resolveUserId` (person + org roster + uid)  

### C. Call sites

- Comment create → **server process first**, client fallback  
- Assignment create → same  
- Badge pipeline → server first  

---

## Acceptance checklist

1. Comment → `notification_events`  
2. Server processor runs once (or client fallback)  
3. Collaborator gets `user_notifications`  
4. Author does not  
5. Badge increments (live subscription)  
6. Inbox lists notification  
7. Deep link `?tab=comments`  
8. Email queued when `emailImportant` + prefs allow  
9. Worker sends when Resend + Admin configured  
10. Email failure does not remove inbox row  

---

## Ops requirements

- `FIREBASE_SERVICE_ACCOUNT` on Vercel (Admin)  
- `RESEND_API_KEY`, `EMAIL_FROM` for email  
- Composite index: `notification_events` `organizationId` + `createdAt`  

---

## Regression tests

- `__tests__/bug-005-comment-notification.test.ts`  
- Extended expectations for server trigger path  

---

## Residual risks

| Risk | Mitigation |
|------|------------|
| Admin credentials missing | Client fallback still runs |
| Person without `userId` | No auth inbox possible until linked |
| Prior events stuck `processed` with 0 creates | New events fixed; optional reprocess script later |

---

## Files

- `lib/server/notification-processor-admin.ts`  
- `app/api/notifications/process-events/route.ts`  
- `lib/notification/trigger-process-events.ts`  
- `lib/assignment-comments-service.ts`  
- `lib/notification-processor.ts`  
- `lib/notification-engine-service.ts`  
- `lib/assignment-service.ts`  
