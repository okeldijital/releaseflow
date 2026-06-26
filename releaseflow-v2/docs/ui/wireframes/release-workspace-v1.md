# Release Workspace v1

## Route

`/releases/[id]` → redirects to `/releases/[id]/overview`

## Backend Entities

| Entity | Source |
|--------|--------|
| Release | `releases` doc |
| Stage | `stages` subcollection |
| Task | `tasks` subcollection |
| Deliverable | `deliverables` subcollection |
| Dependency | `dependencies` subcollection |
| Track | `tracks` subcollection |
| Contributor | `contributors` subcollection |
| Asset | `assets` subcollection |
| Budget | `budgets` subcollection (computed) |
| Campaign | `campaigns` subcollection |
| Activity | `activity` subcollection |
| DSP Submission | `submissions` subcollection |

---

## Wireframe — Shell

```
┌──────────────────────────────────────────────────────────────────────────┐
│  release layout                                                           │
│                                                                           │
│  ┌─────────────────┐                                                      │
│  │ Sidebar          │  ┌────────────────────────────────────────────────┐ │
│  │ (release mode)   │  │  Top Nav                          🔔 (3)  👤   │ │
│  │                  │  │                                                │ │
│  │  ◀ Back to Rel.  │  │  ◀ Back to Releases                            │ │
│  │                  │  │                                                │ │
│  │  ─ Lua ───────   │  │  Lua  EP · Kinn Timo                           │ │
│  │                  │  │  ┌───────────┐ ┌───────────────┐               │ │
│  │  ◆ Overview      │  │  │ PRODUCTION│ │ 🟡 AT RISK    │               │ │
│  │  ▸ Workflow      │  │  └───────────┘ └───────────────┘               │ │
│  │  ▸ Tasks         │  │                                                │ │
│  │  ▸ Deliverables  │  │  ┌────────┬────────┬───────┬───────┬───────┐  │ │
│  │  ▸ Dependencies  │  │  │●Overview│○Workflw│○Tasks │○Deliv │○Depen │  │ │
│  │  ▸ Distribution  │  │  └────────┴────────┴───────┴───────┴───────┘  │ │
│  │  ▸ Campaigns     │  │  ┌───────┬───────┬───────┬───────┬──────────┐  │ │
│  │  ▸ Budget        │  │  │○Distrib│○Campgn│○Budget│○Activ │○Settings │  │ │
│  │  ▸ Activity      │  │  └───────┴───────┴───────┴───────┴──────────┘  │ │
│  │  ▸ Settings      │  │                                                │ │
│  │                  │  │  [Active tab content — changes per tab]        │ │
│  │                  │  │                                                │ │
│  │  ─────────────── │  └────────────────────────────────────────────────┘ │
│  │  Acme Records ▼  │                                                      │
│  └─────────────────┘                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Tab Bar

10 tabs. Active tab has primary bottom border + bold text.

```
┌────────┬────────┬───────┬───────┬───────┬───────┬───────┬───────┬──────┬────────┐
│●Overview│○Workflw│○Tasks │○Deliv │○Depen │○Distrib│○Campgn│○Budget│○Activ│○Settings│
└────────┴────────┴───────┴───────┴───────┴───────┴───────┴───────┴──────┴────────┘
```

### Status Badge Dropdown

Clicking the release status badge opens allowed transitions:

```
┌───────────┐
│ PRODUCTION│  ← Current state
│     ▼     │
└───────────┘
      │
      ▼
