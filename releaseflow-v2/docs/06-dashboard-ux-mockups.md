# Dashboard UX — Mockups

---

## Login Screen

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│                         ◐ ReleaseFlow                            │
│                         v2.0.0                                    │
│                                                                   │
│                                                                   │
│     ┌─────────────────────────────────────────────┐               │
│     │  Sign in to your account                     │               │
│     │                                             │               │
│     │  Email                                      │               │
│     │  ┌──────────────────────────────────────┐   │               │
│     │  │ jane@label.com                       │   │               │
│     │  └──────────────────────────────────────┘   │               │
│     │                                             │               │
│     │  Password                                   │               │
│     │  ┌──────────────────────────────────────┐   │               │
│     │  │ •••••••••••••••••••                  │   │               │
│     │  └──────────────────────────────────────┘   │               │
│     │                                             │               │
│     │  ┌──────────────────────────────────────┐   │               │
│     │  │               Sign In                │   │               │
│     │  └──────────────────────────────────────┘   │               │
│     │                                             │               │
│     │  ┌──────────────────────────────────────┐   │               │
│     │  │  ○  Continue with Google             │   │               │
│     │  └──────────────────────────────────────┘   │               │
│     │                                             │               │
│     │  ┌──────────────────────────────────────┐   │               │
│     │  │  ○  Continue with Apple              │   │               │
│     │  └──────────────────────────────────────┘   │               │
│     │                                             │               │
│     │  ─────────────────────────────────────      │               │
│     │                                             │               │
│     │  Forgot password?        Don't have an      │               │
│     │                          account? Sign up   │               │
│     └─────────────────────────────────────────────┘               │
│                                                                   │
│                                                                   │
│            ┌──────────────────────────────────────┐                │
│            │  💡 Tip: Use your work email for     │                │
│            │  SSO access with your label org.     │                │
│            └──────────────────────────────────────┘                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### States

| State       | Behavior                                                 |
|-------------|----------------------------------------------------------|
| Default     | Empty fields, placeholder text                           |
| Filled      | Valid email + masked password                            |
| Loading     | Button shows spinner, "Signing in..."                    |
| Error       | Inline error: "Invalid email or password"                |
| SSO         | Redirect to Google/Apple OAuth, then callback            |
| Rate-limit  | "Too many attempts. Try again in 30 seconds."            |

---

## Registration Screen

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│                         ◐ ReleaseFlow                            │
│                         v2.0.0                                    │
│                                                                   │
│                                                                   │
│     ┌─────────────────────────────────────────────┐               │
│     │  Create your account                         │               │
│     │                                             │               │
│     │  Full name                                  │               │
│     │  ┌──────────────────────────────────────┐   │               │
│     │  │ Jane Taylor                          │   │               │
│     │  └──────────────────────────────────────┘   │               │
│     │                                             │               │
│     │  Work email                                 │               │
│     │  ┌──────────────────────────────────────┐   │               │
│     │  │ jane@label.com                       │   │               │
│     │  └──────────────────────────────────────┘   │               │
│     │                                             │               │
│     │  Password                                   │               │
│     │  ┌──────────────────────────────────────┐   │               │
│     │  │ •••••••••••••••••••                  │   │               │
│     │  └──────────────────────────────────────┘   │               │
│     │                                             │               │
│     │  ┌────────────────────────────────────────┐ │               │
│     │  │ ☐ I agree to the Terms of Service      │ │               │
│     │  │   and Privacy Policy                   │ │               │
│     │  └────────────────────────────────────────┘ │               │
│     │                                             │               │
│     │  ┌──────────────────────────────────────┐   │               │
│     │  │          Create Account              │   │               │
│     │  └──────────────────────────────────────┘   │               │
│     │                                             │               │
│     │  ─────────────────────────────────────      │               │
│     │                                             │               │
│     │  Already have an account?  Sign in          │               │
│     └─────────────────────────────────────────────┘               │
│                                                                   │
│            ┌──────────────────────────────────────┐                │
│            │  🔒 Protected by 256-bit encryption  │                │
│            │     Your data is never shared.       │                │
│            └──────────────────────────────────────┘                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Password Requirements

```
  □  At least 8 characters
  □  At least one uppercase letter
  □  At least one number
  □  At least one special character
```

### States

| State         | Behavior                                           |
|---------------|----------------------------------------------------|
| Default       | Empty fields                                       |
| Validating    | Real-time password strength indicator               |
| Error         | Inline field errors (email taken, weak password)    |
| Success       | Redirect to onboarding wizard                       |
| Email taken   | "An account with this email already exists. Sign in"|

---

