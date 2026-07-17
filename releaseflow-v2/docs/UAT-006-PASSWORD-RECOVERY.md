# UAT-006 — Password Recovery & Identity Verification

**Status:** Implemented (application layer)  
**Priority:** Access reliability  
**Follow-up:** UAT-006A (Firebase 400 diagnostics) — **diagnostics landed in app; console verification + E2E on production still required**

## Root Cause Analysis

| Issue | Impact |
|-------|--------|
| Email not normalized | Mismatched accounts / failed lookups |
| No `actionCodeSettings` | Reset links may not return to ReleaseFlow domain |
| No in-app action handler | Users stuck on Firebase default page or broken custom URLs |
| Generic catch-all errors | Users cannot tell expired vs invalid vs Google-only |
| No provider audit | Password reset offered for Google-only accounts |
| Middleware missing `/auth/action` | Potential future auth gates blocking handler |
| **UAT-006A:** Identity Toolkit **400** + masked errors | Continue URL unauthorized/invalid, or Email/Password disabled — real `auth/*` code was hidden |

### UAT-006A — Firebase 400 diagnosis (code changes)

Symptoms: `identitytoolkit.googleapis.com` **400**, then a generic UI string (“Could not complete password recovery”).

**Code fixes (this repo):**

1. **Structured Firebase error log** (no masking):
   ```js
   console.error({ code, message, customData, stack })
   ```
2. **UI copy for known config failures** (not generic):
   - `auth/unauthorized-continue-uri` → **Unauthorized Continue URL**
   - `auth/operation-not-allowed` → **Email/Password authentication is disabled.**
   - Other errors surface `auth/...` code + Firebase message.
3. **Runtime config block** before `sendPasswordResetEmail` (production console):
   ```
   Password Recovery Configuration
   origin: ...
   NEXT_PUBLIC_APP_URL: ...
   continueUrl: ...
   authDomain: ...
   projectId: ...
   ```
4. **Identity Toolkit response capture** via temporary `fetch` intercept around Auth calls:
   - HTTP status
   - `error.message`
   - `error.errors[]`
   - full response JSON  
   Explicit logs for `UNAUTHORIZED_CONTINUE_URI` and `OPERATION_NOT_ALLOWED`.
5. **Continue URL generation:** `{window.location.origin}/auth/action`  
   Production expected: `https://flow.okeldijital.africa/auth/action`  
   Warns if host is `localhost`, `*.firebaseapp.com`, or `*.web.app`, or if `NEXT_PUBLIC_APP_URL` ≠ origin.
6. **Retry once without ActionCodeSettings** only for:
   - `auth/unauthorized-continue-uri`
   - `auth/invalid-continue-uri`

**Most likely root cause (pending live confirmation):**  
`auth/unauthorized-continue-uri` / Identity Toolkit `UNAUTHORIZED_CONTINUE_URI` when continue URL host is not on Authorized Domains, **or** `auth/operation-not-allowed` / `OPERATION_NOT_ALLOWED` if Email/Password is disabled.

---

## Application Changes

| File | Purpose |
|------|---------|
| `lib/auth/password-reset-service.ts` | Normalize email, identity audit, send/confirm/verify, error map, UAT-006A diagnostics |
| `app/(auth)/forgot-password/page.tsx` | Specific errors + Firebase code debug block |
| `app/(auth)/auth/action/page.tsx` | Complete reset with new password (oobCode) |
| `app/(auth)/reset-password/page.tsx` | Alias → `/auth/action` |
| `middleware.ts` | Public paths for recovery |
| `sign-in/page.tsx` | Normalize email + clearer auth errors (UAT-006 only; no flow redesign) |
| `__tests__/password-reset.test.ts` | Unit tests |
| `docs/UAT-006-PASSWORD-RECOVERY.md` | This document |

---

## Firebase Console verification checklist (production)

These cannot be set from the repo alone. Confirm against the **production** Firebase project:

### Authentication → Sign-in method

- [ ] **Email/Password: Enabled**

### Authentication → Settings → Authorized domains

- [ ] `flow.okeldijital.africa`
- [ ] `localhost`
- [ ] Default `*.firebaseapp.com` domain for the project

### Authentication → Templates → Password reset

- [ ] **Action URL** =
  ```
  https://flow.okeldijital.africa/auth/action
  ```
- [ ] Template **Published** after edit

### Hosting / Vercel environment

- [ ] `NEXT_PUBLIC_APP_URL=https://flow.okeldijital.africa`

If any item is incorrect, that item is the root-cause candidate for Identity Toolkit 400.

---

## End-to-end scenarios

| Scenario | Expected |
|----------|----------|
| Email/password user | Reset email sent; `/auth/action` sets password; sign-in works |
| Invited user with password | Same as above |
| Google-only account | Message: continue with Google — no email sent |
| Invalid email format | Invalid email error |
| Unknown email | No account found (or Firebase enumeration behavior) |
| Expired oobCode | Expired link message + request new link |
| Already-used oobCode | Invalid/used link message |
| Weak password on complete | Weak password error |
| Rate limited | Too many attempts message |
| Unauthorized continue URI | UI: **Unauthorized Continue URL** + console Identity Toolkit JSON |
| Email/Password disabled | UI: **Email/Password authentication is disabled.** |

### Final E2E (production domain) — deliverable checklist

1. Actual Firebase error code: _fill after one failed/succeeded attempt in console_
2. Identity Toolkit response JSON: _copy from console `Identity Toolkit response` log_
3. Runtime configuration values: _copy `Password Recovery Configuration` block_
4. Root cause: _e.g. unauthorized continue URI / operation not allowed / resolved_
5. Resolution: _console fix and/or deploy_
6. Path:
   ```
   Forgot password → Email sent → Email received → Password changed → Sign in succeeds
   ```
   on `https://flow.okeldijital.africa`

---

## Email delivery note

Password reset emails are sent by **Firebase Auth** (not Resend). The unused `PasswordResetEmail.tsx` template is for optional custom pipelines only. Delivery depends on Firebase project email configuration and spam filtering.

## Logging (success path)

```
Password Recovery Configuration
origin: ...
...
[Password Recovery] ✓ Sending password reset email
[Password Recovery] ✓ Password reset email requested successfully
[Password Recovery] ✓ Reset code verified
[Password Recovery] ✓ Password updated via reset code
```

## Acceptance criteria (UAT-006A)

- [x] Generic-only “Could not complete password recovery” removed for known codes
- [x] Firebase `auth/...` code visible in UI debug block + console
- [x] Identity Toolkit response logged (status, message, errors[], JSON)
- [x] Runtime configuration verified in console
- [ ] Root cause identified on production (requires live attempt + Console check)
- [ ] Password reset E2E tested on production domain
- [x] No changes outside password recovery subsystem (this task)
