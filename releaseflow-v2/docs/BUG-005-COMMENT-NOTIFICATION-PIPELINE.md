# BUG-005 — Comment Notification Pipeline Failure

**Status:** Fixed  
**Priority:** P0  
**Depends on:** NOT-001, BUG-003  

---

## Observed

| Layer | Status |
|-------|--------|
| Comment write | Works |
| Real-time comments panel | Works |
| Inbox / badge / notification center | **Empty** for collaborators |

---

## Architecture (unchanged)

```
Comment Created
      → generateNotificationEvent()  → notification_events
      → processPendingEvents()       → user_notifications (+ push/email queues)
      → Inbox subscription / badge
```

---

## Root cause (proven in code)

Client-side processing runs **as the comment author** (manager) immediately after post.

For each recipient the processor:

1. **`getNotificationPreferences(recipientUid)`**  
   Firestore rules: `read` only when `request.auth.uid == userId`.  
   Manager **cannot** read collaborator prefs → **permission-denied**.

2. **`findUserNotificationByEvent` (dedupe)**  
   Rules: list only own `user_notifications`.  
   Query `userId == collaborator` as manager → **permission-denied**.

3. The failure **threw out of the recipient loop**, so:

   - No `user_notifications` for the collaborator  
   - Event often never fully completed fan-out from the actor’s session  
   - Empty catch in comments service swallowed processor errors  

**Event emission and registry were fine.**  
**Comment.created was registered** with recipients `[assignee, assigner, watchers]`.  
**processPendingEvents was called** after comment create.

The pipeline broke at **processor fan-out under security rules**, not at comment write or live comment subscription.

### Why assignment create sometimes still “felt” OK

`assignment.assigned` often has a **single** recipient (assignee).  
If the **assignee later** runs `processPendingEvents` (badge poll), they can create **their own** inbox row when reading **their** prefs.  
Comment events include **multiple** recipients; the actor’s process failed on the **first** other-user prefs read and produced **zero** rows before the collaborator’s pipeline ran — and multi-recipient loops still aborted after self if order differed. Fail-closed prefs made actor-side processing unreliable for all multi-recipient types.

---

## Fix

| File | Change |
|------|--------|
| `notification-preferences-repository.ts` | On read/write permission failure → **defaults** (in-app on); never throw for fan-out |
| `user-notifications-repository.ts` | Dedupe query failure → treat as no existing row; allow create |
| `notification-processor.ts` | **Per-recipient try/catch**; always `markEventProcessed` after attempts; log recipients/created |
| `assignment-comments-service.ts` | Emit mention events **then** process; log event id + processor result; surface process errors to console |

No second pipeline. Still: event → processor → inbox.

---

## Execution path (after fix)

1. Manager posts comment → `assignment_comments` + activity  
2. `notification_events` type `comment.created`  
3. Optional `comment.mentioned` events  
4. `processPendingEvents(org)` as manager  
5. Resolve recipients (assignee, assigner, watchers; exclude author)  
6. For each recipient: prefs (own or defaults) → `user_notifications` create  
7. Collaborator live badge `onSnapshot` / inbox query picks up new row  
8. Deep link: `/assignments/{id}?tab=comments`

---

## Acceptance

- [x] `comment.created` / `comment.reply` registered  
- [x] Event emitted on comment  
- [x] Processor runs after comment (+ mentions)  
- [x] Author excluded  
- [x] Fan-out no longer aborts on foreign prefs/dedupe  
- [x] Deep link comments tab  
- [ ] Production dual-account UAT (operator)

---

## Regression risks

| Risk | Mitigation |
|------|------------|
| Defaults over-notify if user disabled prefs | Only when actor cannot read prefs; user still controls own prefs when processing self |
| Duplicate notifications | Create still dedupes when list is readable; rare race if actor cannot see existing |
| Verbose console logs | Operational; can dial back later |

---

## Related

- NOT-001 unified notification platform  
- BUG-003 comments subscription wipe (separate; comments UI, not inbox)  
