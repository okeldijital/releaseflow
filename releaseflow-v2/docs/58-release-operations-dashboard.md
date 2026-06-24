# TASK-2604 — Release Operations Dashboard

## Concept

A unified dashboard for the release manager that answers four questions
at a glance:

1. **Budget Status** — Are we over or under budget?
2. **Resource Availability** — Who has capacity?
3. **Upcoming Deadlines** — What's due this week?
4. **Blocked Work** — What's stuck?

This is the command center for PMs running multiple releases.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Release Operations                                        Oct 01 Street  │
│  Midnight Sessions · Single                                               │
│                                                                           │
│  ─── Budget Status ────────────────────────────────────────────────────  │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  💰 Budget   │  │  📉 Spent    │  │  📊 Remaining│  │  ⚠ Over by  │ │
│  │  $8,500      │  │  $3,485      │  │  $5,015      │  │  +$1,000    │ │
│  │  allocated   │  │  41% used    │  │  59% left    │  │  forecast   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                           │
│  Advertising planned $4,000 vs allocated $1,000  [Adjust Budget →]       │
│                                                                           │
│  ─── Resource Availability ────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  👤 Sam Wilson  🔴 5 releases · 3 active · Mixing deadline Fri    │ │
│  │  👤 Taylor      🟡 3 releases · 2 active · Artwork deadline Sep 01│ │
│  │  👤 Producer Z  🟢 1 release  · 0 active · Completed               │ │
│  │  👤 Anna        🟡 2 campaigns · 2 active · Ads due Sep 24         │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Upcoming Deadlines ───────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  🔴 Aug 18   Cover art approval                               3d ago│ │
│  │  🔴 Aug 20   ISRC codes assigned                               1d ago│ │
│  │  🟡 Aug 22   Mix revision deadline                            Today │ │
│  │  🟡 Aug 25   Press release sent to media                    3 days │ │
│  │  🟢 Sep 01   Cover art final version                       10 days │ │
│  │  🟢 Sep 05   Metadata sheet complete                       14 days │ │
│  │  🟢 Sep 15   DSP assets submitted                          24 days │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Blocked Work ──────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  🔴 Mix revision — Waiting on Sam Wilson                            │ │
│  │     Blocked since Aug 15 · 3 days · Owner: Sam (Mix Engineer)      │ │
│  │     ┌──────────┐ ┌──────────┐                                       │ │
│  │     │  Nudge   │ │ Reassign │                                       │ │
│  │     └──────────┘ └──────────┘                                       │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  🔴 Advertising budget overage — No resolution                       │ │
│  │     $4,000 planned vs $1,000 allocated · 3 days                     │ │
│  │     ┌──────────┐ ┌──────────┐                                       │ │
│  │     │  Adjust  │ │ Escalate │                                       │ │
│  │     └──────────┘ └──────────┘                                       │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  🟡 ISRC auto-generation failed — Track 4                            │ │
│  │     Error: registrant pool exhausted. Manual assignment needed.     │ │
│  │     ┌──────────┐                                                     │ │
│  │     │  Assign  │                                                     │ │
│  │     └──────────┘                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Summary ──────────────────────────────────────────────────────────  │
│  🟡 AT RISK · 2 overdue deadlines · 2 blocked items · 1 budget issue    │
│  Recommended: Clear blocked work before adding new tasks.               │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Section 1: Budget Status

Four stat cards showing budget health at a glance:

| Card | Source | Format |
|------|--------|--------|
| Budget | Budget Workspace total | `$8,500 allocated` |
| Spent | Sum of approved costs | `$3,485 · 41% used` |
| Remaining | Budget − Spent | `$5,015 · 59% left` |
| Forecast Variance | Forecast total − Budget | `+$1,000` or `−$500` with color |

If forecast exceeds budget, the variance card is red and shows the
overage. Clicking navigates to the Budget Workspace (TASK-2601).

---

## Section 2: Resource Availability

Compact summary of contributors and their load:

| Status | Condition |
|--------|-----------|
| 🟢 Normal | 0–2 active assignments |
| 🟡 Busy | 3 active assignments |
| 🔴 Overloaded | 4+ active assignments |

Each row shows the contributor, their role, active/total assignments, and
their nearest deadline. Clicking navigates to the Resource Planning Board
(TASK-2603).

---

## Section 3: Upcoming Deadlines

All deadlines from all stages, deliverables, tasks, and checklist items
across the release. Sorted by due date, color-coded:

| Color | Meaning |
|-------|---------|
| 🔴 Overdue | Due date < today |
| 🟡 This week | Due date ≤ today + 7 |
| 🟢 Later | Due date > today + 7 |

Each deadline shows the item name, due date, and days until/since.
Clicking navigates to the entity (stage, deliverable, task, or checklist).

---

## Section 4: Blocked Work

Items that are stuck and need the PM's attention:

| Block Type | Example |
|------------|---------|
| Stage blocked | "Mixing revision — waiting on Sam Wilson for 3 days" |
| Budget conflict | "Advertising overage — $4,000 vs $1,000 allocated" |
| Approval stalled | "Cover art awaiting A&R approval for 4 days" |
| System error | "ISRC auto-generation failed — pool exhausted" |

Each blocked item shows:
- Severity (🔴 critical / 🟡 warning)
- What's blocked and why
- How long it has been blocked
- Owner (who is responsible for resolution)
- Action buttons (Nudge / Reassign / Adjust / Escalate / Assign)

---

## Quick Actions Bar

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐│
│  │+ Add Task│ │+ Add Cost│ │🔄Ressign│ │📋Checklist│ │⚙ Budget    ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘│
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface ReleaseOperationsDashboard {
  releaseId: string;
  budget: BudgetSummary;
  resources: ResourceSummary[];
  deadlines: DeadlineItem[];
  blockedItems: BlockedItem[];
  overallStatus: 'on_track' | 'at_risk' | 'blocked';
}

interface BudgetSummary {
  allocated: number;
  spent: number;
  remaining: number;
  forecastVariance: number;      // + over, − under
  overBudgetCategories: string[];
}

interface ResourceSummary {
  userId: string;
  userName: string;
  role: string;
  activeAssignments: number;
  totalAssignments: number;
  load: 'normal' | 'busy' | 'overloaded';
  nearestDeadline?: Timestamp;
}

interface DeadlineItem {
  id: string;
  type: 'stage' | 'deliverable' | 'task' | 'checklist' | 'milestone';
  title: string;
  dueDate: Timestamp;
  urgency: 'overdue' | 'this_week' | 'later';
  daysDelta: number;             // Negative = overdue, positive = days until
  entityUrl: string;
}

interface BlockedItem {
  id: string;
  type: 'stage_blocked' | 'budget_conflict' | 'approval_stalled' | 'system_error';
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  blockedSince: Timestamp;
  owner: { id: string; name: string };
  actions: BlockedAction[];
}

interface BlockedAction {
  label: string;                 // "Nudge", "Reassign", "Adjust", "Escalate"
  actionUrl: string;
}
```
