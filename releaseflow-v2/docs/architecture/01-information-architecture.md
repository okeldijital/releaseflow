# ReleaseFlow Information Architecture — PX-003

**Author:** Agent A — Product Architecture  
**Version:** 1.0  
**Date:** June 2026  
**References:** PDS-03, PDS-11A, PDS-12, PDS-02

---

## 1. Page Hierarchy

Every page belongs to exactly one primary object per NR-005.

### 1.1 Root Objects (Primary Navigation)

```
ReleaseFlow
├── Home                         → Object: Operations (evaluates — never owns data)
├── Releases                     → Object: Release
├── Artists                      → Object: Artist
├── Assets                       → Object: Asset
├── People                       → Object: Person
├── Work                         → Object: Work
└── Administration               → Object: Organization
```

### 1.2 Home (Mission Control)

```
/
├── Operations Center            → Hero: Release Health Table
├── Attention                    → Alerts + Blockers + Deadlines
├── Your Work                    → Tasks assigned to current user
├── Release Health               → All releases health summary
├── Pipeline                     → Releases by stage
├── Recent Activity              → Activity feed
└── Quick Actions                → Create Release, Invite Person
```

### 1.3 Releases

```
/releases
├── /releases                    → Release List (table)
├── /releases/new                → Create Release
└── /releases/[id]
    ├── Overview                 → Hero: Release Journey
    ├── Workflow                 → Stage board
    ├── Tasks                    → Task board
    ├── Deliverables             → Deliverables list + approvals
    ├── Distribution             → DSP board + readiness
    ├── Campaigns                → Campaign timeline + health
    ├── Budget                   → Budget summary + costs
    ├── Rights                   → Rights matrix + splits
    ├── Activity                 → Activity feed
    └── Settings                 → Release configuration
```

### 1.4 Artists

```
/artists
├── /artists                     → Artist catalog (table)
├── /artists/new                 → Create Artist
└── /artists/[id]
    ├── Overview                 → Hero: Active Releases
    ├── Discography              → Release list
    ├── Releases                 → Active releases
    ├── Assets                   → Artist assets
    ├── Credits                  → Credits table
    ├── Rights                   → Rights summary
    ├── People                   → Connected people
    └── Activity                 → Activity feed
```

### 1.5 Assets

```
/assets
├── /assets                      → Hero: Asset Library
├── /assets/upload               → Upload Assets
└── /assets/[id]
    ├── Preview                  → Media viewer
    ├── Metadata                 → Asset metadata
    ├── Usage                    → Where used (releases, artists, campaigns)
    └── Version History          → Version timeline
```

### 1.6 People

```
/people
├── /people                      → People directory (table)
├── /people/invite               → Invite Person
└── /people/[id]
    ├── Overview                 → Hero: Assignments
    ├── Roles                    → Role assignments
    ├── Releases                 → Releases involved
    ├── Approvals                → Pending approvals
    └── Activity                 → Activity feed
```

### 1.7 Work

```
/work
├── My Tasks                     → Hero: Today's Work
├── Reviews                      → Pending reviews
├── Approvals                    → Pending approvals
├── Mentions                     → @mentions
├── Notifications                → Notification feed
└── Upcoming Deadlines           → Deadline list
```

### 1.8 Administration

```
/administration
├── Organization                 → Org profile, branding
├── Members                      → Member list, invite
├── Roles                        → Role definitions
├── Permissions                  → Permission matrix
├── Settings                     → Platform configuration
├── Audit                        → System audit
└── Diagnostics                  → System health
```

---

## 2. Route Map (Complete)

### 2.1 Public Routes (No Auth)

| Route | Page | Object |
|-------|------|--------|
| `/sign-in` | Sign In | User (auth) |
| `/sign-up` | Sign Up | User (create) |
| `/forgot-password` | Forgot Password | User (recovery) |
| `/invite/[token]` | Accept Invitation | Invitation |

### 2.2 Onboarding

| Route | Step | Object |
|-------|------|--------|
| `/onboarding` | Create Organization | Organization |
| `/onboarding/invite` | Invite People | Invitation |
| `/onboarding/done` | Complete | — |