## Forgot Password

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│                         ◐ ReleaseFlow                            │
│                         v2.0.0                                    │
│                                                                   │
│                                                                   │
│     ┌─────────────────────────────────────────────┐               │
│     │  Reset your password                         │               │
│     │                                             │               │
│     │  Email                                      │               │
│     │  ┌──────────────────────────────────────┐   │               │
│     │  │ jane@label.com                       │   │               │
│     │  └──────────────────────────────────────┘   │               │
│     │                                             │               │
│     │  ┌──────────────────────────────────────┐   │               │
│     │  │     Send Reset Link                  │   │               │
│     │  └──────────────────────────────────────┘   │               │
│     │                                             │               │
│     │  ─────────────────────────────────────      │               │
│     │                                             │               │
│     │  Remember your password?  Sign in           │               │
│     └─────────────────────────────────────────────┘               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### States

| State       | Behavior                                           |
|-------------|----------------------------------------------------|
| Default     | Empty email field                                  |
| Sent        | "Check your email for a reset link." + back to login|
| Error       | "No account found with this email address."         |
| Rate-limit  | "Too many requests. Try again in 60 seconds."       |

---

## Global Layout Shell (Authenticated)

```
┌──────────────────────────────────────────────────────────────────┐
│  ◐ ReleaseFlow        ◆ Search releases, tasks...     🔔  👤   │
│                       Top Nav                                   │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                       │
│  ◧ Dash  │  [CONTENT AREA]                                      │
│          │                                                       │
│  ☰ Rele  │                                                       │
│          │                                                       │
│  🗂 Ass  │                                                       │
│          │                                                       │
│  ☑ Tasks │                                                       │
│          │                                                       │
│  📅 Cal  │                                                       │
│          │                                                       │
│  📊 Rep  │                                                       │
│          │                                                       │
│  ⚙ Sett  │                                                       │
│          │                                                       │
│  ─────── │                                                       │
│  ✚ New R │                                                       │
│          │                                                       │
├──────────┤                                                       │
│ Upgrade  │                                                       │
│  to Pro  │                                                       │
└──────────┴───────────────────────────────────────────────────────┘
```

---

## Dashboard Wireframes

---

### Empty State — No Organizations

*Shown immediately after login when user has no orgs.*

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│                         ◐ ReleaseFlow                            │
│                                                                   │
│                                                                   │
│                         ┌──────────┐                              │
│                         │  🏢       │                              │
│                         └──────────┘                              │
│                                                                   │
│                    Welcome to ReleaseFlow                          │
│             You haven't created any organizations yet.            │
│                                                                   │
│         Get started by creating your first organization           │
│              to manage releases, tasks, and teams.                │
│                                                                   │
│                                                                   │
│                    ┌─────────────────────┐                        │
│                    │  ✚ Create Organization │                     │
│                    └─────────────────────┘                        │
│                                                                   │
│                              or                                   │
│                                                                   │
│                    ┌─────────────────────┐                        │
│                    │  🔗 Join Existing    │                       │
│                    └─────────────────────┘                        │
│                                                                   │
│                                                                   │
│            ┌──────────────────────────────────────┐                │
│            │  💡 Tip: Organizations group your     │                │
│            │  team, releases, and assets in one   │                │
│            │  place. You can create multiple.     │                │
│            └──────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Organization Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Acme Records  ▼                                    ⚙ settings  │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │   🎵     │  │   ☑      │  │   👥     │  │   📅     │         │
│  │ 12       │  │ 4        │  │ 8        │  │ 3        │         │
│  │ Releases │  │ Pending  │  │ Team     │  │ Upcoming │         │
│  │          │  │ Tasks    │  │ Members  │  │ Deadlines│         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                   │
│  ─── Recent Releases ──────────────────────── ✚ New Release ──  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Midnight Sessions      Album    Mastering   🔴 Jun 30    >  │ │
│  │ Summer EP              EP       Mixing      🟡 Jul 15    >  │ │
│  │ Lost Tracks Vol.2      Comp     Artwork     🟢 Aug 01    >  │ │
│  │ Neon Remix             Remix    To Do       ⚪ TBD       >  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ─── Pending Tasks ────────────────────────────────────────────  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │☐ Approve master — Midnight Sessions            🎯 You     >  │ │
│  │☐ Review artwork — Summer EP                     👤 Alex    >  │ │
│  │☐ Submit metadata — Lost Tracks                   👤 Sam    >  │ │
│  │☐ Schedule session — Artist X                     👤 You    >  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ─── Upcoming Deadlines ───────────────────────────────────────  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 🔴 Today      Mix master due — Midnight Sessions             │ │
│  │ 🟡 Tomorrow   Artwork final — Summer EP                      │ │
│  │ 🟢 Jul 10     Metadata submission — Lost Tracks             │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

