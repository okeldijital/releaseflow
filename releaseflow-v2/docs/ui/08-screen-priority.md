# 08 — Screen Priority Matrix

## Purpose

Defines build order for implementation. Tier 1 screens are built first.
They form the minimum viable experience. Tier 2 extends functionality.
Tier 3 completes the product.

Priority is driven by:
1. **Frequency of use** — How often a real user visits this screen
2. **Dependency** — Other screens depend on this being built first
3. **Role coverage** — Ensures every persona has a working experience

---

## Tier 1 — Must Build First

These screens form the core loop. Without them, the product is not
functional for any persona.

### T1 Operations Center

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 59 | `/operations` | PM, Admin |

**Why first:** The PM's landing page. Without it, PMs have no way to
understand what's happening across releases. Every other screen feeds
data into this one.

**Dependencies:** None (aggregates data from all other screens, but
can be built with mock data first).

### T1 Release Workspace

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 12, 14 | `/releases/[id]` → `/releases/[id]/overview` | PM, A&R, Artist |

**Why first:** The single most-used screen. Every user interacts with
a release. This is where work happens.

**Sub-screens (all T1):**
- Overview tab (doc 14) — release pulse, progress, deadlines
- Tracks tab (docs 12, 13) — track listing and metadata
- Workflow tab (doc 28) — stage pipeline
- Stage Detail panel (doc 29) — per-stage info
- Task Board (doc 31) — kanban per stage
- Task Detail panel (doc 32)
- Status badge dropdown (BS-102 resolution 1)

**Dependencies:** None (can be built with a single release as test data).

### T1 Contributor Home

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 42 | `/home` | Producer, Mix Engineer, Designer, Artist |

**Why first:** Ensures technical contributors have a working experience
on day one. Without this, Producers/Engineers/Designers see the wrong
dashboard.

**Dependencies:** Release Workspace (tasks must exist before they can be
shown on the home page).

### T1 App Shell

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 19 | All routes | All |

**Why first:** Every screen sits inside the app shell. Must exist before
any other screen can be tested in context.

**Components:**
- Sidebar navigation (org-level)
- Top navigation (logo, search, notifications, avatar)
- Responsive bottom tab bar (mobile)
- Role-based landing page routing (BS-102 resolution 2)
- Notification center panel (doc 41)
- Empty state component (doc 71, shared pattern)

**Dependencies:** None (pure UI, no data required).

---

## Tier 2 — Core Workflows

These screens extend Tier 1 with the primary work functions. The product
is functional without them, but workflows are incomplete.

### T2 Task Management (extensions)

| Doc | Description |
|-----|-------------|
| 20 (Tasks Board) | Cross-release task board at `/tasks` |
| 31 | Task Board within a stage (already in T1) |

The cross-release task board is T2. The per-stage task board is T1.

### T2 Deliverable Workspace

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 34 | `/releases/[id]/deliverables` | PM, Contributor |

**Why second:** Contributors need to upload files. PMs need to see what's
delivered. This is the bridge between tasks and actual output.

**Sub-screens:**
- Deliverable status by category (Artwork, Audio, Video, Marketing, Distribution)
- Add deliverable modal
- Version history (doc 36)

**Dependencies:** Release Workspace (deliverables belong to a release).

### T2 Approval Flow

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 35, 40 | Via notification / stage detail | A&R, Artist, Admin |

**Why second:** Approvals gate progress. Without them, stages advance
automatically — useful for V1 testing but not the real product.

**Components:**
- Review panel (doc 35)
- Approval decision dialogs (Approve / Request Changes / Reject)
- Approval queue in A&R dashboard (BS-102 resolution 2)
- Approval SLA tracking (doc 40)

**Dependencies:** Release Workspace (stages exist), Task Board (tasks
drive stage advancement).

### T2 Assets

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| — | `/assets`, `/assets/[id]` | All |

**Why second:** File management is essential for production work but not
blocking for the initial release pipeline. Tracks can be created without
assets in V1.

**Components:**
- Asset catalog (global view)
- Asset detail (version history, download)
- Asset upload with versioning (doc 36)
- Asset thumbnails (doc 22, C-29)

**Dependencies:** Deliverable Workspace (assets are the files behind
deliverables).

---

## Tier 3 — Complete Product

These screens make the product feature-complete. They add distribution,
campaigns, budgets, artists, and settings.

### T3 Artists

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 49 | `/artists`, `/artists/[id]` | PM, Admin |

**Why third:** Artists are referenced by releases, but releases can
function with free-text artist names in V1/V2. The full artist entity
with workspace, completeness, and credits manager comes later.

**Sub-screens:**
- Artist catalog
- Artist Workspace (6 tabs: Overview, Releases, Credits, Assets, Campaigns, Press Kit)
- Artist Completeness (doc 50)
- Credits Manager (doc 51)

**Dependencies:** Release Workspace (artist appears on releases).

