# UAT-002 — Invitation Invalid After Authentication

**Priority:** P0  
**Status:** Root cause identified and fixed (code). **Deploy Firestore rules required.**

---

## Root Cause Analysis

### What was *not* broken

Anonymous verification, token display, and redirect to `/sign-in?return=/invite/{token}` all worked. The invitation document remained pending.

### Exact failing component

`acceptInvitationAtomically` in `invitation-repository.ts`, during the **post-auth acceptance transaction**.

### Exact failing function / write

```ts
const userProfileRef = doc(db, 'users', user.uid);
await transaction.get(userProfileRef);
// …
transaction.set(userProfileRef, { … });
```

### Exact failing condition

**No Firestore security rule existed for collection `users`.**  
Default deny → transaction failed with `permission-denied`.

### Why the UI said “Invalid Invitation”

```ts
} catch (err) {
  return { ok: false, reason: 'not_found', message: '…' };
}
```

**Every transaction failure was mapped to `not_found`**, which routes to:

`/invitation-error/invalid-token` → title **Invalid Invitation**.

So the invite was still valid; **acceptance failed on user profile write**, and the error was mislabeled as a bad token.

### Secondary issues addressed

1. Return URL could be lost when navigating sign-in ↔ sign-up without `?return=`.  
2. `auth/resolve` only attempted invite accept when `orgs.length === 0`, and did not restore `/invite/{token}`.  
3. After sign-in, user had to click Accept again; auto-accept was missing.

---

## Fix

| Change | Purpose |
|---|---|
| `firestore.rules` — `match /users/{userId}` owner R/W | Allow accept transaction to create profile |
| Stop mapping all accept errors to `not_found` | Surface real failures |
| `auth-return.ts` | Persist return path + token across auth |
| Sign-in / sign-up | Capture return on mount; single redirect; keep return on cross-links |
| Invite page | Auto-accept after return when verified + authenticated |
| Auth resolve | Prefer restore `/invite/…`; accept pending token even with other orgs |

---

## Deploy requirement

```bash
firebase deploy --only firestore:rules
```

Then create a **new** invitation and run full E2E.

---

## Files Modified

| File | Why |
|---|---|
| `firestore.rules` | Add `users` owner rules |
| `invitation-repository.ts` | Honest accept errors + logs |
| `auth-return.ts` | **New** return/token persistence helpers |
| `sign-in/page.tsx` | Return survival + redirect |
| `sign-up/page.tsx` | Same |
| `invite/[token]/page.tsx` | Auto-accept after auth |
| `auth/resolve/page.tsx` | Restore invite URL / accept token |

---

## Validation

| Check | Result |
|---|---|
| TypeScript | Pass |
| Lint | Pass |
| Tests | Pass (581) |
| Production build | Pass |

### Manual E2E (after rules deploy)

1. Admin invites collaborator  
2. Open email → verify OK  
3. Sign in to Accept  
4. Auth succeeds → return to invite → auto-accept  
5. Membership + role created  
6. Redirect to collaborator `/home`  
7. Admin sees member; invitation `accepted`  
