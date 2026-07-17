# UAT-006 — Password Recovery & Identity Verification

**Status:** Implemented (application layer)  
**Priority:** Access reliability

## Root Cause Analysis

| Issue | Impact |
|-------|--------|
| Email not normalized | Mismatched accounts / failed lookups |
| No `actionCodeSettings` | Reset links may not return to ReleaseFlow domain |
| No in-app action handler | Users stuck on Firebase default page or broken custom URLs |
| Generic catch-all errors | Users cannot tell expired vs invalid vs Google-only |
| No provider audit | Password reset offered for Google-only accounts |
| Middleware missing `/auth/action` | Potential future auth gates blocking handler |

The forgot-password page only called `sendPasswordResetEmail(auth, email)` with raw input and swallowed all Firebase error codes.

## Application Changes

| File | Purpose |
|------|---------|
| `lib/auth/password-reset-service.ts` | Normalize email, identity audit, send/confirm/verify, error map |
| `app/(auth)/forgot-password/page.tsx` | Specific errors + Google-only message |
| `app/(auth)/auth/action/page.tsx` | Complete reset with new password (oobCode) |
| `app/(auth)/reset-password/page.tsx` | Alias → `/auth/action` |
| `middleware.ts` | Public paths for recovery |
| `sign-in/page.tsx` | Normalize email + clearer auth errors |
| `__tests__/password-reset.test.ts` | Unit tests |
| `docs/UAT-006-PASSWORD-RECOVERY.md` | This document |

## Firebase Console (production requirements)

These cannot be set from the repo alone. In **Firebase Console → Authentication**:

1. **Sign-in method**  
   - Email/Password: **Enabled**

2. **Authorized domains** (must include):  
   - `flow.okeldijital.africa`  
   - `localhost`  
   - `releaseflow-prod.firebaseapp.com` (default)

3. **Templates → Password reset → Customize action URL**  
   Set to production:
   ```
   https://flow.okeldijital.africa/auth/action
   ```
   Local testing (optional):
   ```
   http://localhost:3000/auth/action
   ```

4. **Publish** the password-reset email template after editing.

5. **Environment** (hosting / Vercel):
   ```
   NEXT_PUBLIC_APP_URL=https://flow.okeldijital.africa
   ```
   Used as `continueUrl` after reset.

## End-to-end scenarios

| Scenario | Expected |
|----------|----------|
| Email/password user | Reset email sent; `/auth/action` sets password; sign-in works |
| Invited user with password | Same as above |
| Google-only account | Message: continue with Google — no email sent |
| Invalid email format | Invalid email error |
| Unknown email | No account found |
| Expired oobCode | Expired link message + request new link |
| Already-used oobCode | Invalid/used link message |
| Weak password on complete | Weak password error |
| Rate limited | Too many attempts message |

## Email delivery note

Password reset emails are sent by **Firebase Auth** (not Resend). The unused `PasswordResetEmail.tsx` template is for optional custom pipelines only. Delivery depends on Firebase project email configuration and spam filtering.

## Logging

```
[Password Recovery] ✓ Sending password reset email
[Password Recovery] ✓ Password reset email requested
[Password Recovery] ✓ Reset code verified
[Password Recovery] ✓ Password updated via reset code
```
