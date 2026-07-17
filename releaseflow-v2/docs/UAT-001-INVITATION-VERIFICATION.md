# UAT-001 — Invitation Verification Failure

**Priority:** P0  
**Status:** Root cause identified and fixed (code). **Deploy Firestore rules required.**

---

## Root Cause Analysis

### Exact failing component

**Firestore security rules for collection `invitations`**, combined with the **client-side token lookup path** used by public verification.

### Exact failing function

1. UI: `apps/web/src/app/invite/[token]/page.tsx` → `verify()` → `validateInvitation(token)`
2. Service: `validateInvitation` → `validateInvitationToken` → **`getInvitationByToken`**
3. Firestore: `getDocs(query(collection('invitations'), where('token','==', token)))`  
   (previous implementation — collection **list** query)

### Exact failing condition

```
match /invitations/{docId} {
  allow read, write: if isAuth();
}
```

Collaborator opens the email link **before** signing in (`request.auth == null`).

- Invitation verification must succeed **unauthenticated**.
- Rules required authentication for **all** reads (including list queries).
- Client SDK threw **`permission-denied`**.
- The invite page caught the exception and showed only:

  > “Failed to verify invitation. Please try again.”

### Why that maps to the UAT symptom

| Outcome | UI message | Meaning |
|---|---|---|
| `ok: false, reason: not_found` | “This invitation link is invalid.” | Document missing |
| `ok: false, reason: expired` | “This invitation has expired.” | Validation failed |
| **thrown exception** | **“Failed to verify invitation…”** | **Catch-all (this bug)** |

The generic string is emitted **only** from the `catch` block — not from normal validation failures. That proves the failure was an **exception** (permission denied), not a missing or expired invitation.

### Pipeline stage that failed

```
… → Extract Token ✓
  → Lookup Invitation ✗  (Firestore permission-denied on unauthenticated list)
  → Validate Invitation (never reached cleanly)
```

Create, persist, token generation, and email delivery **succeeded** (email was received). Failure is **before accept**.

---

## Fix (minimal)

1. **Rules** — public `get`, authenticated `list`/`write`.
2. **Create** — invitation document id = token so unauthenticated clients use `getDoc` (public), not `list`.
3. **Lookup** — `getDoc(invitations/{token})` first; legacy token-field query only as authenticated fallback.
4. **Logging** — structured `[Invitation Verification]` stages; surface exception message/code in UI instead of a blank generic.

---

## Deploy requirement

Code alone is insufficient until rules are live:

```bash
firebase deploy --only firestore:rules
```

Then **create a new invitation** (token-as-id). Old invites with random document ids still need auth for the legacy query path, or a resend/new invite.

---

## Files Modified

| File | Change | Why |
|---|---|---|
| `firestore.rules` | `allow get: if true`; list/write stay auth | Unauthenticated verification |
| `invitation-repository.ts` | Token as doc id; get-by-id lookup; stage logs | Secure public get; RCA logging |
| `invite/[token]/page.tsx` | Stage logs; real error surface; working retry | Unmask exceptions; re-verify |
| `api/invitations/[id]/send-email/route.ts` | Log final accept URL | Confirm link/token integrity |

---

## Validation (local tooling)

| Check | Result |
|---|---|
| TypeScript | Pass |
| Lint | Pass |
| Tests | Pass (581) |
| Production build | Pass |

### Manual E2E (post rules deploy)

1. Admin creates + sends **new** invitation  
2. Collaborator opens link **signed out** → invitation card (valid)  
3. Sign in / create account with invitee email  
4. Accept → membership + role  
5. Invitation status `accepted`  
6. Collaborator lands in workspace / dashboard  
