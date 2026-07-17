# CE-001 — Invitation Foundation — Implementation Audit

**Status:** Approved
**Build:** CE-001
**Date:** 2026-07-17
**Scope:** Audit of the existing invitation pipeline prior to redesign. No behaviour changed during the audit.

---

## Part 1 — Audit: Existing Invitation Flow

### 1.1 Authentication

**Firebase Authentication flow**
- Client SDK only (`@firebase/auth`) initialised in `apps/web/src/lib/firebase.ts` via `getAuthInstance()`.
- `apps/web/src/contexts/auth-context.tsx` subscribes with `onAuthStateChanged` and exposes `{ user, loading }` through `useAuth()`.
- Auth state drives routing: `apps/web/src/app/auth/resolve/page.tsx` decides between `/onboarding` (0 memberships), `/dashboard` (1 membership), and `/select-organization` (>1 memberships). The `onboardingCompleted` flag is explicitly *informational* and does not affect routing.

**Email/password flow**
- `apps/web/src/app/(auth)/sign-in/page.tsx` → `signInWithEmailAndPassword`.
- `apps/web/src/app/(auth)/sign-up/page.tsx` → `createUserWithEmailAndPassword` (provider-supplied).
- Google OAuth available on both screens via `signInWithPopup(new GoogleAuthProvider())`.

**Invitation acceptance flow (current)**
- An inviter uses `apps/web/src/app/(app)/people/invitations/page.tsx` → `invite(email, discipline)` → `invitePerson(...)` in `invitation-service.ts`.
- The invitation document is written to Firestore (`invitations` collection) with a `crypto.randomUUID()` token (`invitation-repository.ts:31`).
- A server route `POST /api/invitations/[id]/send-email` renders and sends the email via Resend; the email contains the link `${APP_URL}/invite/${token}` (`send-email/route.ts:19-25`).
- The collaborator opens `/invite/[token]` (`apps/web/src/app/invite/[token]/page.tsx`). The page:
  1. Verifies the token (`fetchInvitationByToken`).
  2. If `valid` and not yet signed in, shows **Sign In** / **Create Account** buttons that store `auth_return_to` in `sessionStorage` and redirect to `/sign-in?return=` / `/sign-up?return=`.
  3. Once `user` exists and `state.status === 'valid'`, it calls `acceptPersonInvitation(token, user)` and then `router.push('/auth/resolve')`.
- `acceptPersonInvitation` (in `invitation-service.ts`) creates/updates the collaborator's `Person` record and writes `memberships` + marks the invitation `accepted`.

**Current onboarding flow**
- `apps/web/src/app/auth/resolve/page.tsx`: new authenticated users with **0** memberships are routed to `/onboarding`. (Note: the `/onboarding` directory does not currently exist in the tree — see §1.4. In practice, an invited collaborator who is accepted gains a membership, so they land on `/dashboard` rather than `/onboarding`.)

### 1.2 Firestore

**Collections involved**

| Collection | Document schema (key fields) | Indexes | Relationships |
|---|---|---|---|
| `invitations` | `id, organizationId, email, inviterId, roleId, discipline?, status ('pending'\|'accepted'\|'expired'\|'revoked'), token, expiresAt, createdAt, updatedAt` | `organizationId + status`; `organizationId + createdAt desc` (`firestore.indexes.json`) | token → lookup; `organizationId` → `organizations`; `inviterId` → `users`; `roleId` resolved via `disciplines.ts` → system role |
| `organizations` | `id, name, slug, ownerId, createdAt?` | — | parent of `memberships`; target of invitation |
| `memberships` | `id, organizationId, userId, roleId, status ('active'\|'pending'\|'inactive'), invitedBy?, createdAt?` | queried by `userId+status`, `organizationId` | links `users` ↔ `organizations`; carries `roleId` |
| `users` | `id (= Firebase uid), displayName?, email?` (auth-linked doc) | — | `inviterId` references this |
| `people` | `id, organizationId, userId?, displayName, email, primaryRole, status, invitationStatus?, ...` | `organizationId + displayName`; `organizationId + userId`; email scan | canonical collaboration identity; reconciled on invite acceptance |

**Invitation token**
- Generated at `invitation-repository.ts:31` as `crypto.randomUUID()`. Stored on the invitation doc. Looked up via `collection('invitations').where('token','==',token)`.