┌──────────────────┐
│  Put on Hold     │  ← Available transitions
│  Mark Ready      │
│  ─────────────── │
│  Cancel Release  │  ← Destructive (confirmation)
└──────────────────┘
```

### Readiness Badge

Alongside the status badge. Shows readiness (doc 37). Non-interactive.

```
┌───────────────┐
│ 🟡 AT RISK    │
└───────────────┘
```

---

## Tab Content

### 1. Overview

```
┌─ Overview ────────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 📊 Progress│ │ 🎵 Tracks│ │ 👥 Contr.│ │ ☑ Tasks  │ │ ⚠ Pending│  │
│  │   57%      │ │    5     │ │    4     │ │    8     │ │    3     │  │
│  └───────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                        │
│  ── Stage Pipeline ────────────────────────────────────────────────   │
│  Plan   Prod   Mix    Mast   Art   Dist   Release                      │
│  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐                             │
│  │✓ │→ │✓ │→ │✓ │→ │◉ │→ │○ │→ │○ │→ │○ │                            │
│  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘                             │
│                                                                        │
│  ── Upcoming Deadlines ─────────────────────────────────────────────   │
│  🔴 Aug 20 · Mastering · 5d ago · Sam Wilson                          │
│  🟡 Aug 25 · Artwork start · Today · Taylor                           │
│  🟢 Sep 01 · Artwork due · 7 days · Taylor                             │
│                                                                        │
│  ── Pending Tasks ──────────────────────────────────────────────────   │
│  ☐ Book mastering session          👤 Alex PM  · Aug 18 🔴            │
│  ☐ Upload cover art v1             👤 Taylor   · Sep 01 🟢            │
│  ☐ Confirm track list final         👤 Alex PM  · Aug 15 ✅           │
│                                                                        │
│  ── Quick Actions ──────────────────────────────────────────────────   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                │
│  │ + Add Task│ │ + Upload │ │ + Invite │                                │
│  └──────────┘ └──────────┘ └──────────┘                                │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Workflow

```
┌─ Workflow ────────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ PLANNING │ │PRODUCTION│ │  MIXING  │ │MASTERING │  ...             │
│  │    ✓     │ │    ✓     │ │    ✓     │ │    ◉     │                  │
│  │ 5/5 done │ │ 8/8 done │ │ 6/6 done │ │  1/4 done│                  │
│  │          │ │          │ │          │ │          │                  │
│  │ [View]   │ │ [View]   │ │ [View]   │ │ [Tasks]  │                  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                  │
│                                                                        │
│  ← scroll arrows for remaining columns →                              │
│                                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                               │
│  │ ARTWORK  │ │DISTRIB.. │ │ RELEASE  │                                │
│  │    ○     │ │    ○     │ │    ○     │                                │
│  │  0/3 done│ │  0/5 done│ │  0/2 done│                                │
│  │          │ │          │ │          │                                │
│  │ [View]   │ │ [View]   │ │ [View]   │                                │
│  └──────────┘ └──────────┘ └──────────┘                                │
└────────────────────────────────────────────────────────────────────────┘
```

### 3. Tasks

