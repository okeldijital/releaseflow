# BUG-004 — Password Reset Email Delivery Investigation

**Status:** Investigation complete (application layer proven); production Console verification required for final Outcome C/D  
**Priority:** P0  
**Category:** Authentication  
**Depends on:** AUTH-001, UAT-006 / UAT-006A, PROF-001  
**Firebase project (client config):** `releaseflow-prod`  
**Auth domain:** `releaseflow-prod.firebaseapp.com`  
**Production host (expected):** `https://flow.okeldijital.africa`

---

## Executive summary

| Question | Evidence-based answer |
|----------|------------------------|
| Does the UI call Firebase? | **Yes.** Both Forgot Password and Profile → Security call `requestPasswordReset()` → `sendPasswordResetEmail()`. |
| Can success show without calling Firebase? | **No.** Success UI is set only after the SDK promise resolves. Errors go to `catch` and are shown with Firebase codes. |
| Does “success” mean email was delivered? | **No.** It means Identity Toolkit accepted the request. Delivery is Firebase Auth SMTP/templates, **not** Resend. |
| Is Resend / `EMAIL_FROM` involved? | **No.** Invitation emails use Resend. Password reset does **not**. |
| Most likely production causes when UI succeeds and inbox is empty | **(D)** account is Google-only / no password provider under email enumeration protection, **or (C)** Firebase template/SMTP/spam. |

---

## Architecture (what actually sends the mail)

```
Forgot Password page  ──┐
                        ├──► requestPasswordReset()
Profile → Security  ────┘           │
                                    ▼
                    fetchSignInMethodsForEmail (audit)
                                    │
                                    ▼
                    sendPasswordResetEmail(auth, email, ActionCodeSettings?)
                                    │
                                    ▼
                    Google Identity Toolkit (identitytoolkit.googleapis.com)
                                    │
                                    ▼
                    Firebase Authentication email system
                    (Console Templates → Password reset)
                                    │
                                    ▼
                    Firebase default sender  OR  custom SMTP
                                    │
                                    ▼
                              User inbox / spam
```

**Not in this path:** Resend, `email_queue`, `PasswordResetEmail.tsx`, Cloudinary, Firestore rules.

---

## Phase 1 — Client execution path

### Forgot Password (`app/(auth)/forgot-password/page.tsx`)

1. User submits form → `handleSubmit`  
2. Clears error/debug state  
3. `await requestPasswordReset(email)`  
4. **On resolve:** `setSent(true)` + success copy (“If an account with email/password exists…”)  
5. **On reject:** `userFacingPasswordError(err)` + Firebase code/message in UI (dev/debug) and `console.error`  

### Profile Security (`components/profile/profile-security-panel.tsx`)

1. `sendMyPasswordResetEmail(user.email)`  
2. → `profile-service.ts` → `requestPasswordReset(email)` **same service**  
3. Errors use `userFacingPasswordError` (no silent catch)

### Service (`lib/auth/password-reset-service.ts`)

1. Normalize + validate email  
2. `logPasswordRecoveryConfiguration()`  
3. Identity audit via `fetchSignInMethodsForEmail`  
4. Block Google-only / non-password when methods are available  
5. `buildActionCodeSettings()` → `{ url: origin + '/auth/action', handleCodeInApp: false }`  
6. `sendPasswordResetEmail(auth, email, settings)`  
7. On `auth/unauthorized-continue-uri` | `auth/invalid-continue-uri`: **one** retry without settings  
8. Return structured result or throw `PasswordResetError`  

### Complete reset (`app/(auth)/auth/action/page.tsx`)

- `verifyPasswordResetCode` → form → `confirmPasswordReset`  
- Public path in middleware: `/auth/action`, `/forgot-password`, `/reset-password`

---

## Phase 2 — Every `sendPasswordResetEmail` invocation

| Location | Call site | Parameters | ActionCodeSettings |
|----------|-----------|------------|--------------------|
| `password-reset-service.ts` | `requestPasswordReset` primary | `(auth, normalizedEmail, settings?)` | `{ url: '{origin}/auth/action', handleCodeInApp: false }` or omitted |
| `password-reset-service.ts` | continue-URI fallback | `(auth, normalizedEmail)` | **none** |

