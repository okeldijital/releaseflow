# ARCH-001 — Invitation Token as Single Source of Truth

**Priority:** High (Architectural Hardening)  
**Type:** Architecture refinement (non-blocking)  
**Status:** Implemented

## Architecture Summary

The browser remembers **only which invitation is being resumed**.

| Layer | Responsibility |
|-------|----------------|
| **sessionStorage** | Navigation: `invitationToken`, `returnUrl`, `pendingInvitation` |
| **Firestore `invitations/{token}`** | Authority: organization, platform role, professional role, email, status, expiry |

```
Invitation Token (session / URL)
        ↓
  Authentication
        ↓
  Restore token
        ↓
  Lookup invitation document (Firestore)
        ↓
  Validate (pending, not expired, email match)
        ↓
  Accept → membership + roles from document
        ↓
  Collaborator workspace
```

Client-side storage is **never** used for:

- organizationId / organizationName  
- platformRole / professionalRole  
- invitedEmail / inviterName  
- expiry / status  

Those are always read from the latest Firestore invitation document immediately before acceptance (`acceptInvitationAtomically`).

Legacy UAT-005 full-context blobs (`invitation_context`) are **purged** on any read/write of invitation navigation state.

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/lib/auth-return.ts` | Token-only navigation API; purge legacy business context |
| `apps/web/src/app/invite/[token]/page.tsx` | Store token only; accept reloads from Firestore |
| `apps/web/src/app/auth/resolve/page.tsx` | Token restore → Firestore accept |
| `apps/web/src/app/(onboarding)/layout.tsx` | Guard uses token only |
| `apps/web/src/app/(onboarding)/onboarding/page.tsx` | Same |
| `apps/web/src/app/(onboarding)/onboarding/company/page.tsx` | Same |
| `apps/web/src/app/(onboarding)/onboarding/invitation/page.tsx` | Same |
| `apps/web/src/app/(auth)/sign-up/page.tsx` | Prefill email via Firestore fetch, not session |
| `apps/web/src/lib/invitation-repository.ts` | Flow logs: fetched / validated from Firestore |
| `apps/web/src/__tests__/invitation-context.test.ts` | ARCH-001 unit tests |
| `docs/ARCH-001-INVITATION-TOKEN-SSOT.md` | This document |

## Logging

```
[Invitation Flow] ✓ Token restored
[Invitation Flow] ✓ Invitation fetched { source: 'firestore' }
[Invitation Flow] ✓ Invitation validated { source: 'firestore' }
[Invitation Flow] ✓ Membership created
[Invitation Flow] ✓ Roles assigned { source: 'firestore' }
[Invitation Flow] ✓ Invitation accepted
```

## Validation Scenarios

### Brand-new collaborator

1. Invitation verified (Firestore)  
2. Token stored (navigation only)  
3. Account created  
4. Token restored  
5. Invitation reloaded from Firestore  
6. Membership + roles from document  
7. Workspace redirect  

### Existing user

1. Invitation verified  
2. Sign in  
3. Token restored  
4. Invitation reloaded  
5. Membership + roles  
6. Workspace redirect  