```
┌─ Tasks ───────────────────────────────────────────────────────────────┐
│                                                                        │
│  Filter: [All Stages ▼]  [All Statuses ▼]  [Assigned ▼]              │
│                                                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ ○ TO DO (3)  │ │ ◉ IN PROG (2)│ │ ◐ REVIEW (1) │ │ ✓ DONE (14) │ │
│  │              │ │              │ │              │ │              │ │
│  │ EQ drum stem │ │ Level stems  │ │ Rough mix    │ │ Import stems │ │
│  │ 👤 Sam W     │ │ 👤 Sam W     │ │ approve      │ │ 👤 Sam W     │ │
│  │ 🏷 Mastering │ │ 🏷 Mastering │ │ 👤 Sam A&R   │ │ 🏷 Mixing    │ │
│  │ Aug 25 🔴    │ │ Aug 28 🟡    │ │ 🏷 Mastering │ │ Aug 12 ✅    │ │
│  │              │ │              │ │ Aug 30 🟢    │ │              │ │
│  │ + Add task   │ │              │ │              │ │ ...          │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 4. Deliverables

```
┌─ Deliverables ────────────────────────────────────────────────────────┐
│                                                                        │
│  Grouping: [Audio ▼]                                                   │
│                                                                        │
│  ── Audio ──────────────────────────────────── 4 of 5 met ─────────    │
│                                                                        │
│  ✓ Raw stems (per track)          👤 Producer Z   · all 5 delivered   │
│  ✓ Stereo mix (per track)         👤 Sam W        · all 5 delivered   │
│  ◐ Master file (per track)        👤 Sam W        · 4 of 5 delivered  │
│  ○ Instrumental (optional)         👤 Producer Z   · not started       │
│                                                                        │
│  ── Artwork ────────────────────────────────── 1 of 1 met ────────    │
│                                                                        │
│  ✓ Cover art                      👤 Taylor       · v3 approved       │
└────────────────────────────────────────────────────────────────────────┘
```

### 5. Dependencies

```
┌─ Dependencies ────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 🔴 Mechanical License · Melodic Pub · 12 days blocked            │ │
│  │    Blocking: Distribution, Track 3 (Eclipse), Track 4 (Horizon)  │ │
│  │    Contacted 3 times · No response · Owner: Alex PM              │ │
│  │    ┌──────────┐ ┌──────────┐ ┌──────────┐                        │ │
│  │    │ Follow Up│ │ Escalate │ │  Resolve │                        │ │
│  │    └──────────┘ └──────────┘ └──────────┘                        │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ ✓ Cover Art approved → Canvas unblocked · Auto-resolved          │ │
│  │ 🟡 Sam W capacity · 5 releases · Warning                         │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────┐             │
│  │  + Add Dependency                                     │             │
│  └──────────────────────────────────────────────────────┘             │
└────────────────────────────────────────────────────────────────────────┘
```

### 6. Distribution

```
┌─ Distribution ────────────────────────────────────────────────────────┐
│                                                                        │
│  Tabs: [Metadata] [Tracks] [Artwork] [Compliance] [Packaging]         │
│                                                                        │
│  ── Metadata ───────────────────────────────────────────────────────   │
│                                                                        │
│  Title ✓ · Genre ✓ · Label ✓ · Date ✓                                 │
│  UPC ✕ (missing) · Copyright ℗ ✕ · Copyright © ✕                    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────┐             │
│  │  Run DSP Readiness Report                             │             │
│  └──────────────────────────────────────────────────────┘             │
│                                                                        │
│  Result: 🔴 NOT READY · 3 critical issues                             │
└────────────────────────────────────────────────────────────────────────┘
```

### 7. Campaigns

```
┌─ Campaign ────────────────────────────────────────────────────────────┐
│                                                                        │
│  Lua Release Campaign · 🟢 On Track · Active                          │
│                                                                        │
│  Tabs: [Assets] [Schedule] [Channels] [Checklist]                     │
│                                                                        │
│  ── Schedule ───────────────────────────────────────────────────────   │
│                                                                        │
│  T-45  Oct 01 ──── Campaign kickoff                          ✓ Done   │
│  T-30  Oct 15 ──── Social assets deadline                   ✓ Done   │
│  T-14  Nov 01 ──── Pre-save campaign launch                 ◐ Active  │
│  T-7   Nov 08 ──── Press outreach                            ○ Pend   │
│        Nov 15 ──── ★ RELEASE DAY                             ○ Pend   │
│  +7    Nov 22 ──── Engagement report                          ○ Pend   │
│  +14   Nov 29 ──── Campaign close                             ○ Pend   │
└────────────────────────────────────────────────────────────────────────┘
```

### 8. Budget

```
┌─ Budget ──────────────────────────────────────────────────────────────┐
│                                                                        │
│  Tabs: [Overview] [Budget] [Costs] [Forecast] [Vendors]               │
│                                                                        │
│  ── Overview ───────────────────────────────────────────────────────   │
│                                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ 💰 $15K  │ │ 📉 $8.2K │ │ 📊 $6.8K │ │ ⚠ +$3K  │                │
│  │ Budget   │ │ Spent    │ │ Remain   │ │ Over     │                │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                │
│                                                                        │
│  Studio   $5,000  ████████████████████░░░░  80% · 🟢                 │
│  Mixing   $3,000  ████████████████░░░░░░░░  65% · 🟢                 │
│  Mastering$2,000  ████████████████████████  95% · 🟡                 │
│  Artwork  $1,000  ████████████████████████  100% · ✓                 │
│  Advert.  $4,000  ░░░░░░░░░░░░░░░░░░░░░░░░  0% · 🔴 +$3K forecast  │
└────────────────────────────────────────────────────────────────────────┘
```

### 9. Activity

```
┌─ Activity ────────────────────────────────────────────────────────────┐
│                                                                        │
│  🔵 Aug 25 · Production → Mixing (auto-advanced)                      │
│  🟢 Aug 25 · Alex completed "Finalize stems"                          │
│  💬 Aug 24 · Sam A&R: "Mix levels look clean"                         │
│  🔴 Aug 23 · Alert: Advertising budget exceeded                       │
│  🟡 Aug 22 · Blocker added: Mechanical License · Melodic Pub          │
│  👤 Aug 22 · Taylor assigned as Artwork Designer                      │
│  🔵 Aug 20 · DRAFT → PLANNING                                         │
│                                                                        │
│  ── Older ───────────────────────────────────────────────────────────  │
│  🟢 Aug 18 · 5 tracks created                                         │
│  👤 Aug 18 · Kinn Timo added as Primary Artist                        │
│  🟢 Aug 18 · Release created                                           │
│                                                                        │
│  Showing 9 of 27 events · [Load more]                                  │
└────────────────────────────────────────────────────────────────────────┘
```

### 10. Settings

```
┌─ Settings ────────────────────────────────────────────────────────────┐
│                                                                        │
│  Release metadata                                                      │
│  ┌──────────────────────────────────────────────────┐                 │
│  │ Title      │ Lua – The Fading Light              │                 │
│  │ Type       │ EP                                  │                 │
│  │ Genre      │ Afro Tech                           │                 │
│  │ Date       │ Nov 15, 2026                        │                 │
│  │ Label      │ Acme Records                        │                 │
│  │ UPC        │ ...                          [Edit] │                 │
│  └──────────────────────────────────────────────────┘                 │
│                                                                        │
│  ── Actions ────────────────────────────────────────────────────────   │
│                                                                        │
│  ┌──────────────────┐ ┌──────────────────┐                             │
│  │  Change Template  │ │  Archive Release  │                            │
│  └──────────────────┘ └──────────────────┘                             │
│                                                                        │
│  ⚠ Archiving is permanent. This release cannot be edited afterward.   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## States

| State | Condition | Visual |
|-------|-----------|--------|
| Default (with data) | Release exists with stages, tasks, deliverables | Full layout per tab |
| Empty (new release) | DRAFT, 0 tasks, 0 deliverables | Empty states per tab (doc 71) |
| Loading | Data fetching | Skeleton per active tab |
| Not Found | Release ID invalid | "Release not found. [Back to Releases]" |
| Permission Denied | User lacks `release:view` | "You don't have access to this release." |
| Archived | Status = ARCHIVED | All tabs read-only. Banner: "This release is archived." |
| Cancelled | Status = CANCELLED | All tabs read-only. Banner: "This release was cancelled." |

---

## Responsive

| Breakpoint | Tab Bar | Content |
|------------|---------|---------|
| ≥1280px | 10 tabs with icons + labels (2 rows) | Full layout |
| 1024–1279px | 10 tabs, horizontal scroll | Full layout |
| 768–1023px | Icons + abbreviated labels (8 chars), scroll | Content stacks where needed |
| <768px | Icons only, horizontal scroll. "More" dropdown for overflow. Bottom tab bar for main nav. | Stacks everywhere. Pipeline → dots. Table → cards. |
