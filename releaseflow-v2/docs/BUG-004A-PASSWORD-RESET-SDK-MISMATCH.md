# BUG-004A — Password Reset SDK Request Mismatch

**Status:** Root cause identified + fix implemented  
**Priority:** P0  
**Depends on:** BUG-004  
**Project:** `releaseflow-prod`  

---

## Confirmed facts (from operator)

| Fact | Status |
|------|--------|
| User `nkosilekot@gmail.com` exists | Yes |
| Provider includes **Email/Password** | Yes |
| Firebase Console → Users → **Reset password** sends email | Yes |
| Gmail receives Console-generated email | Yes |
| Templates / SMTP / account support reset | Proven by Console |
| Failure only when using **ReleaseFlow** client | Yes |

Therefore Firebase project configuration and delivery are **not** the defect. The defect is the **client SDK request shape** vs Console.

---

## Root cause — Outcome A (+ C)

### Outcome A — ActionCodeSettings (primary)

**ReleaseFlow was calling:**

```ts
await sendPasswordResetEmail(auth, email, {
  url: `${window.location.origin}/auth/action`,
  handleCodeInApp: false,
});
```

with a continue-URI error **retry** that could still leave behaviour opaque.

**Firebase Console “Reset password” does not send client ActionCodeSettings.**  
It uses the **Authentication → Templates → Password reset** action URL (Admin / Console backend).

That is the material request difference:

| Source | ActionCodeSettings / continueUrl |
|--------|----------------------------------|
| Firebase Console | None (template action URL only) |
| ReleaseFlow (before fix) | Client `url: {origin}/auth/action` (+ optional retry without settings) |
| ReleaseFlow (after fix) | **None** — `sendPasswordResetEmail(auth, email)` |

### Outcome C — Request differs from Console

| Field | Console | ReleaseFlow before | After |
|-------|---------|-------------------|--------|
| Endpoint family | Identity Toolkit / Admin | `identitytoolkit.googleapis.com` (client) | Same client |
| Email | user email | normalized lowercase | same |
| `continueUrl` / `ActionCodeSettings` | template-driven | **client origin + `/auth/action`** | **omitted** |
| Retry path | n/a | on unauthorized continue URI | **removed** |

Property that diverged: **client-supplied `ActionCodeSettings.url`** (and the retry path around continue-URI errors).

### Outcome B — Wrong Auth instance

Client config (local + expected prod):

- `projectId`: `releaseflow-prod`
- `authDomain`: `releaseflow-prod.firebaseapp.com`

Send path now logs `auth.app.options.projectId` / `authDomain` and warns if `projectId !== releaseflow-prod`. No evidence of dual Firebase apps in code (`getAuth` on single `initializeApp`).

---

## Phase 4 controlled experiment → permanent fix

Per investigation protocol:

```ts
// BEFORE (divergent from Console)
await sendPasswordResetEmail(auth, email, actionCodeSettings);

// AFTER (Console parity)
await sendPasswordResetEmail(auth, email);
```

- No ActionCodeSettings  
- No continue-URI retry  
- No alternate path after failure  

Action links in the email now come from:

**Firebase Console → Authentication → Templates → Password reset → Action URL**  
Expected: `https://flow.okeldijital.africa/auth/action`

Ensure that Console template URL remains set (already proven by Console reset working).

---

## SDK flow (after fix)

```
Forgot Password / Profile Security
        │
        ▼
requestPasswordReset(email)
        │
        ├─ normalize email
        ├─ log auth.app.options { projectId, authDomain }
        ├─ optional fetchSignInMethodsForEmail (block Google-only when known)
        │
        ▼
sendPasswordResetEmail(auth, email)   // ONLY two args
        │
        ▼
Identity Toolkit → Firebase template email → inbox
        │
        ▼
User opens link → /auth/action (from template) → new password
```

### Call sites

| File | Function | Call |
|------|----------|------|
| `lib/auth/password-reset-service.ts` | `requestPasswordReset` | `sendPasswordResetEmail(auth, normalized)` only |
| `lib/profile-service.ts` | `sendMyPasswordResetEmail` | → `requestPasswordReset` |
| `app/(auth)/forgot-password/page.tsx` | `handleSubmit` | → `requestPasswordReset` |
| `components/profile/profile-security-panel.tsx` | reset button | → `sendMyPasswordResetEmail` |

No other wrappers mutate arguments.

### Auth instance

```ts
getAuthInstance() → getAuth(initializeApp({
  apiKey, authDomain, projectId, messagingSenderId, appId
}))
```

Single app; no alternate Auth for reset.

### `buildActionCodeSettings()`

Retained for **documentation / unit tests only** (expected `/auth/action` URL shape).  
**Not** passed to `sendPasswordResetEmail` after BUG-004A.

---

## Network expectation (post-fix)

Request: `identitytoolkit.googleapis.com` … `getOobCode` / password reset  

Payload should **not** include a client `continueUrl` override from ActionCodeSettings.

Compare to Console: Console may use a different admin endpoint; email generation still uses the same template pipeline.

---

## Remediation

| Change | Detail |
|--------|--------|
| Primary send | `sendPasswordResetEmail(auth, email)` only |
| Removed | ActionCodeSettings on send; continue-URI retry |
| Logging | Auth instance projectId/authDomain; no temporary UI debug panel |
| Template | Operators keep Console action URL = `https://flow.okeldijital.africa/auth/action` |

### Regression risks

| Risk | Mitigation |
|------|------------|
| Links use wrong host if Console template wrong | Console reset already proves template works; keep template on production domain |
| Localhost testing uses template prod URL | Expected; oobCode still works when template points at prod action handler |
| Google-only still silent under enumeration protection | Unrelated; copy still warns |

---

## Acceptance

- [x] **Outcome A** — ActionCodeSettings identified as the material client/Console mismatch; removed from send path  
- [x] **Outcome C** — Request difference documented (continue URL / settings)  
- [x] Single service for Forgot Password + Profile  
- [x] No custom email system; no provider changes  
- [x] Temporary UI diagnostic panel removed  

**Verify on production:** Forgot Password for `nkosilekot@gmail.com` → email arrives as with Console.

---

## Files

- `lib/auth/password-reset-service.ts` — fix  
- `app/(auth)/forgot-password/page.tsx` — simplified success UI  
- `docs/BUG-004A-PASSWORD-RESET-SDK-MISMATCH.md` — this document  
- `__tests__/password-reset.test.ts` — regression expectations  
