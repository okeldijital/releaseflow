# TASK-3202 — Blocker Dashboard

## Concept

A cross-release dashboard showing everything that is currently blocked —
across all releases, all stages, all dependencies. The PM opens this when
they need to answer: *"What's stuck, and what do I need to unstick?"*

This is the action-oriented sibling of the Dependency Workspace
(TASK-3201). That workspace defines and visualizes dependencies. This
dashboard monitors blocked items and drives resolution.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Blocker Dashboard                                         5 items stuck  │
│                                                                           │
│  ─── Blocked: External (1) ────────────────────────────────────────────   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  🔴 Mechanical License · Melodic Publishing                         │ │
│  │     Blocking: Lua – Distribution stage + Tracks 3, 4               │ │
│  │     Blocked for 14 days · Contacted 3 times · No response           │ │
│  │     Owner: Alex PM                                                  │ │
│  │                                                                      │ │
│  │     Contact log:                                                     │ │
│  │     Aug 15 — Emailed legal@melodicpublishing.com                    │ │
│  │     Aug 20 — Follow-up email, no response                           │ │
│  │     Aug 25 — Called +1-555-0100, left voicemail                    │ │
│  │                                                                      │ │
│  │     ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │ │
│  │     │ Follow Up│ │ Escalate │ │ Reassign │ │  View    │            │ │
│  │     └──────────┘ └──────────┘ └──────────┘ └──────────┘            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Blocked: Approval (1) ────────────────────────────────────────────   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  🔴 Cover Art v3 — Awaiting A&R Approval                             │ │
│  │     Blocking: Midnight Sessions — Artwork stage                     │ │
│  │     Blocked for 6 days · SLA was Aug 12 (4 days overdue)            │ │
│  │     Reviewer: Sam A&R                                                │ │
│  │     Submitter: Taylor (Designer) · Submitted Aug 10                 │ │
│  │                                                                      │ │
│  │     ┌──────────┐ ┌──────────┐ ┌──────────┐                          │ │
│  │     │  Nudge   │ │ Reassign │ │  View    │                          │ │
│  │     └──────────┘ └──────────┘ └──────────┘                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Blocked: Contributor (1) ────────────────────────────────────────    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  🟡 Sam Wilson — Mix Engineer — 5 releases                           │ │
│  │     Blocking: Lua Mixing (overdue), Summer EP Mixing, Lost Tracks   │ │
│  │     Capacity: 5 active · 3 overdue · 2 pending                       │ │
│  │                                                                      │ │
│  │     ┌──────────┐ ┌──────────┐                                        │ │
│  │     │Redistribute│ │  View    │                                        │ │
│  │     └──────────┘ └──────────┘                                        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Blocked: Stage (1) ──────────────────────────────────────────────    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  🔴 Mastering — Lua                                                  │ │
│  │     Blocked by: Mixing stage (pending A&R approval)                 │ │
│  │     Blocked for 3 days · Cascade risk: Distribution date compressed │ │
│  │     Next stage: Artwork (Sep 01 deadline) will be delayed           │ │
│  │                                                                      │ │
│  │     ┌──────────┐ ┌──────────┐                                        │ │
│  │     │  Nudge   │ │  View    │                                        │ │
│  │     └──────────┘ └──────────┘                                        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Blocked: Budget (1) ─────────────────────────────────────────────    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  🔴 Advertising budget overage — Lua                                │ │
│  │     Planned: $4,000 · Allocated: $1,000 · Overage: $3,000          │ │
│  │     Blocked for 5 days · Budget lines: Advertising, Contingency     │ │
│  │     Options: Pull $1,000 from contingency + find $2,000 elsewhere   │ │
│  │                                                                      │ │
│  │     ┌──────────┐ ┌──────────┐                                        │ │
│  │     │  Adjust  │ │ Escalate │                                        │ │
│  │     └──────────┘ └──────────┘                                        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Summary ──────────────────────────────────────────────────────────   │
│  5 items blocked · 2 releases affected · 14 days avg block duration      │
│  Lua: 3 blockers (license, capacity, budget) · Midnight Sessions: 1     │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Auto-resolve: 0    Needs human action: 5                         │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Blocker Categories

| Category | Icon | Examples |
|----------|------|----------|
| External | 🔴 | Mechanical license, rights clearance, third-party delivery |
| Approval | 🔴 | A&R hasn't reviewed, Artist hasn't approved mix |
| Contributor | 🟡 | Overloaded, unavailable, unassigned |
| Stage | 🔴 | Stage blocked by upstream dependency |
| Budget | 🔴 | Over budget, unapproved cost, allocation needed |
| System | 🔴 | ISRC pool exhausted, DSP connection down |

---

## Blocker Card Anatomy

