# Organization Onboarding Flow

## Swimlane Overview

```
  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │  VISITOR  │   │   USER    │   │  SYSTEM   │   │ ONBOARD  │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘
       │               │              │              │
       │  register     │              │              │
       ├──────────────►│              │              │
       │               │              │              │
       │               │  create acct │              │
       │               │─────────────►│              │
       │               │              │              │
       │               │  ◄──── account created ◄───│
       │               │              │              │
       │               │  verify      │              │
       │               │  email       │              │
       │               │─────────────►│              │
       │               │              │              │
       │               │  ◄──── email verified ◄────│
       │               │              │              │
       │               │  create org  │              │
       │               │  + select    │              │
       │               │  org type    │              │
       │               │─────────────►│─────────────►│
       │               │              │              │
       │               │  ◄──── org provisioned ◄───│
       │               │              │              │
       │               │  invite team │              │
       │               │─────────────►│─────────────►│
       │               │              │              │
       │               │  ◄──── invitations sent ◄──│
       │               │              │              │
       │               │  create      │              │
       │               │  first rel   │              │
       │               │─────────────►│─────────────►│
       │               │              │              │
       │               │  ◄──── redirect to ───────►│
       │               │           dashboard         │
       │               │              │              │
       ▼               ▼              ▼              ▼
```

---

## Page-by-Page Flow

### Step 1: Create Account

```
┌─────────────────────────────────────┐
│         ◐ ReleaseFlow               │
│                                     │
│     ┌─────────────────────────┐     │
│     │  Create your account     │     │
│     │                         │     │
│     │  Full name               │     │
│     │  ┌──────────────────┐   │     │
│     │  │ Jane A&R         │   │     │
│     │  └──────────────────┘   │     │
│     │                         │     │
│     │  Work email              │     │
│     │  ┌──────────────────┐   │     │
│     │  │ jane@label.com   │   │     │
│     │  └──────────────────┘   │     │
│     │                         │     │
│     │  Password                │     │
│     │  ┌──────────────────┐   │     │
│     │  │ ••••••••••       │   │     │
│     │  └──────────────────┘   │     │
│     │                         │     │
│     │  ┌─────────────────────┐│     │
│     │  │  🔐 Create Account  ││     │
│     │  └─────────────────────┘│     │
│     │                         │     │
│     │  Already have an        │     │
│     │  account? Sign in       │     │
│     └─────────────────────────┘     │
│                                     │
│  ✅ 0%    ◉◉◉◉ ○○○○   5 steps       │
│                                     │
└─────────────────────────────────────┘
```

---

### Step 1b: Verify Email

*Sent immediately after account creation. User must verify before
proceeding to org creation.*

```
┌─────────────────────────────────────┐
│         ◐ ReleaseFlow               │
│                                     │
│     ┌─────────────────────────┐     │
│     │  Check your email        │     │
│     │                         │     │
│     │  ┌──────────────────┐   │     │
│     │  │  📧               │   │     │
│     │  └──────────────────┘   │     │
│     │                         │     │
│     │  We sent a verification  │     │
│     │  link to                 │     │
│     │  jane@label.com          │     │
│     │                         │     │
│     │  Click the link in the   │     │
│     │  email to continue.      │     │
│     │                         │     │
│     │  ┌─────────────────────┐│     │
│     │  │  Resend email       ││     │
│     │  └─────────────────────┘│     │
│     │                         │     │
│     │  ┌─────────────────────┐│     │
│     │  │  Change email       ││     │
│     │  └─────────────────────┘│     │
│     │                         │     │
│     │  ─────────────────────  │     │
│     │                         │     │
│     │  Didn't receive it?     │     │
│     │  Check spam folder.     │     │
│     └─────────────────────────┘     │
│                                     │
│  ✅ 20%   ◉◉◉◉◉ ○○○○○   5 steps      │
│                                     │
└─────────────────────────────────────┘
```

### States

| State           | Behavior                                           |
|-----------------|----------------------------------------------------|
| Sent            | "We sent a verification link to jane@label.com"     |
| Resent          | "Email resent. Check your inbox."                   |
| Expired         | "Link expired. Request a new one."                  |
| Verified        | Auto-advance to Step 2                              |
| Skip (optional) | Allow proceeding without verify; flag in admin      |

---

### Step 2: Create Organization

