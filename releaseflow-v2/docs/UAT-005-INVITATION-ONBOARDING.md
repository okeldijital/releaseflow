# UAT-005 — Invitation-Driven Onboarding Flow

**Priority:** P0 – Release Blocking  
**Status:** Implemented

## Root Cause

Invited collaborators entered **generic onboarding** (“Which company are you working with?”) because routing treated “zero organization memberships” as “new admin who must create/select a company.”

### Exact routing decision

In `apps/web/src/app/auth/resolve/page.tsx` (pre-fix):

```
if (orgs.length === 0) {
  router.replace('/onboarding');  // ← generic company wizard
}
```

That path ran when:

1. Invitation context (token / return URL) was lost during sign-up or sign-in, **or**
2. Accept failed / was deferred and the user landed on resolve with no memberships, **or**
3. After accept, the invite page redirected to `/onboarding/invitation` when `displayName` was empty — still inside the onboarding route group.

Additional UX issue: the invite page made **“Sign in to Accept”** the primary CTA, even though invitations are created via “Invite Someone New” (default: brand-new user).

## Fix Summary

1. **Full invitation context** persisted in `sessionStorage` (`invitation_context`): token, organizationId, invited email, platform role, professional role, return URL.
2. **Invitation-aware routing always wins** in `/auth/resolve`, onboarding layout, welcome, and company pages.
3. **Invite CTAs**: primary = Create Account & Accept Invitation; secondary = Sign In.
4. **Post-accept**: always collaborator workspace (`/home` or `/dashboard`) — never generic onboarding.
5. **Structured logs** under `[Invitation Flow]`.
6. **Notification event** `invitation.accepted` after successful accept (best-effort).

## Final Invitation Onboarding Flow

### Brand-new collaborator

```
Invitation Email
  → Open /invite/[token]
  → Verify invitation (public)
  → Store invitation context
  → Primary: Create Account & Accept Invitation
  → Sign-up (context survives)
  → Return to /invite/[token]
  → Auto-accept (atomic): membership + roles + profile + activity
  → Notification event
  → Redirect /home (collaborator) or /dashboard
```

### Existing ReleaseFlow user

```
Invitation Email
  → Open /invite/[token]
  → Verify invitation
  → Secondary: Already have a ReleaseFlow account? Sign In
  → Sign-in (context survives)
  → Return to /invite/[token]
  → Auto-accept
  → Redirect workspace
```

### Authenticated visitor

Skip auth UI → auto-accept → workspace.

### Pseudo-logic (every resolve path)

```
if (pendingInvitation) {
  completeInvitationFlow()  // never company selection
} else {
  continueStandardOnboarding()
}
```

## Files Modified

| File | Purpose |
|------|---------|
| `apps/web/src/lib/auth-return.ts` | Full invitation context store/restore/clear; workspace path helper |
| `apps/web/src/app/invite/[token]/page.tsx` | Primary Create Account CTA; store context; auto-accept; no onboarding redirect |
| `apps/web/src/app/auth/resolve/page.tsx` | Invitation-first routing; never onboarding when invite pending |
| `apps/web/src/app/(onboarding)/layout.tsx` | Block entire onboarding shell when invite context exists |
| `apps/web/src/app/(onboarding)/onboarding/page.tsx` | Guard welcome → company path |
| `apps/web/src/app/(onboarding)/onboarding/company/page.tsx` | Guard “Which company…” screen |
| `apps/web/src/app/(onboarding)/onboarding/invitation/page.tsx` | Legacy step → bounce to invite/resolve |
| `apps/web/src/app/(auth)/sign-in/page.tsx` | Capture return; invitation flow logging |
| `apps/web/src/app/(auth)/sign-up/page.tsx` | Capture return; prefill invite email; set displayName |
| `apps/web/src/lib/invitation-repository.ts` | Professional role on Person; flow logs |
| `apps/web/src/__tests__/invitation-context.test.ts` | Unit tests for context persistence |
| `docs/UAT-005-INVITATION-ONBOARDING.md` | This document |

## Email Validation

Unchanged: `normalize(email) = trim().toLowerCase()` on both invitation and authenticated user emails before comparison.

## Manual Validation Checklist

### Scenario A — Brand-new collaborator

- [ ] Admin invites a brand-new email
- [ ] Collaborator opens invitation → verifies
- [ ] Primary button: **Create Account & Accept Invitation**
- [ ] Account + profile created; invitation auto-accepted
- [ ] Membership + platform role + professional role assigned
- [ ] Redirect to collaborator workspace (`/home`)
- [ ] Company selection **never** shown

### Scenario B — Existing user

- [ ] Admin invites existing email
- [ ] Secondary: **Already have a ReleaseFlow account? Sign In**
- [ ] Sign in → auto-accept → workspace
- [ ] No company selection

### Cross-cutting

- [ ] Context survives sign-up, sign-in, refresh
- [ ] Invitation marked accepted; activity recorded; notification event generated
- [ ] TypeScript / lint / tests / production build pass

## Logging

```
[Invitation Flow] ✓ Invitation verified
[Invitation Flow] ✓ User authenticated
[Invitation Flow] ✓ User profile created
[Invitation Flow] ✓ Invitation context restored
[Invitation Flow] ✓ Membership created
[Invitation Flow] ✓ Platform role assigned
[Invitation Flow] ✓ Professional role assigned
[Invitation Flow] ✓ Invitation accepted
[Invitation Flow] ✓ Redirecting to collaborator workspace
```

If generic onboarding is entered:

```
[Invitation Flow] · Branching to generic onboarding { reason: 'no_pending_invitation_and_zero_memberships' }
```

or blocked:

```
[Invitation Flow] · Blocked generic onboarding — invitation context present { reason: 'pending_invitation_takes_precedence' }
```
