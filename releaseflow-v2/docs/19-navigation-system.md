# Navigation System

## Information Architecture

```
ReleaseFlow
├── Dashboard              [org overview]
│   ├── My Tasks            [assigned to me]
│   ├── Recent Activity     [feed]
│   └── Team Overview       [member status]
│
├── Releases               [list / grid]
│   ├── All Releases
│   ├── By Template         [Single │ EP │ Album │ Remix │ ...]
│   ├── By Status           [Idea │ Production │ Mixing │ ...]
│   └── [Release Detail]    [individual release]
│       ├── Overview         [track listing, metadata, state]
│       ├── Tracks           [track CRUD]
│       ├── Assets           [asset upload / versioning]
│       ├── Workflow         [stage progress, approvals]
│       ├── Tasks            [stage-level tasks]
│       ├── Campaign         [marketing plan]
│       ├── Distribution     [store submission status]
│       ├── Contributors     [credit / royalty split]
│       ├── Activity         [audit log]
│       └── Settings         [release-level config]
│
├── Assets                  [catalog]
│   ├── All Assets
│   ├── By Type             [Stems │ Mixes │ Masters │ Artwork │ ...]
│   └── [Asset Detail]       [version history, linked releases]
│
├── Tasks                   [cross-release task board]
│   ├── Assigned to Me
│   ├── All Tasks
│   ├── Overdue
│   └── By Stage
│
├── Calendar                [timeline view]
│   ├── Release Calendar     [street dates]
│   ├── Task Calendar        [due dates]
│   └── Stage Calendar       [milestones]
│
├── Marketing               [campaign hub]
│   ├── Active Campaigns
│   ├── Campaign Archive
│   └── [Campaign Detail]    [assets, timeline, budget]
│
├── Distribution            [delivery hub]
│   ├── Pending Submission
│   ├── Live Releases
│   └── Store Health         [status per store]
│
├── Reports                 [analytics]
│   ├── Release Analytics
│   ├── Team Productivity
│   ├── Asset Usage
│   └── Export Center
│
├── Settings                [org / team / account]
│   ├── Organization          [profile, branding]
│   ├── Team                  [members, roles]
│   ├── Workflows             [stage templates]
│   ├── Templates             [release template config]
│   ├── Integrations          [API keys, webhooks, DSP connections]
│   ├── Billing               [plan, invoices]
│   └── Account               [profile, password, notifications]
└──
```

---

## Sidebar Navigation (Primary)

```
┌─────────────────────┐
│  ◐ ReleaseFlow      │  ← Logo / brand
├─────────────────────┤
│                     │
│  ◆ Dashboard        │  ← Active state
│                     │
│  ▸ Releases         │  ← Collapsible section
│    ▸ All            │
│    ▸ Singles        │
│    ▸ Albums         │
│    ▸ EPs            │
│                     │
│  ▸ Assets           │
│                     │
│  ▸ Tasks            │
│    ▸ My Tasks       │
│    ▸ Overdue        │
│                     │
│  ▸ Calendar         │
│                     │
│  ▸ Marketing        │
│                     │
│  ▸ Distribution     │
│                     │
│  ▸ Reports          │
│                     │
├─────────────────────┤
│                     │
│  ⚙ Settings         │  ← Bottom section
│  🎧 Acme Records ▼  │  ← Org switcher
│                     │
└─────────────────────┘
```

---

## Top Navigation (Secondary)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ◐ ReleaseFlow    ◆ Dashboard    Releases ▼    Tasks     + New    │
│                                                                    │
│                     🔍 Search releases, tasks, assets...  🔔  👤  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Breadcrumb Pattern

```
Dashboard  >  Releases  >  Midnight Sessions
                                         >  Overview
                                         >  Tracks
                                         >  Workflow
```

---

## Mobile Navigation (Bottom Tab Bar)

```
┌──────┬──────┬──────┬──────┬──────┐
│  ◆   │  ▸   │  ☑   │  📅  │  ⚙  │
│ Dash │ Rel  │Tasks │ Cal  │ More │
└──────┴──────┴──────┴──────┴──────┘
```

---

## Contextual Quick-Actions (FAB)

Floating action button visible on primary list views:

```
┌─┐
│+│  ← FAB
└─┘
  │
  ├── 🎵 New Release
  ├── ☑ New Task
  ├── 📁 Upload Asset
  └── 👥 Invite Member
```

---

## Page-Level Sub-Navigation (Tabs)

Used on detail pages (Release, Campaign, Asset):