### Multiple Organizations (Org Switcher)

```
┌──────────────────────────────────────────────────────────────────┐
│  Acme Records  ▼                                    ⚙ settings  │
│  ┌─────────────────────────────────┐                            │
│  │  ○  Acme Records          ●     │  ← active org             │
│  │  ○  Indie Label Ventures 2      │                             │
│  │  ○  Artist X Management         │                             │
│  │  ──────────────────────────     │                             │
│  │  ✚  Create new organization     │                             │
│  └─────────────────────────────────┘                             │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │   🎵     │  │   ☑      │  │   👥     │  │   📅     │         │
│  │ 12       │  │ 4        │  │ 8        │  │ 3        │         │
│  │ Releases │  │ Pending  │  │ Team     │  │ Upcoming │         │
│  │          │  │ Tasks    │  │ Members  │  │ Deadlines│         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                   │
│  ... dashboard content for the selected org ...                   │
└──────────────────────────────────────────────────────────────────┘
```

---

### Pending Invitations (Banner State)

*Shown at top of dashboard when user has unaccepted invites.*

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  📩  You have 2 pending invitations                        │  │
│  │                                                             │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐       │  │
│  │  │  Acme Records        │  │  Indie Ventures      │       │  │
│  │  │  Role: Project Mgr   │  │  Role: A&R           │       │  │
│  │  │  ┌──────┐ ┌──────┐  │  │  ┌──────┐ ┌──────┐  │       │  │
│  │  │  │Accept│ │Decline│  │  │  │Accept│ │Decline│  │       │  │
│  │  │  └──────┘ └──────┘  │  │  └──────┘ └──────┘  │       │  │
│  │  └──────────────────────┘  └──────────────────────┘       │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────┐      │  │
│  │  │  Dismiss all                                      │     │  │
│  │  └──────────────────────────────────────────────────┘      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Acme Records  ▼   ... dashboard content ...                     │
└──────────────────────────────────────────────────────────────────┘
```

---

### Recent Activity (Dashboard Section)

*Optional collapsible section below stat cards, showing cross-release
activity feed.*

```
  ─── Recent Activity ──────────────────────────────────────────
                                                                 
  🔵 Alex Taylor    approved Mastering stage                    2h ago
                    Midnight Sessions                             
                                                                 
  🟢 Sam Wilson     completed task "Record vocals"               5h ago
                    Summer EP                                     
                                                                 
  🟡 System         Stage "Mixing" started                       1d ago
                    Lost Tracks Vol.2                              
                                                                 
  💬 Jane A&R       commented: "Need to revisit the bridge"      1d ago
                    Midnight Sessions — Track 3                    
                                                                 
  👤 Alex Taylor    uploaded master.wav (v3)                     2d ago
                    Midnight Sessions                              
                                                                 
                    ┌────────────────────────────┐                
                    │  View all activity         │                
                    └────────────────────────────┘                
```

---

## Empty Release List (inside org)

```
┌──────────────────────────────────────────────────────────────────┐
│  Releases                                        ✚ New Release  │
│                                                                   │
│                         ┌──────────┐                              │
│                         │   🎵     │                              │
│                         └──────────┘                              │
│                                                                   │
│                    No releases yet                                 │
│           Create your first release to get started.               │
│                                                                   │
│                                                                   │
│                    ┌──────────────────────┐                       │
│                    │  ✚ Create Release    │                       │
│                    └──────────────────────┘                       │
│                                                                   │
│              💡 Start with a Single, then scale up                │
│                 to EP or Album as you grow.                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Mobile Breakpoint (sidebar collapses)

```
┌──────────────────┐
│ ◐ RF     🔔  👤  │
├──────────────────┤
│ ≡                 │
│                   │
│  ┌──────────┐     │
│  │   🎵     │     │
│  │ 12       │     │
│  │ Releases │     │
│  └──────────┘     │
│  ┌──────────┐     │
│  │   ☑      │     │
│  │ 4        │     │
│  │ Pending  │     │
│  └──────────┘     │
│  ┌──────────┐     │
│  │   👥     │     │
│  │ 8        │     │
│  │ Team     │     │
│  └──────────┘     │
│  ┌──────────┐     │
│  │   📅     │     │
│  │ 3        │     │
│  │ Upcoming │     │
│  └──────────┘     │
│                   │
│  ── Recent ────   │
│                    │
│  Midnight...  >   │
│  Summer EP   >    │
│  Lost Tracks >   │
│  Neon Remix  >   │
└──────────────────┘
```
