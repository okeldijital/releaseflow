# Invitation Experience

---

## Flow Overview

```
Inviter                    System                    Invitee
  │                          │                          │
  │  1. Opens invite modal   │                          │
  ├─────────────────────────►│                          │
  │                          │                          │
  │  2. Enters email(s)      │                          │
  │     + optionally role    │                          │
  ├─────────────────────────►│                          │
  │                          │                          │
  │                          │  3. Validates:           │
  │                          │     - email format       │
  │                          │     - not already member │
  │                          │     - not already invited│
  │                          │     - inviter has        │
  │                          │       user:invite perm   │
  │                          │                          │
  │  4. Confirmation         │                          │
  │◄─────────────────────────┤                          │
  │                          │                          │
  │                          │  5. Creates InviteRecord │
  │                          │     (status=PENDING)     │
  │                          │                          │
  │                          │  6. Sends email          │
  │                          ├─────────────────────────►│
  │                          │                          │
  │                          │                          │  7. Opens email
  │                          │                          │     Clicks link
  │                          │◄─────────────────────────┤
  │                          │                          │
  │                          │  8. Validates token      │
  │                          │     - not expired        │
  │                          │     - not already used   │
  │                          │     - not revoked        │
  │                          │                          │
  │                          │  9a. If logged in:       │
  │                          │      → add to org        │
  │                          │      → role assigned     │
  │                          │      → redirect /dashboard│
  │                          │                          │
  │                          │  9b. If not logged in:   │
  │                          │      → create account    │
  │                          │      → verify email      │
  │                          │      → add to org        │
  │                          │      → onboarding skip   │
  │                          │        (org already set) │
  │                          │      → redirect /dashboard│
  │                          │                          │
  │                          │  10. InviteRecord        │
  │                          │      status=ACCEPTED     │
  │                          │                          │
```

---

## I-1 Invite Modal

### Trigger

User with `user:invite` permission clicks "+ Invite" button (from
Settings > Team, dashboard banner, or FAB).

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Invite Team Members                                 [×] │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Email addresses                                     │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────┐       │ │
│  │  │  alex@label.com                          │       │ │
│  │  ├──────────────────────────────────────────┤       │ │
│  │  │  sam@label.com                           │       │ │
│  │  ├──────────────────────────────────────────┤       │ │
│  │  │  taylor@label.com                        │       │ │
│  │  ├──────────────────────────────────────────┤       │ │
│  │  │  + Add another email                     │       │ │
│  │  └──────────────────────────────────────────┘       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Assign roles now?                                        │
│  ◉ Yes, assign roles                                      │
│  ○ Send without roles                                     │
│                                                           │
│  When "Yes" selected:                                     │
│  ┌───────────────────────┬──────────────────────────────┐ │
│  │  alex@label.com       │  [Project Manager ▼]        │ │
│  │  sam@label.com        │  [A&R ▼]                    │ │
│  │  taylor@label.com     │  [Artist ▼]                 │ │
│  └───────────────────────┴──────────────────────────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  ✉ Send Invites  (3 invitations)                │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Skip — I'll invite later                        │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Email address(es) | Multi-email input | Yes | Email format; no duplicates; not already member; not already pending invite |
| Role (per email) | Select | Only if "Yes, assign roles" | Must be valid role in org |

### States

| State | Behavior |
|-------|----------|
| Default | Empty email list, first row focused |
| Adding | "+ Add another email" clicked → new empty row appears |
| Validating | Async check per email (is member? is already invited?) |
| Error | Invalid email: inline "Invalid email format" on the row. Already member: "[email] is already a member." Already invited: "[email] already has a pending invitation." |
| Ready | All valid emails listed, count badge on Send button ("Send 3 invitations") |
| Sending | Button shows spinner, "Sending..." |
| Success | "3 invitations sent!" toast; modal closes |
| Partial success | "2 sent. 1 failed — [email] bounced." with retry option |
| Error | Network failure: "Failed to send. Retry?" |

---

## I-2 Invitation Email

### Content