```
┌──────────────────────────────────────────────────────────────────────┐
│  🔴 [Severity] [Title]                                               │
│                                                                       │
│  Blocking: [what's stuck — release, stage, tracks]                   │
│  Blocked for: [N days] · [status detail]                              │
│  Owner: [who is responsible]                                          │
│                                                                       │
│  [Context — contact log, SLA status, cascade impact]                 │
│                                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ [Primary] │ │ Escalate │ │ Reassign │ │  View    │                │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                │
└──────────────────────────────────────────────────────────────────────┘
```

### Primary Action by Category

| Category | Primary Action |
|----------|---------------|
| External | Follow Up (logs contact attempt, schedules reminder) |
| Approval | Nudge Reviewer (sends notification to reviewer) |
| Contributor | Redistribute (opens Resource Planning Board) |
| Stage | Nudge Stage Owner |
| Budget | Adjust (opens Budget Workspace) |

---

## Cascade Impact

When a stage is blocked, the Blocker Dashboard shows what downstream
stages are affected:

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠ Cascade Impact                                                 │
│                                                                   │
│  If Mastering is not resolved by Aug 20:                          │
│  • Artwork deadline (Sep 01) is still safe                        │
│  • Distribution start (Sep 15) compresses from 14 days to 10     │
│  • Release readiness check (Oct 01) at risk — only 10 days       │
│    for distribution instead of 14                                  │
│                                                                   │
│  If not resolved by Sep 01:                                       │
│  • Artwork + Distribution must run in parallel — risky             │
│  • Release date (Nov 15) may need to shift                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Escalation

Clicking "Escalate" on a blocker:

```
┌──────────────────────────────────────────────────┐
│  Escalate: Mechanical License — Melodic Pub       │
│                                                    │
│  Current owner: Alex PM                           │
│  Blocked for 14 days · 3 contact attempts         │
│                                                    │
│  Escalate to:                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │ 👤 Jane Admin                         ▼      │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Reason *                                            │
│  ┌──────────────────────────────────────────────┐  │
│  │ We've contacted Melodic Publishing 3 times   │  │
│  │ with no response. This is blocking Lua from │  │
│  │ shipping. Need legal to step in.            │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────┐ ┌──────────┐                │
│  │  Escalate        │ │  Cancel  │                │
│  └──────────────────┘ └──────────┘                │
└──────────────────────────────────────────────────┘
```

Escalation reassigns the blocker owner and sends a Critical alert
(doc 61) to the new owner.

---

## Auto-Resolution

Some blockers resolve automatically when the underlying condition clears:

| Blocker Type | Auto-Resolution Trigger |
|-------------|------------------------|
| Stage blocked by upstream | Upstream stage → COMPLETED |
| Approval pending | Reviewer approves or rejects |
| Contributor capacity | Contributor completes tasks, drops below threshold |
| Budget overage | Budget adjusted to cover planned spend |

When auto-resolved, the blocker moves to "Recently Resolved" with a brief
animation and disappears after 24 hours.

---

## Filtering

```
┌──────────────────────────────────────────────────────────────┐
│  Release: ◉ All  ○ Lua  ○ Midnight Sessions  ○ Summer EP   │
│  Category: ◉ All  ○ External  ○ Approval  ○ Stage          │
│           ○ Contributor  ○ Budget                           │
│  Age: ◉ All  ○ >7 days  ○ >14 days  ○ >30 days             │
│  Owner: ◉ All  ○ Me  ○ Unassigned                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface BlockerDashboard {
  orgId: string;
  blockers: Blocker[];
  affectedReleases: number;
  averageBlockDuration: number;  // Days
  filters: BlockerFilters;
}

interface Blocker {
  id: string;
  category: 'external' | 'approval' | 'contributor' | 'stage' | 'budget' | 'system';
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  blocking: {
    releaseId: string;
    releaseName: string;
    entityType: string;        // "stage", "deliverable", "track", "distribution"
    entityName: string;
  }[];
  blockedSince: Timestamp;
  duration: number;            // Days
  owner?: { id: string; name: string };
  contactLog?: ContactAttempt[];  // For external blockers
  cascadeImpact?: CascadeForecast;
  primaryAction: BlockerAction;
  autoResolvable: boolean;
  resolutionCondition?: string; // "Upstream stage COMPLETED", "Budget adjusted"
}

interface CascadeForecast {
  affectedStages: {
    stageName: string;
    originalStart: Timestamp;
    delayedStart: Timestamp;
    compressionDays: number;   // How many days are lost
  }[];
  releaseDateAtRisk: boolean;
  recommendedAction: string;   // "Fast-track Artwork", "Shift release date"
}

interface BlockerAction {
  label: string;               // "Follow Up", "Nudge Reviewer", "Adjust"
  actionType: 'follow_up' | 'nudge' | 'escalate' | 'reassign' | 'adjust' | 'view';
  payload: Record<string, string>;
}

interface BlockerFilters {
  releaseId?: string;
  category?: string;
  age?: '>7' | '>14' | '>30';
  owner?: 'me' | 'unassigned' | 'all';
}
```