### 2.3 Home

| Route | Page | Hero Component |
|-------|------|---------------|
| `/` | Operations Center | Release Health Table |

### 2.4 Releases

| Route | Page | Object |
|-------|------|--------|
| `/releases` | Release List | Release |
| `/releases/new` | Create Release | Release |
| `/releases/[id]` | Release Workspace | Release |
| `/releases/[id]/workflow` | Workflow Tab | Stage |
| `/releases/[id]/tasks` | Tasks Tab | Task |
| `/releases/[id]/deliverables` | Deliverables Tab | Deliverable |
| `/releases/[id]/distribution` | Distribution Tab | Distribution |
| `/releases/[id]/campaigns` | Campaigns Tab | Campaign |
| `/releases/[id]/budget` | Budget Tab | Budget |
| `/releases/[id]/rights` | Rights Tab | Rights |
| `/releases/[id]/activity` | Activity Tab | Activity |
| `/releases/[id]/settings` | Settings Tab | Release |

### 2.5 Artists

| Route | Page | Object |
|-------|------|--------|
| `/artists` | Artist Catalog | Artist |
| `/artists/new` | Create Artist | Artist |
| `/artists/[id]` | Artist Workspace | Artist |
| `/artists/[id]/discography` | Discography Tab | Release |
| `/artists/[id]/assets` | Assets Tab | Asset |
| `/artists/[id]/credits` | Credits Tab | Credit |
| `/artists/[id]/rights` | Rights Tab | Rights |
| `/artists/[id]/people` | People Tab | Person |
| `/artists/[id]/activity` | Activity Tab | Activity |

### 2.6 Assets

| Route | Page | Object |
|-------|------|--------|
| `/assets` | Asset Library | Asset |
| `/assets/[id]` | Asset Detail | Asset |

### 2.7 People

| Route | Page | Object |
|-------|------|--------|
| `/people` | People Directory | Person |
| `/people/[id]` | Person Profile | Person |

### 2.8 Work

| Route | Page | Object |
|-------|------|--------|
| `/work` | Contributor Home | Work |

### 2.9 Administration

| Route | Page | Object |
|-------|------|--------|
| `/administration` | Organization | Organization |
| `/administration/members` | Members | Membership |
| `/administration/roles` | Roles | Role |
| `/administration/permissions` | Permissions | Permission |
| `/administration/settings` | Settings | Organization |
| `/administration/audit` | Audit | Activity |
| `/administration/diagnostics` | Diagnostics | System |

### Route Count

- **Public:** 4 routes
- **Onboarding:** 3 routes (1 page with steps)
- **Home:** 1 route
- **Releases:** 11 routes (1 list + 1 new + 1 detail + 8 tabs)
- **Artists:** 8 routes (1 list + 1 new + 1 detail + 5 tabs)
- **Assets:** 2 routes
- **People:** 2 routes
- **Work:** 1 route
- **Administration:** 7 routes
- **Total:** 39 routes

---

## 3. Object Relationship Validation (PDS-11A)

### 3.1 Core Object Hierarchy

```
Organization
    │
    ├── People (Memberships — many-to-many)
    │
    ├── Artists (belongs to Organization)
    │       │
    │       └── Releases (many-to-many via ReleaseArtist)
    │               │
    │               ├── Workflow
    │               │       └── Stages → Tasks
    │               ├── Deliverables → Approvals
    │               ├── Dependencies
    │               ├── Distribution
    │               ├── Campaign
    │               ├── Budget → Cost Items
    │               ├── Rights → Splits
    │               ├── Assets
    │               ├── Activity
    │               └── Operational Intelligence (computed)
    │
    └── Assets (shared across Releases, Artists, Organization)
```

### 3.2 Relationship Rules Validation