```
┌──────────────────────────────────────────────────┐
│  Midnight Sessions       [Edit]  [...]            │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┐     │
│  │Overv.│Tracks│Assets│Workfl│Tasks│Campgn│ ... │
│  └──────┴──────┴──────┴──────┴──────┴──────┘     │
│                                                   │
│  [Active tab content]                             │
└──────────────────────────────────────────────────┘
```

---

## Route Design (Next.js App Router)

```
/                                   → redirect to /dashboard
/(app)/                             → authenticated layout (sidebar)
  /dashboard                        → org overview
  /releases                         → release list
  /releases/[id]                    → release detail (tabs)
  /releases/[id]/tracks             → tracks tab
  /releases/[id]/assets             → assets tab
  /releases/[id]/workflow           → workflow tab
  /releases/[id]/tasks              → tasks tab
  /releases/[id]/campaign           → campaign tab
  /releases/[id]/distribution       → distribution tab
  /releases/[id]/contributors       → contributors tab
  /releases/[id]/activity           → activity tab
  /releases/[id]/settings           → release settings
  /assets                           → asset catalog
  /assets/[id]                      → asset detail (version history)
  /tasks                            → task board
  /calendar                         → calendar view
  /marketing                        → campaign hub
  /marketing/[id]                   → campaign detail
  /distribution                     → distribution hub
  /reports                          → analytics
  /settings                         → org settings
  /settings/team                    → team management
  /settings/workflows               → workflow config
  /settings/templates               → template config
  /settings/integrations            → integrations
  /settings/billing                 → billing
  /settings/account                 → user account

/(auth)/                            → unauthenticated layout
  /sign-in
  /sign-up
  /forgot-password
  /invite/[token]                   → accept invitation

/(onboarding)/                      → wizard layout
  /onboarding                       → create org → invite → first release
```

---

## Notification Center (Slide-out Panel)

```
┌─────────────────────────────────────┐
│  🔔 Notifications                   │
│  ─────────────────────────────────  │
│                                     │
│  🔴 Alex approved Mastering         │
│     Midnight Sessions · 2m ago      │
│  ─────────────────────────────────  │
│  🟡 Task assigned: Review artwork   │
│     Summer EP · 15m ago             │
│  ─────────────────────────────────  │
│  🔴 Deadline tomorrow: Mix master   │
│     Midnight Sessions · 1h ago      │
│  ─────────────────────────────────  │
│  🟢 Distribution live on Spotify    │
│     Lost Tracks · 3h ago            │
│  ─────────────────────────────────  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Mark all as read           │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## Navigation Permissions (Role-Based Visibility)

| Route          | Owner | Admin | PM  | A&R | Artist | Producer | Mix | Mast | Des | Vid | Mkt | PR  | Pub | Dis | Viewer |
|----------------|-------|-------|-----|-----|--------|----------|-----|------|-----|-----|-----|-----|-----|-----|--------|
| Dashboard      | ●     | ●     | ●   | ●   | ●      | ●        | ●   | ●    | ●   | ●   | ●   | ●   | ●   | ●   | ●      |
| Releases       | ●     | ●     | ●   | ●   | ◐      | ◐        | ◐   | ◐    | ◐   | ◐   | ●   | ●   | ●   | ●   | ○      |
| Assets         | ●     | ●     | ●   | ●   | ●      | ◐        | ◐   | ◐    | ●   | ●   | ●   | ●   | ●   | ●   | ○      |
| Tasks          | ●     | ●     | ●   | ●   | ◐      | ◐        | ◐   | ◐    | ◐   | ◐   | ●   | ●   | ●   | ●   | ○      |
| Calendar       | ●     | ●     | ●   | ●   | ●      | ◐        | ◐   | ◐    | ◐   | ◐   | ●   | ●   | ●   | ●   | ●      |
| Marketing      | ●     | ●     | ◐   | −   | −      | −        | −   | −    | −   | −   | ●   | ●   | −   | −   | ○      |
| Distribution   | ●     | ●     | ●   | −   | −      | −        | −   | −    | −   | −   | −   | −   | ●   | ●   | ○      |
| Reports        | ●     | ●     | ●   | ●   | ○      | ○        | ○   | ○    | ○   | ○   | ●   | ●   | ●   | ●   | ○      |
| Settings       | ●     | ●     | ◐   | ○   | ○      | ○        | ○   | ○    | ○   | ○   | ○   | ○   | ○   | ○   | ○      |