```
From:     Acme Records via ReleaseFlow <notifications@releaseflow.app>
Subject:  Jane invited you to join Acme Records on ReleaseFlow

┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ◐ ReleaseFlow                                           │
│                                                          │
│  Hi {invitee_name},                                      │
│                                                          │
│  {inviter_name} has invited you to join                  │
│  {org_name} on ReleaseFlow.                              │
│                                                          │
│  Role:  {role_name}                                      │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │  🔗 Accept Invitation                        │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  This invitation expires in 7 days.                      │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Already have an account?                                │
│  Sign in to accept.                                      │
│                                                          │
│  If you didn't expect this invitation, you can           │
│  ignore this email.                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Behavioral Rules

| Element | Rule |
|---------|------|
| From address | `notifications@releaseflow.app` (no-reply) |
| Subject | `{inviter} invited you to join {org} on ReleaseFlow` |
| CTA button | Links to `/invite/{token}` |
| "Sign in to accept" | Links to `/sign-in?redirect=/invite/{token}` |
| Expiration | Token expires in 7 days (168 hours) |
| Resend | Resend uses same token (reset expiration to 7 days) |

---

## I-3 Invitation Acceptance

### Route: `/invite/[token]`

### States

| State | Trigger | UI |
|-------|---------|----|
| Valid | Token valid, not expired, not accepted | Branded card: org name, role, "Accept Invitation" button |
| Already accepted | Token used | "You've already joined {org}. Go to Dashboard →" |
| Expired | Token > 7 days old | "This invitation has expired. Ask {inviter} to send a new one." |
| Revoked | Admin cancelled invite | "This invitation was revoked." |
| Invalid token | Bad format or not found | "Invalid invitation link." |

### Acceptance Flow (Logged Out)

1. User clicks "Accept Invitation" → registration form pre-fills email (read-only).
2. User enters name + password + accepts terms.
3. Account created → email verification required.
4. After verification → user added to org with specified role.
5. Onboarding skips org creation (already provisioned).
6. Onboarding skips first release creation (org already has releases or user may create later).
7. Redirect to dashboard with toast: "You've joined {org} as {role}!".

### Acceptance Flow (Logged In)

1. User clicks "Accept Invitation" → confirmation dialog: "Join {org} as {role}?"
2. User confirms → added to org.
3. Redirect to dashboard with org switcher showing both orgs.
4. Toast: "You've joined {org} as {role}!".

---

## I-4 Invitation Management (Existing Members)

### Pending Invitations Banner

Trigger: User has unaccepted invitations. Displayed at top of dashboard.

```
┌────────────────────────────────────────────────────────────┐
│  📩  You have 2 pending invitations                        │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │  Acme Records        │  │  Indie Ventures      │       │
│  │  Role: Project Mgr   │  │  Role: A&R           │       │
│  │  ┌──────┐ ┌──────┐  │  │  ┌──────┐ ┌──────┐  │       │
│  │  │Accept│ │Decline│  │  │  │Accept│ │Decline│  │       │
│  │  └──────┘ └──────┘  │  │  └──────┘ └──────┘  │       │
│  │  └──────────────────────┘  └──────────────────────┘       │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Dismiss all                                     │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

| Action | Behavior |
|--------|----------|
| Accept | Same as I-3 logged-in flow. Banner item removed. |
| Decline | Confirmation: "Decline invitation to {org}?" → invitation status = DECLINED. Banner item removed. |
| Dismiss all | All invitations dismissed (not declined; status unchanged). Banner hidden until next login or new invitation. |

---

## I-5 Invitation Lifecycle States

```
                    ┌──────────┐
                    │  PENDING  │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
        ┌─────────┐ ┌────────┐ ┌──────────┐
        │ACCEPTED │ │DECLINED│ │ EXPIRED  │
        └─────────┘ └────────┘ └──────────┘
              │
              ▼
        ┌─────────┐
        │ REVOKED  │  (admin cancelled before acceptance)
        └─────────┘
```

| State | Description | Data Retention |
|-------|-------------|----------------|
| PENDING | Invitation sent, awaiting response | Full record |
| ACCEPTED | Invitee joined org | Full record (audit) |
| DECLINED | Invitee explicitly declined | Full record (audit) |
| EXPIRED | 7 days elapsed without response | Full record (audit) |
| REVOKED | Admin cancelled invite | Full record (audit) |

---

## I-6 Admin Invitation Management

From Settings > Team, admins can manage pending invitations:

| Action | Behavior |
|--------|----------|
| View pending | Filter team list by status = "Pending" — shows invitee email, role, sent date, expiry date |
| Resend | Re-sends email with same token; resets expiration to +7 days from resend |
| Cancel | Set status = REVOKED. Token invalidated. Email notification sent to invitee? No (V1). |
| View history | See expired/declined invitations in audit log |

---

## I-7 Edge Cases

| Scenario | Handling |
|----------|----------|
| Invitee already has an account | Accept flow adds org to existing account. No duplicate creation. |
| Invitee email already in org | Validation error on invite: "[email] is already a member." |
| Duplicate invitation sent | If PENDING invitation exists for same email + org: "Already invited. Resend instead?" |
| Token expired on click | Show "Expired" state with "Ask for a new invitation" message. |
| Org deleted after invite sent | Token validation fails: "Organization no longer exists." |
| Inviter loses `user:invite` permission before invite accepted | Invitation remains valid. Permission check only at invite creation time. |
| Max users reached (plan limit) | Validation error on invite: "Your plan allows {N} team members. Upgrade to invite more." |
| Invitee accepts from wrong email | Token tied to specific email. Must accept with the email that received the invite. |
| Bulk invite with mixed valid/invalid | Send valid ones; show partial success with failed rows. No transactional rollback. |

---

## Data Model

```typescript
interface InviteRecord {
  id: string;
  orgId: string;
  inviterId: string;
  inviteeEmail: string;
  inviteeName?: string;
  roleId: RoleId;
  token: string;              // crypto-random, URL-safe
  status: InviteStatus;       // PENDING | ACCEPTED | DECLINED | EXPIRED | REVOKED
  expiresAt: Timestamp;       // created_at + 7 days
  acceptedAt?: Timestamp;
  declinedAt?: Timestamp;
  revokedAt?: Timestamp;
  revokedById?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'REVOKED';
```

### Scheduled Cleanup

A daily function runs to expire PENDING invitations where `expiresAt < now()`:
- Sets status = EXPIRED
- Logs to audit trail
- No email notification on expiration