### T3 Campaigns

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 46, 47, 48 | `/releases/[id]/campaign`, `/marketing` | Marketing, PM |

**Why third:** Campaigns are valuable but not essential for shipping
releases. Many labels do marketing outside ReleaseFlow.

**Sub-screens:**
- Campaign Workspace (4 tabs: Assets, Schedule, Channels, Checklist)
- Promotion Calendar (doc 47)
- Campaign Health (doc 48)
- Marketing Hub (list of all campaigns)

**Dependencies:** Release Workspace, Assets (campaign assets are global
assets scoped to a campaign).

### T3 Budgets

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 55, 56 | `/releases/[id]/budget` | PM, Admin |

**Why third:** Budget tracking is important for label operations but not
blocking for the creative pipeline.

**Sub-screens:**
- Budget Workspace (5 tabs: Overview, Budget, Costs, Forecast, Vendors)
- Cost Tracking (doc 56)
- Resource Planning Board (doc 57)
- Release Operations Dashboard (doc 58)
- Executive Dashboard (doc 60)

**Dependencies:** Release Workspace (budget is per release).

### T3 Settings

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 26 | `/settings/**` | Admin, Owner |

**Why third:** Org configuration is important but not used day-to-day.
Most settings are set once.

**Sub-screens:**
- Organization Profile
- Team Management
- Workflow Configuration
- Release Templates
- Integrations (DSP connections, webhooks, API keys)
- Billing
- Account settings

**Dependencies:** App Shell (settings is a section within the sidebar).

### T3 Distribution & Rights

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 43, 44, 45 | `/releases/[id]/distribution` | PM, Admin |

**Why third:** DSP submission is the last step in the pipeline. It can
be deferred while the creative pipeline (T1-T2) is built and tested.

**Sub-screens:**
- Distribution Workspace (5 tabs: Metadata, Tracks, Artwork, Compliance, Packaging)
- DSP Readiness Report (doc 44)
- Delivery Checklist (doc 45)
- Submission confirmation + status dashboard
- Release Monitoring view (post-release)

**Dependencies:** Release Workspace, Deliverables, Assets.

### T3 Rights & Ownership

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 52, 53, 54 | `/releases/[id]/ownership` | PM, Admin |

**Why third:** Rights management is critical for legal compliance but
is the last pre-distribution step. Can be tested with mock data.

**Sub-screens:**
- Ownership Workspace (4 tabs: Master, Publishing, Mechanical, Neighbouring)
- Split Editor (doc 53)
- Rights Readiness (doc 54)

**Dependencies:** Distribution Workspace, Artist Workspace (rights
holders are artists and orgs).

### T3 Dependencies & Blockers

| Doc | Route | Primary Persona |
|-----|-------|----------------|
| 66, 67, 68 | Per release + cross-release | PM, Admin |

**Why third:** Dependency tracking is an optimization — the product
works without it, but PMs managing multiple releases benefit from it.

**Dependencies:** Release Workspace (dependencies link stages and
releases).

---

## Build Order Summary

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  TIER 1 ─────────────────────────────────────────────────────────  │
│                                                                    │
│  App Shell ──→ Release Workspace ──→ Operations Center            │
│     │                    │                                         │
│     └─── Contributor Home                                          │
│                                                                    │
│  TIER 2 ─────────────────────────────────────────────────────────  │
│                                                                    │
│  Deliverables ──→ Approvals ──→ Assets                             │
│                                                                    │
│  TIER 3 ─────────────────────────────────────────────────────────  │
│                                                                    │
│  Artists ──→ Campaigns ──→ Budgets                                 │
│     │                                                               │
│     ├──→ Settings                                                   │
│     │                                                               │
│     └──→ Distribution ──→ Rights ──→ Dependencies                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Screen Count by Tier

| Tier | Screens | Effort |
|------|---------|--------|
| T1 | 4 major + sub-screens | Core foundation |
| T2 | 3 workstreams | Core workflows |
| T3 | 7 workstreams | Feature-complete |
| **Total** | **14 major screens** | |

### Persona Coverage by Tier

| Persona | T1 | T2 | T3 |
|---------|----|----|-----|
| PM | ✅ Full | ✅ Full | ✅ Full |
| Admin | ✅ Full | ✅ Full | ✅ Full |
| A&R | ✅ Core | ✅ Approvals | ✅ Full |
| Artist | ✅ Home | ✅ Deliverables | ✅ Credits |
| Producer | ✅ Home | ✅ Deliverables | ✅ Budget |
| Mix Engineer | ✅ Home | ✅ Deliverables | — |
| Designer | ✅ Home | ✅ Deliverables | — |
| Marketing | — | — | ✅ Campaigns |
| PR | — | — | ✅ Campaigns |
| Viewer | ✅ Dashboard | ✅ View | ✅ View |
| Owner | ✅ Ops Center | ✅ Full | ✅ Executive Dashboard |