| Rule | Source | Status |
|------|--------|--------|
| RM-001: Release belongs to one Organization | PDS-11A | ✅ Violated — current types allow org-less releases |
| RM-002: Person may participate in many Releases | PDS-11A | ⚠ Partial — Membership model exists but Contributor model not fully linked |
| RM-003: Artist may appear on many Releases | PDS-11A | ⚠ Partial — ReleaseArtist junction exists in types but no routes |
| RM-004: Assets may be shared across Releases | PDS-11A | ❌ Missing — no `/assets` route, no asset sharing model |
| RM-005: Rights always belong to Releases | PDS-11A | ⚠ Partial — Rights services exist but rights not scoped to release tabs |
| RM-006: Operational Intelligence never stores data | PDS-11A | ✅ Compliant — engines are pure compute |
| RM-007: Activity is append-only | PDS-11A | ✅ Compliant — activity-service treats as immutable |
| RM-008: Work always belongs to a Person | PDS-11A | ✅ Compliant — tasks reference assignee userId |
| RM-009: Workflow owns Deliverables, Deliverables own Approvals | PDS-11A | ⚠ Partial — services exist but no UI for deliverable approval flow |

### 3.3 Orphan Detection

| Current Route | PDS Object | Verdict |
|---------------|-----------|---------|
| `/rights-holders` | Rights holder is sub-object of Rights (which belongs to Release) | ❌ ORPHAN — should be within Administration or Release Rights tab |
| `/brief` | Mixed concerns (risks, deadlines, blockers, budget, recommendations) | ❌ ORPHAN — should be merged into Home (Operations Center) per PDS-03 |
| `/diagnostics` | System health | ⚠ Should be within Administration |
| `/audit` | System audit | ⚠ Should be within Administration |
| `/approvals` | Approval | ⚠ Should be within Work (My Approvals) or Release Workspace |
| `/campaigns` | Campaign | ❌ ORPHAN — belongs within Release Workspace per PDS-03 |
| `/budgets` | Budget | ❌ ORPHAN — belongs within Release Workspace per PDS-03 |
| `/operations` | Operations | ❌ ORPHAN — should be Home according to PDS-03 |

---

## 4. Navigation Map

### 4.1 Sidebar (AppShell) — 7 Primary Items

Per PDS-03: "Exactly seven primary destinations. No additional top-level navigation items may be introduced."

```
┌──────────────────┐
│ ReleaseFlow      │  Logo + Org Switcher
│                  │
│  Operations ────────────────────────────────────────────
│                  │
│  ○ Home          │  → /
│  ○ Releases      │  → /releases
│  ○ Artists       │  → /artists
│                  │
│  Resources ─────────────────────────────────────────────
│                  │
│  ○ Assets        │  → /assets
│  ○ People        │  → /people
│                  │
│  Workspace ─────────────────────────────────────────────
│                  │
│  ○ Work          │  → /work
│                  │
│  System ────────────────────────────────────────────────
│                  │
│  ○ Administration│  → /administration
│                  │
│ ─────────────────│
│  User Avatar     │
│  Sign Out        │
└──────────────────┘
```

### 4.2 Navigation vs Current Implementation

| PDS Item | PDS Label | PDS Route | Current Item | Current Route | Status |
|----------|-----------|-----------|--------------|---------------|--------|
| 1 | Home | `/` | Dashboard | `/dashboard` | ❌ Mismatch |
| 2 | Releases | `/releases` | Releases | `/releases` | ✅ Match |
| 3 | Artists | `/artists` | Artists | `/artists` | ✅ Match |
| 4 | Assets | `/assets` | — | — | ❌ Missing |
| 5 | People | `/people` | — | — | ❌ Missing |
| 6 | Work | `/work` | Contributor | `/contributor` | ❌ Mismatch |
| 7 | Administration | `/administration` | Organizations | `/organizations` | ❌ Mismatch |
| — | — | — | Campaigns | `/campaigns` | ❌ Should not be primary |
| — | — | — | Operations | `/operations` | ❌ Should be Home |
| — | — | — | Approvals | `/approvals` | ❌ Should be within Work |

### 4.3 Section Grouping

| Section | Items | Rationale |
|---------|-------|-----------|
| Operations | Home, Releases, Artists | Core workflow objects — release lifecycle |
| Resources | Assets, People | Shared resources across releases |
| Workspace | Work | Individual contributor space |
| System | Administration | Configuration and governance |

### 4.4 Topbar