```
┌─────────────────────────────────────┐
│         ◐ ReleaseFlow               │
│                                     │
│     ┌─────────────────────────┐     │
│     │  Name your organization  │     │
│     │                         │     │
│     │  Organization name  *    │     │
│     │  ┌──────────────────┐   │     │
│     │  │ Acme Records     │   │     │
│     │  └──────────────────┘   │     │
│     │                         │     │
│     │  URL slug                │     │
│     │  ┌──────────────────┐   │     │
│     │  │ acme-records     │   │     │
│     │  └──────────────────┘   │     │
│     │  releaseflow.app/acme-records│
│     │                         │     │
│     │  Organization type  *    │     │
│     │  ┌──────────────────┐   │     │
│     │  │ Record Label ▼   │   │     │
│     │  └──────────────────┘   │     │
│     │    • Record Label        │     │
│     │    • Independent Artist  │     │
│     │    • Management Company  │     │
│     │    • Publisher           │     │
│     │    • Agency              │     │
│     │                         │     │
│     │  Country                 │     │
│     │  ┌──────────────────┐   │     │
│     │  │ United States ▼  │   │     │
│     │  └──────────────────┘   │     │
│     │                         │     │
│     │  Timezone                │     │
│     │  ┌──────────────────┐   │     │
│     │  │ America/New_York ▼│   │     │
│     │  └──────────────────┘   │     │
│     │                         │     │
│     │  Team size               │     │
│     │  ┌──────────────────┐   │     │
│     │  │ 2-10 ▼           │   │     │
│     │  └──────────────────┘   │     │
│     │                         │     │
│     │  ┌─────────────────────┐│     │
│     │  │  🏢 Create Org      ││     │
│     │  └─────────────────────┘│     │
│     │                         │     │
│     │  ⬅ Back                 │     │
│     └─────────────────────────┘     │
│                                     │
│  ✅ 40%   ◉◉◉◉◉ ○○○○○   5 steps       │
│                                     │
└─────────────────────────────────────┘
```

### Organization Types Reference

| Type                | Description                                  | V1 Support |
|---------------------|----------------------------------------------|------------|
| Record Label        | Full label operations: releases, artists,    | Full       |
|                     | distribution, royalty tracking               |            |
| Independent Artist  | Solo creator managing their own catalog      | Partial    |
| Management Company  | Artist management overseeing multiple clients| Partial    |
| Publisher           | Music publishing, composition rights         | Limited    |
| Agency              | Booking, PR, or creative agency              | Limited    |

**V1 note:** Only Record Label receives full feature support in Sprint
003. Other types share the same UI but with reduced default workflow
complexity (fewer mandatory stages, simpler metadata requirements).

---

### Step 2a: Organization Branding (Optional Expansion)

*If user selects "Customize later" from org creation or first visits
Settings after onboarding, this panel is available:*