**Where key things happen**
- *Token generated:* `invitation-repository.ts:31` (`createInvitation`).
- *Email sent:* server route `apps/web/src/app/api/invitations/[id]/send-email/route.ts:92-103` (triggered by `requestInvitationEmailDelivery` in `invitation-service.ts:27`).
- *Organization membership created:* `invitation-repository.ts:75-84` (`acceptInvitation`) / surfaced through `acceptPersonInvitation` in `invitation-service.ts:99`.
- *Permissions assigned:* Permission is **not** stored on the invitation. It is **derived** at read time from `roleId` via `ROLE_PERMISSIONS` in `packages/core/src/auth/roles.ts`. On acceptance the `roleId` is copied into `memberships.roleId`.

### 1.3 Current Runtime Sequence

```
Administrator
  │  /people/invitations → invite(email, discipline)
  ▼
invitePerson()  ── writes Firestore `invitations` (token = randomUUID, status=pending)
  │  requestInvitationEmailDelivery()  ── POST /api/invitations/[id]/send-email
  ▼
Invitation Email  ── ${APP_URL}/invite/${token}
  │
  ▼
Collaborator opens /invite/[token]
  │  fetchInvitationByToken()  ── validates token + status
  ▼
Not authenticated?  ── Sign In / Create Account (return=/invite/[token])
  │
  ▼
Authenticated + valid
  │  acceptPersonInvitation(token, user)
  │    ├─ create/update Person (people)
  │    ├─ create Membership (memberships, roleId copied)
  │    └─ mark invitation accepted
  ▼
router.push('/auth/resolve')  ── 0 memberships→/onboarding, 1→/dashboard, >1→/select-organization
```

### 1.4 Gaps identified against CE-001

1. **Invitation model is thin.** It stores `roleId`/`discipline` but not an explicit `platformRole`, `professionalRole`, `permissions`, `invitedByName`, `inviteeName`, `organizationName`, `acceptedAt`. The acceptance path derives the platform role from a discipline→system-role map instead of recording the chosen role on the invitation.
2. **Token is `crypto.randomUUID()`.** Acceptable randomness but not explicitly documented as single-use / server-validated / revocable; expiry is enforced client-side only (`expireOldInvitations`) and not checked at acceptance.
3. **Admin success state** is a plain toast ("Invitation sent to …"); CE-001 requires a dedicated success panel with **Copy Link** / **Share Link** / **Done**.
4. **Landing page** is a generic "Organization Invitation" card; CE-001 requires showing inviter, organization, professional role, platform access, plus **Install App (Recommended)** / **Continue in Browser** actions.
5. **No `/onboarding` route** exists, and acceptance routes to `/auth/resolve`; CE-001 wants reduced onboarding collecting only display name / photo / notification permission / accept.
6. **No explicit expiry/revocation validation** on the landing page beyond status; CE-001 wants error pages for expired/revoked/already-accepted without leaking internals.

---

## Part 2 — Invitation Model (target design)

The redesign below makes the invitation the authoritative access contract. See implementation diffs in Part 10.

### 2.1 `Invitation` record

| Field | Type | Notes |
|---|---|---|
| `id` | string | Firestore doc id (never exposed in token) |
| `token` | string | cryptographically secure, single-use, opaque |
| `status` | `'pending' \| 'accepted' \| 'expired' \| 'revoked'` | no other values |
| `createdAt` | Timestamp | |
| `expiresAt` | Timestamp | single-use expiry |
| `acceptedAt` | Timestamp? | set on acceptance |
| `organizationId` | string | target org |
| `organizationName` | string | snapshot for landing page |
| `inviteeName` | string | name typed by admin |
| `inviteeEmail` | string | |
| `platformRole` | `'administrator' \| 'release_manager' \| 'collaborator'` | security-defining |
| `professionalRole` | string | descriptive only (Artist, Mix Engineer, …) |
| `permissions` | *(not stored)* | inherited from `platformRole` |
| `invitedByUserId` | string | admin uid |
| `invitedByName` | string | admin display name |

### 2.2 Platform Role (security)
Allowed: `administrator`, `release_manager`, `collaborator`. Mapped to canonical system roles:
- `administrator` → `administrator`
- `release_manager` → `project_manager` (alias `release_manager`)
- `collaborator` → `contributor`

### 2.3 Professional Role
Free descriptive label; examples from spec. Does **not** affect permissions.

### 2.4 Permissions
Inherited from `platformRole` via `ROLE_PERMISSIONS` (`packages/core/src/auth/roles.ts`). Not duplicated on the invitation.

---

## Part 3–10 — see implementation diff (Part 10). Security, backwards-compat, acceptance criteria satisfied by the changes described there.