```
┌─────────────────────────────────────────────────────────────┐
│ [☰ mobile]  Breadcrumb trail        [Search] [🔔] [👤 Menu] │
└─────────────────────────────────────────────────────────────┘
```

- **Left:** Mobile hamburger (tablet/mobile only)
- **Center:** Breadcrumb following real-world objects
- **Right:** Global Search (⌘K), Notification Bell (with count), User Menu

### 4.5 Breadcrumb Hierarchy

Per PDS-03: "Breadcrumbs should follow real-world objects."

```
Release List → Midnight Echoes → Workflow → Mastering
                              → Overview
                              → Tasks
                              → Deliverables
                              → Distribution
                              → Campaigns
                              → Budget
                              → Rights
                              → Activity
                              → Settings

Artist Catalog → Artist Name → Overview
                             → Discography
                             → Assets
                             → Credits
                             → Rights
                             → People
                             → Activity

People Directory → Person Name → Overview
                                → Releases
                                → Approvals
                                → Activity
```

### 4.6 Role-Based Visibility

| Role | Home | Releases | Artists | Assets | People | Work | Admin |
|------|------|----------|---------|--------|--------|------|-------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Release Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Contributor | ✅ | ✅ (view) | ✅ (view) | ✅ (view) | — | ✅ | — |
| Viewer | ✅ | ✅ (view) | ✅ (view) | — | — | — | — |

---

## 5. User Flow Diagrams

### 5.1 Primary Onboarding Flow

```
Sign Up → Verify Email → Create Organization → Invite People → Create First Release → Dashboard
```

### 5.2 Release Manager Daily Flow

```
Sign In
    │
    ▼
Operations Center (Home)          ← "What requires attention?"
    │
    ├── Alerts → Resolve / Acknowledge
    │
    ├── Blocked Work → Follow Up
    │
    ├── Critical Deadlines → Open Release
    │
    └── Release Health Table → Open Release
                                    │
                                    ▼
                            Release Workspace
                                    │
                            ┌───────┼───────────┐
                            ▼       ▼           ▼
                        Overview  Workflow   Deliverables
                            │       │           │
                            │       ▼           ▼
                            │   Stage Detail  Approvals
                            │       │
                            │       ▼
                            │   Task Board
                            │
                            └── Activity Feed
```

### 5.3 Contributor Flow

```
Sign In
    │
    ▼
Work (My Tasks)                   ← "What should I work on?"
    │
    ├── My Tasks → Open Task → Complete / Upload
    │
    ├── Reviews → Open Review → Approve / Request Changes
    │
    ├── Approvals → Open Approval → Approve / Reject
    │
    └── Notifications → Open referenced object
```

### 5.4 Release Lifecycle Flow

```
Create Release → Select Template → Workflow Generated
    │
    ▼
Planning → Recording → Editing → Mixing → Mastering → Artwork → Publishing → Distribution → Released
    │          │         │        │         │          │          │           │
    ▼          ▼         ▼        ▼         ▼          ▼          ▼           ▼
  Tasks     Tasks     Tasks     Tasks     Tasks      Tasks      Tasks       Tasks
    │          │         │        │         │          │          │           │
    ▼          ▼         ▼        ▼         ▼          ▼          ▼           ▼
Deliverables (per stage)
    │
    ▼
Approvals (per deliverable)
    │
    ▼
Distribution Package → DSP Submission → Release Published
```

### 5.5 Cross-Object Navigation Flow

```
Release Workspace
    │
    ├── Artist (on release) → Click → Artist Workspace
    │                                     │
    │                                     └── Discography → Click Release → Release Workspace
    │
    ├── Person (contributor) → Click → Person Profile
    │                                     │
    │                                     └── Assignments → Click Task → Release Workspace
    │
    ├── Asset (deliverable) → Click → Asset Detail
    │                                     │
    │                                     └── Usage → Click Release → Release Workspace
    │
    └── Campaign → Campaign Tab → Click Asset → Asset Detail
```

---

## 6. Release Workspace Structure Detail

### 6.1 Universal Layout (PDS-12 SA-014)