```
┌─────────────────────────────────────┐
│  Organization Settings               │
│  ───────────────────────────         │
│                                      │
│  Brand color                         │
│  ┌──────────────────┐               │
│  │ #7C3AED     🎨   │               │
│  └──────────────────┘               │
│                                      │
│  Logo                                │
│  ┌────────────────────────┐         │
│  │  ┌───┐                 │         │
│  │  │ 🏢│  Drop or click  │         │
│  │  │   │  to upload      │         │
│  │  └───┘                 │         │
│  └────────────────────────┘         │
│                                      │
│  Default language                    │
│  ┌──────────────────┐               │
│  │ English (US) ▼   │               │
│  └──────────────────┘               │
│                                      │
│  ┌─────────────────────────────┐    │
│  │  Save changes               │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

### Step 3: Invite Team

```
┌─────────────────────────────────────┐
│         ◐ ReleaseFlow               │
│                                     │
│     ┌─────────────────────────┐     │
│     │  Invite your team        │     │
│     │                         │     │
│     │  Email addresses          │     │
│     │  ┌────────────────────┐  │     │
│     │  │ alex@label.com     │  │     │
│     │  ├────────────────────┤  │     │
│     │  │ sam@label.com      │  │     │
│     │  ├────────────────────┤  │     │
│     │  │ taylor@label.com   │  │     │
│     │  ├────────────────────┤  │     │
│     │  │ + Add another      │  │     │
│     │  └────────────────────┘  │     │
│     │                         │     │
│     │  Assign roles on invite? │     │
│     │  ◉ Yes, assign now       │     │
│     │  ○ Send later            │     │
│     │                         │     │
│     │  ┌──────────────┬─────┐ │     │
│     │  │ alex@...     │ PM  │ │     │
│     │  │ sam@...      │ A&R │ │     │
│     │  │ taylor@...   │ Art │ │     │
│     │  └──────────────┴─────┘ │     │
│     │                         │     │
│     │  ┌─────────────────────┐│     │
│     │  │  ✉ Send Invites     ││     │
│     │  └─────────────────────┘│     │
│     │                         │     │
│     │  ⬅ Skip — I'll do this  │     │
│     │       later             │     │
│     └─────────────────────────┘     │
│                                     │
│  ✅ 50%   ◉◉◉◉◉ ○○○○○   5 steps       │
│                                     │
└─────────────────────────────────────┘
```

---

### Step 4: Create First Release

```
┌─────────────────────────────────────┐
│         ◐ ReleaseFlow               │
│                                     │
│     ┌─────────────────────────┐     │
│     │  Your first release      │     │
│     │                         │     │
│     │  Pick a template         │     │
│     │                         │     │
│     │  ┌──────┐ ┌──────┐ ┌──┐ │     │
│     │  │ Single│ │  EP   │ │Alb│ │     │
│     │  │🎵     │ │🎵🎵🎵 │ │🎵🎵│ │     │
│     │  └──────┘ └──────┘ └──┘ │     │
│     │                         │     │
│     │  Release title           │     │
│     │  ┌──────────────────┐   │     │
│     │  │ Midnight Sessions│   │     │
│     │  └──────────────────┘   │     │
│     │                         │     │
│     │  Artist name             │     │
│     │  ┌──────────────────┐   │     │
│     │  │ Artist X         │   │     │
│     │  └──────────────────┘   │     │
│     │                         │     │
│     │  Target release date     │     │
│     │  ┌──────────────────┐   │     │
│     │  │ Aug 15, 2026    │   │     │
│     │  └──────────────────┘   │     │
│     │                         │     │
│     │  ┌─────────────────────┐│     │
│     │  │  🎵 Create Release  ││     │
│     │  └─────────────────────┘│     │
│     │                         │     │
│     │  ⬅ Back                 │     │
│     └─────────────────────────┘     │
│                                     │
│  ✅ 75%   ◉◉◉◉◉ ○○○○○   5 steps       │
│                                     │
└─────────────────────────────────────┘
```

---

### Completion Screen

```
┌─────────────────────────────────────┐
│         ◐ ReleaseFlow               │
│                                     │
│     ┌─────────────────────────┐     │
│     │     🎉                  │     │
│     │                         │     │
│     │   You're all set!        │     │
│     │                         │     │
│     │   "Midnight Sessions"    │     │
│     │   is now in IDEA stage.  │     │
│     │                         │     │
│     │   ┌─────────────────┐   │     │
│     │   │  🚀 Go to Release│   │     │
│     │   └─────────────────┘   │     │
│     │                         │     │
│     │   ┌─────────────────┐   │     │
│     │   │  🏠 Go to Dashboard│ │     │
│     │   └─────────────────┘   │     │
│     │                         │     │
│     │   ───────────────────   │     │
│     │                         │     │
│     │   💡 Was that helpful?  │     │
│     │    👍 Yes   👎 No      │     │
│     └─────────────────────────┘     │
│                                     │
│  ✅ 100%  ◉◉◉◉◉ ◉◉◉◉◉   Complete      │
│                                     │
└─────────────────────────────────────┘
```

---

## Invitation Email (sent during Step 3)

```
┌──────────────────────────────────────┐
│                                      │
│  ◐ ReleaseFlow                       │
│                                      │
│  Hi Alex,                            │
│                                      │
│  Jane has invited you to join        │
│  Acme Records on ReleaseFlow.        │
│                                      │
│  You've been invited as: Project Manager
│                                      │
│  ┌──────────────────────────────┐   │
│  │  🔗 Accept Invitation        │   │
│  └──────────────────────────────┘   │
│                                      │
│  This invitation expires in 7 days. │
│                                      │
│  ──────────────────────────────────  │
│  Already have an account?            │
│  Sign in to accept.                  │
│                                      │
└──────────────────────────────────────┘
```

---

## Edge Cases

| Scenario                             | Handling                                         |
|--------------------------------------|--------------------------------------------------|
| User signs up with existing email    | Show "Account exists. Sign in instead."          |
| Organization name taken              | Suggest alternatives (Acme Records 2, AcmeInc)   |
| Invite email bounces                 | Show warning badge on invite, allow resend        |
| User skips invite step               | Show dashboard with "Invite your team" banner     |
| User closes during Step 4            | Save release as draft; resume from dashboard      |
| User re-enters onboarding (new org)  | Skip account step; start at Step 2               |
| Invitee not found on platform        | Send magic-link invite (creates account on claim) |
| Slug already taken                   | Inline validation: "acme-records is taken.
                                       |  Try acme-records-1 or acmerecords"               |
| User skips branding                  | Use default brand color + auto-generated slug     |
| Org creation fails (billing, etc.)   | Show error with support contact; form preserved   |