No other call sites in the monorepo.

`profile-service.sendMyPasswordResetEmail` → only wraps `requestPasswordReset`.

---

## Phase 3 — Error handling audit

| Pattern | Found? | Notes |
|---------|--------|-------|
| `catch { return success }` | **No** | Success only after `await sendPasswordResetEmail` resolves |
| Empty `.catch(() => {})` on reset | **No** | |
| `setSuccess(true)` regardless of SDK | **No** | `setSent(true)` only after await in try |
| Generic mask of Firebase codes | **No** (UAT-006A) | Codes/messages logged + shown |
| Identity audit failure swallow | Partial | Continues to send if methods fetch fails (by design); does not fake success |

**Conclusion for Outcome A:** ReleaseFlow **is** calling Firebase correctly when the success message appears. The bug is **not** a fake success path in application code.

---

## Phase 4–6 — Firebase Console (production operator checklist)

These cannot be read from the repo. Operator must verify project **`releaseflow-prod`**:

### Authentication → Sign-in method

- [ ] **Email/Password enabled**

### Users → `nkosilekot@gmail.com`

Document:

| Field | Value (fill) |
|-------|----------------|
| UID | |
| Providers | password? google.com? |

**If only `google.com`:** password reset cannot deliver a usable password email → **Outcome D**.

### Authentication → Templates → Password reset

- [ ] Template enabled / published  
- [ ] Action URL = `https://flow.okeldijital.africa/auth/action`  
- [ ] No SMTP error banners  

### Authentication → Settings → Authorized domains

Must include:

- [ ] `flow.okeldijital.africa`  
- [ ] `localhost` (dev)  
- [ ] `releaseflow-prod.firebaseapp.com` (default)

### Email enumeration protection

Authentication → Settings → User actions (or similar):

- [ ] Note whether **Email enumeration protection** is **ON**

When **ON**:

- `fetchSignInMethodsForEmail` often returns `[]` even for real users  
- Client **cannot** detect Google-only reliably  
- `sendPasswordResetEmail` returns success for unknown / non-password emails **without** sending mail  

App now logs: `identityAuditInconclusive` when methods are empty.

---

## Phase 7 — ActionCodeSettings

```ts
{
  url: `${window.location.origin}/auth/action`,  // prod: https://flow.okeldijital.africa/auth/action
  handleCodeInApp: false,
}
```

| Risk | Mitigation in code |
|------|--------------------|
| Unauthorized continue URI | Retry once without settings |
| `NEXT_PUBLIC_APP_URL` wrong on Vercel | Prefer live `window.location.origin` for continue URL |
| Local `.env` has `NEXT_PUBLIC_APP_URL=http://localhost:3000` | Correct for local; production **must** set `https://flow.okeldijital.africa` on Vercel |

Continue URL does **not** block email generation on success after fallback; it only affects link host.

---

## Phase 8–10 — Live verification procedure

1. Open production `/forgot-password` with DevTools → Console + Network.  
2. Submit `nkosilekot@gmail.com`.  
3. Capture console:

```
Password Recovery Configuration
origin: ...
NEXT_PUBLIC_APP_URL: ...
continueUrl: ...
authDomain: releaseflow-prod.firebaseapp.com
projectId: releaseflow-prod

[Password Recovery] · Sign-in methods ...
[Password Recovery] · Identity Toolkit OK | ✗ Identity Toolkit response
[Password Recovery] ✓ Password reset email requested successfully (SDK resolved)
```

4. Network: `identitytoolkit.googleapis.com` → status **200** (or document error body if not).  
5. Firebase Console → Authentication → user → confirm providers.  
6. If password provider present + Toolkit 200 + no mail → **Outcome C** (template/SMTP/spam).  
7. If no password provider → **Outcome D**.

### Sender / DNS (Outcome C only)

Default Firebase sender is often:

`noreply@releaseflow-prod.firebaseapp.com`