```
┌──────────────────────────────────────────────────────────────┐
│ Release Header                        [Primary Action]        │
│ Artwork · Title · Artist · Type · Date · Health · Stage       │
├──────────────────────────────────────────────────────────────┤
│ Operational Summary                                            │
│ "Mastering is underway. Artwork approval outstanding.         │
│  Distribution in 14 days."                                    │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────┐  ┌──────────────────────────┐ │
│ │                            │  │ Context Rail             │ │
│ │  Release Journey (Hero)    │  │ • Release Health         │ │
│ │  Planning → Recording →    │  │ • Current Stage          │ │
│ │  Editing → Mixing →        │  │ • Responsible            │ │
│ │  Mastering → Artwork →     │  │ • Due Date               │ │
│ │  Publishing → Distribution │  │ • Dependencies           │ │
│ │  → Released                │  │ • Readiness              │ │
│ │                            │  │ • Recent Activity        │ │
│ └────────────────────────────┘  └──────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ Tab Bar: [Overview] [Workflow] [Tasks] [Deliverables]        │
│          [Distribution] [Campaigns] [Budget] [Rights]        │
│          [Activity] [Settings]                                │
├──────────────────────────────────────────────────────────────┤
│ Tab Content                                                    │
├──────────────────────────────────────────────────────────────┤
│ Activity Feed                                                  │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Tab Definitions

| Tab | Content | Hero/Key Element | State |
|-----|---------|-----------------|-------|
| Overview | Release info, readiness, distribution, ownership, requirements | Release Journey | Required |
| Workflow | Stage columns, stage detail panel | Workflow Board | Required |
| Tasks | Task board (kanban), task detail panel | Task Board | Required |
| Deliverables | Deliverables list, approvals, assets | Deliverables List | Required |
| Distribution | DSP status, readiness, delivery checklist | DSP Board | Tier 3 |
| Campaigns | Campaign timeline, milestones, channels | Campaign Timeline | Tier 3 |
| Budget | Budget summary, costs, forecast | Budget Summary | Tier 3 |
| Rights | Rights matrix, splits, ownership | Rights Matrix | Tier 3 |
| Activity | Activity feed | Activity Feed | Required |
| Settings | Release configuration | Settings Form | Tier 3 |

### 6.3 Context Rail Contents (PDS-07 OI-013, SA-007)

| Section | Content | Source |
|---------|---------|--------|
| Health Ring | Overall health (Excellent/Healthy/Attention/Blocked/Critical) | Computed |
| Current Stage | Stage name + progress | Stage entity |
| Responsible | Person assigned to current stage | Contributor entity |
| Due Date | Release date or stage deadline | Release/Stage entity |
| Dependencies | List of blocking dependencies | Dependency entity |
| Readiness | Readiness stack summary | Computed |
| Recent Activity | Last 5 activity events | Activity log |

---

## 7. Gap Analysis — Current vs PDS

### 7.1 Route Additions Required

| Route | Priority | Rationale |
|-------|----------|-----------|
| `/assets` | T2 | PDS-03 primary nav item 4 |
| `/assets/[id]` | T2 | Asset detail |
| `/people` | T2 | PDS-03 primary nav item 5 |
| `/people/[id]` | T2 | Person profile |
| `/work` (replaces `/contributor`) | T1 | PDS-03 primary nav item 6 |
| `/administration` (replaces `/organizations`) | T3 | PDS-03 primary nav item 7 |
| `/administration/members` | T3 | Admin members |
| `/administration/roles` | T3 | Admin roles |
| `/administration/permissions` | T3 | Admin permissions |
| `/administration/settings` | T3 | Admin settings |
| `/administration/audit` (migrated from `/audit`) | T3 | Admin audit |
| `/administration/diagnostics` (migrated from `/diagnostics`) | T3 | Admin diagnostics |
| `/releases/[id]/deliverables` | T2 | Release Workspace tab |
| `/releases/[id]/distribution` | T3 | Release Workspace tab |
| `/releases/[id]/campaigns` | T3 | Release Workspace tab (route exists standalone, must become tab) |
| `/releases/[id]/budget` | T3 | Release Workspace tab (route exists standalone, must become tab) |
| `/releases/[id]/rights` | T3 | Release Workspace tab |
| `/releases/[id]/activity` | T1 | Release Workspace tab |
| `/releases/[id]/settings` | T3 | Release Workspace tab |
| `/artists/[id]/discography` | T3 | Artist tab |
| `/artists/[id]/assets` | T3 | Artist tab |
| `/artists/[id]/credits` | T3 | Artist tab |
| `/artists/[id]/rights` | T3 | Artist tab |
| `/artists/[id]/people` | T3 | Artist tab |
| `/artists/[id]/activity` | T3 | Artist tab |
| `/onboarding/invite` | T1 | Onboarding step |
| `/onboarding/done` | T1 | Onboarding completion |

### 7.2 Routes to Retire or Migrate

| Current Route | Disposition | Reason |
|---------------|-------------|--------|
| `/dashboard` | → `/` (Home) | PDS-03: Home is the Operations Center |
| `/operations` | → merged into `/` (Home) | PDS-03: Operations Center is Home's primary view |
| `/campaigns` | → `/releases/[id]/campaigns` | PDS-03: campaigns exist within release context |
| `/campaigns/new` | → Release Workspace campaign tab | PDS-03: no standalone campaign creation |
| `/campaigns/[id]` | → Release Workspace campaign tab | PDS-03: campaign is a release sub-object |
| `/budgets` | → `/releases/[id]/budget` | PDS-03: budget exists within release context |
| `/rights-holders` | → Release Workspace rights tab | PDS-03: rights are within release context |
| `/rights-holders/new` | → Release Workspace rights tab | PDS-03: no standalone rights holder creation |
| `/approvals` | → `/work` (My Approvals) | PDS-03: approvals belong to Work |
| `/brief` | → merged into `/` (Home) | PDS-03: brief is part of Home |
| `/audit` | → `/administration/audit` | PDS-03: audit is within Administration |
| `/diagnostics` | → `/administration/diagnostics` | PDS-03: diagnostics is within Administration |
| `/contributor` | → `/work` | PDS-03: rename to match object name |
| `/organizations` | → `/administration` | PDS-03: organizations are within Administration |

### 7.3 Object Model Violations

| Violation | Severity | Description |
|-----------|----------|-------------|
| Campaigns as primary object | High | PDS-11A: Campaign is a child of Release, not a top-level object |
| Budgets as primary object | High | PDS-11A: Budget is a child of Release |
| Rights Holders as primary object | High | PDS-11A: Rights are a child of Release |
| Approvals as primary object | High | PDS-11A: Approvals belong to Deliverables → Work → Person |
| Operations as primary object | Medium | PDS-11A: Operations evaluates data, it doesn't own it. It belongs in Home |
| Brief as orphan | Medium | PDS-11A: Brief aggregates across objects — belongs in Home |
| Missing Assets object | High | PDS-11A: Assets is a core object with its own workspace |
| Missing People object | High | PDS-11A: People is a core object with its own workspace |
| Missing Work object | High | PDS-11A: Work is a core object (currently named Contributor) |
| Administration ungrouped | Medium | PDS-11A: Organization is a core object; audit/diagnostics/settings should be nested |

---

## 8. Product Design Proposals (PDPs)

### PDP-001: Cross-Release Views

**Missing Specification:** The PDS states that Campaigns, Budget, and Rights are tabs within the Release Workspace. However, a Release Manager also needs cross-release views (e.g., "show me all campaigns across all releases"). The PDS does not address whether cross-release aggregation views should exist.

**Why Required:** A PM managing 5 releases needs to see all campaigns, budgets, and blockers at once — not navigate into each release.

**Recommendation:** Add cross-release aggregation views within the Home (Operations Center) that show campaign health, budget status, and rights readiness across all releases. These are views, not standalone objects. The single source of truth remains within the Release Workspace. Home aggregates read-only summaries.

**Proposed spec:** Home → Pipeline section expands to include Campaign Health Summary, Budget Summary, Rights Status Summary.

---

### PDP-002: Release Workspace Tab Routing Convention

**Missing Specification:** The PDS defines 10 tabs in the Release Workspace but does not specify the routing convention. Should tabs use query parameters (`?tab=workflow`), path segments (`/releases/[id]/workflow`), or parallel routes?

**Why Required:** Implementation requires a consistent routing strategy across all workspace types (Release, Artist, People).

**Recommendation:** Use path segments (`/releases/[id]/workflow`). Rationale:
- Each tab has a shareable URL
- Workspace context is preserved in the URL
- Breadcrumbs work naturally
- Server-side rendering per tab is possible
- Consistent with existing Next.js App Router conventions

**Apply to:** Release Workspace tabs, Artist Workspace tabs, Administration sub-pages.

---

### PDP-003: "Operations" Terminology Resolution

**Missing Specification:** PDS-03 uses "Home" as the primary navigation label, but PDS-12 SA-013 uses "Operations Center" as the blueprint name. The Sidebar label, page title, and route need alignment.

**Why Required:** Ambiguity between "Home" (nav), "Operations Center" (page title), and "/" (route).

**Recommendation:**
- **Sidebar label:** "Home"
- **Page title (H1):** "Operations Center"
- **Route:** `/`
- **Breadcrumb:** "Home"
- **Rationale:** "Home" is the navigation destination (where users start). "Operations Center" is the workspace name (what the page is). This matches user expectation — Home is where you always return.

---

### PDP-004: Assets Global vs Release-Scoped Views

**Missing Specification:** PDS-03 lists Assets as a primary navigation item (global asset library). But PDS-11A says "Assets may belong to Artists, Releases, Organizations." The PDS does not specify whether assets should also be viewable within release/artist context.

**Why Required:** Contributors uploading a deliverable need to see only release-relevant assets. A designer searching the global library needs to see all assets.

**Recommendation:**
- **Global Assets** (`/assets`): shows all assets across all releases, artists, organization. Filterable by type, release, artist, uploader.
- **Release Assets** (within `/releases/[id]/deliverables`): shows only assets scoped to that release.
- **Artist Assets** (within `/artists/[id]/assets`): shows only assets scoped to that artist.
- Assets are stored once, tagged with scope. The same URL pattern serves both contexts.

---

### PDP-005: Home Route Implementation

**Missing Specification:** The PDS defines Home as the landing page after sign-in, containing the Operations Center as its hero. It does not specify whether Home is a single page or a layout with sub-routes.

**Why Required:** Home contains 7 distinct sections (Operations Center, Attention, Your Work, Release Health, Pipeline, Recent Activity, Quick Actions). This could be one scrollable page or tabbed sections.

**Recommendation:** Single scrollable page (`/`) with all sections stacked vertically. Implementation:
- **Z1:** Attention Banner + Alerts (collapsed "Since you were away" after first view)
- **Z2:** Release Health Table (Hero Component)
- **Z3:** Pipeline (release stages summary)
- **Z4:** Your Work (assigned tasks)
- **Z5:** Recent Activity
- **Z6:** Quick Actions (floating bar)

No sub-routes. All data visible in one viewport + scroll. Per PDS-11 dashboard density review: "Operations Center achieves Excellent — PM understands platform health in 30 seconds."

---

### PDP-006: Notification Center Routing

**Missing Specification:** PDS-03 mentions "Notifications" as part of Work. PDS-08 mentions a Notification slide-out panel. The PDS does not specify whether notifications have a full-page view or are only accessible via the slide-out panel.

**Why Required:** Users may want to view all notifications, filter by type, or mark all as read.

**Recommendation:**
- **Slide-out panel:** accessible from Topbar bell icon (any page). Shows recent 20 notifications with "View All" link.
- **Full-page view:** `/work/notifications` (within Work context). Shows all notifications with filters (type, release, date).
- Consistent with the principle that slide-outs preserve context; full pages provide depth.

---

## 9. Compliance Verification

### 9.1 PDS-03 Validation

| Rule | Status |
|------|--------|
| IA-001: The Release is the Centre | ✅ All pages trace to releases |
| 7 primary destinations | ❌ Current: 8 items, wrong names. Proposed: 7 correct |
| Release Workspace tabs (10) | ❌ Current: 4 tabs. Proposed: 10 tabs |
| Artists workspace tabs (8) | ❌ Current: 1 page. Proposed: 8 tabs |
| NR-001: Max 7 primary nav items | ❌ Violated (8 items). Proposed fix aligns |
| NR-002: Every nav item represents real-world object | ⚠ Campaigns, Operations, Approvals are not core objects |
| NR-003: Settings never appear inside operational workflows | ✅ Release settings tab is separate from Administration |
| NR-004: Operational information never appears inside Administration | ✅ Proposed Administration is purely config |
| NR-005: Every page belongs to exactly one primary object | ❌ Brief, Rights Holders violate this |
| NR-006: Users should never ask "Where should I go?" | ⚠ Current structure creates ambiguity |

### 9.2 PDS-11A Validation

| Rule | Status |
|------|--------|
| Core objects: Organization, People, Artists, Releases, Assets, Work | ✅ All represented |
| Organization owns data, does not create music | ✅ |
| People are collaborators, not employees | ✅ |
| Artists may appear on many Releases | ⚠ Junction model incomplete |
| Nothing operational exists outside a Release | ❌ Campaigns, Budgets, Rights currently exist outside |
| Work always belongs to Person → Release, never directly to Organization | ✅ |
| Activity is immutable | ✅ |
| Operational Intelligence never stores data | ✅ |

### 9.3 PDS-12 Validation

| Rule | Status |
|------|--------|
| SA-001: Universal screen structure (Shell → Header → Summary → Action → Hero → Supporting → Activity → Footer) | ⚠ Not yet implemented |
| SA-002: Application Shell persistent | ✅ Current AppShell component |
| SA-003: Every screen has a header | ⚠ Inconsistent across pages |
| SA-004: Operational Summary below header | ❌ Missing on most pages |
| SA-005: Exactly one Hero Component per screen | ❌ Not enforced |
| SA-007: Context Rail on major workspaces | ❌ Missing component |
| SA-009: Primary action top-right | ⚠ Inconsistent |
| SA-013: Operations Center blueprint | ⚠ Defined but not implemented |
| SA-014: Release Workspace blueprint | ⚠ Defined but not implemented |
| SA-020: Empty state on every screen | ⚠ Some screens have empty states, not all |
| SA-021: Loading preserves layout (skeletons) | ⚠ Partial implementation |

---

## 10. Implementation Priority

### Phase 1 — Foundation (Tier 1 from Screen Priority Matrix)
1. Rename `/dashboard` → `/` (Home), consolidate Operations Center
2. Rename `/contributor` → `/work`
3. Add `/releases/[id]/workflow`, `/releases/[id]/tasks`, `/releases/[id]/deliverables`, `/releases/[id]/activity` tabs
4. Add `/work` page with My Tasks + Reviews + Approvals
5. Add Onboarding flow `/onboarding/invite`, `/onboarding/done`

### Phase 2 — Resource Objects (Tier 2)
6. Add `/assets` and `/assets/[id]`
7. Add `/people` and `/people/[id]`

### Phase 3 — Administration Consolidation (Tier 3)
8. Consolidate `/organizations`, `/audit`, `/diagnostics` → `/administration/*`
9. Add `/administration/members`, `/administration/roles`, `/administration/permissions`, `/administration/settings`

### Phase 4 — Release Workspace Completion (Tier 3)
10. Add `/releases/[id]/distribution`, `/releases/[id]/rights`, `/releases/[id]/settings`
11. Migrate `/campaigns` → `/releases/[id]/campaigns`
12. Migrate `/budgets` → `/releases/[id]/budget`
13. Migrate `/rights-holders` → within `/releases/[id]/rights`

### Phase 5 — Artist Workspace
14. Add `/artists/[id]/discography`, `/artists/[id]/assets`, `/artists/[id]/credits`, `/artists/[id]/rights`, `/artists/[id]/people`, `/artists/[id]/activity`

---

## 11. Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| Every screen belongs to one primary object | ✅ Proposed architecture: 100% compliance |
| No orphan pages | ✅ All current orphans reassigned |
| No duplicate navigation | ✅ 7 primary items, no overlap |
| No invented structure | ✅ All structure derived from PDS-03, PDS-11A, PDS-12 |