or project-configured custom SMTP.

Check Gmail spam; if custom SMTP: SPF/DKIM/DMARC for that domain.  
**Do not confuse with** Resend domain `send.okeldijital.africa` used for invitations.

---

## Phase 11 — Emulator

With `NEXT_PUBLIC_EMULATOR_HOST` set, Auth emulator receives reset requests; real SMTP is not used. Emulator confirms **client + SDK wiring** only, not production delivery.

---

## Phase 12 — Regression (single implementation)

| Entry | Path |
|-------|------|
| `/forgot-password` | `requestPasswordReset` |
| Profile → Security → Send reset email | `sendMyPasswordResetEmail` → `requestPasswordReset` |
| Complete link | `/auth/action` → `verifyResetCode` / `completePasswordReset` |

No duplicate `sendPasswordResetEmail` implementations.

---

## Root-cause matrix (Outcomes)

### Outcome A — App not calling Firebase correctly

**Status: DISPROVEN for the “success UI shown” case.**

- Success is gated on SDK resolve.  
- Identity Toolkit traffic is logged.  
- Errors are not swallowed into success.

### Outcome B — Firebase rejects the request

**Status: DISPROVEN when success UI is shown.**

If Toolkit returns 400, UI shows error with code (e.g. `auth/unauthorized-continue-uri`, `auth/operation-not-allowed`).

### Outcome C — Firebase accepts, email not delivered

**Status: LIKELY candidate** when:

- Toolkit **200**  
- User has **password** provider  
- No mail / spam  

**Fix location:** Firebase Console (template, SMTP, spam), not app rewrite.

### Outcome D — Not an Email/Password account

**Status: LIKELY candidate** when:

- User only has Google (or other IdP)  
- Enumeration protection hides methods → UI still “succeeds”  
- No password reset mail by design  

**Fix:** Confirm provider in Console; user signs in with Google or admin links password provider.

---

## Application changes from this investigation (BUG-004)

1. Structured `PasswordResetRequestResult` documenting **SDK acceptance ≠ delivery**.  
2. Explicit log when identity methods are empty (enumeration protection).  
3. Dev/localhost diagnostics panel after success (projectId, continueUrl, methods).  
4. Clearer success copy: email/password only; not Resend.  
5. Profile Security uses `userFacingPasswordError` + full error logging.  

No custom password-reset email system introduced. No provider changes.

---

## Remediation plan (operator)

1. **Console → User `nkosilekot@gmail.com` → Providers**  
   - Password present? → go to 2  
   - Google only? → **Outcome D** — document; no app bug  
2. **Authorized domains** includes `flow.okeldijital.africa`  
3. **Password reset template** action URL = `https://flow.okeldijital.africa/auth/action`  
4. **Vercel env** `NEXT_PUBLIC_APP_URL=https://flow.okeldijital.africa`  
5. **Email/Password** provider enabled  
6. Re-test with DevTools; capture Toolkit 200 + Console methods  
7. If still no mail with password provider → Firebase Support / SMTP / spam (Outcome C)

---

## Regression risks

| Risk | Mitigation |
|------|------------|
| Continue URL domain missing | Fallback send without settings |
| Enumeration protection | Inconclusive identity; honest “if password account exists” copy |
| Confusing Resend with Auth mail | Documented; UI notes Firebase Auth delivery |
| Profile vs forgot-password drift | Single service |

---

## Acceptance (this investigation)

- [x] Full pipeline traced and documented  
- [x] All `sendPasswordResetEmail` sites catalogued  
- [x] Error-masking patterns audited (none for success)  
- [x] Dev diagnostics for Firebase code/message/stack (existing + enhanced)  
- [x] ActionCodeSettings documented  
- [x] Single service for both entry points verified  
- [ ] **Live production Console fill-in for user providers + one Toolkit capture** (requires operator access)  

**Provisional classification:** Application layer is correct. Remaining failure modes are **Outcome C** or **Outcome D**, distinguished only by Firebase Console user provider + live Toolkit/network evidence for `nkosilekot@gmail.com`.
