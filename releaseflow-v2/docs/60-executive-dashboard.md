# TASK-2802 — Executive Dashboard

## Concept

A dashboard for the Owner or Admin who has 30 seconds to answer one
question: *"What needs attention today?"*

Everything on this page is scannable in half a minute. No tables. No
paragraphs. No drill-down required. Color signals and big numbers.

---

## Product Constraint

No AI-generated summaries. All displayed content comes from deterministic
rules — count thresholds, status checks, and date comparisons.

---

## Layout

Full viewport, no scrolling required. Everything fits on one screen.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ReleaseFlow                            Good morning, Jane    Aug 16, 2026│
│                                                                           │
│  ┌────────────────────────────────────────────────────────┐ ┌───────────┐│
│  │                                                        │ │           ││
│  │  ⚠  ATTENTION NEEDED ON 3 ITEMS                        │ │ 5 ACTIVE  ││
│  │                                                        │ │ RELEASES  ││
│  │  🔴 Advertising budget exceeded — Lua                  │ │           ││
│  │  🔴 Mastering blocked for 3 days — Lua                │ │ 12 TOTAL  ││
│  │  🟡 Sam Wilson overloaded — 5 releases                 │ │           ││
│  │                                                        │ └───────────┘│
│  └────────────────────────────────────────────────────────┘              │
│                                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │              │ │              │ │              │ │              │    │
│  │    🔴 2      │ │    🔴 2      │ │    🟡 1      │ │    🔵 1     │    │
│  │  CRITICAL    │ │   BLOCKED    │ │   OVERDUE    │ │  RELEASED   │    │
│  │   ALERTS     │ │   STAGES     │ │  DEADLINES   │ │  THIS MONTH │    │
│  │              │ │              │ │              │ │              │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                                           │
│  ─── Budget Pulse ──────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │   Lua                         Midnight Sessions                     │ │
│  │   ████████████████████████░   ████████████████████████████████████  │ │
│  │   +$3,000 over               $8,500 · 41% spent                     │ │
│  │                                                                      │ │
│  │   Summer EP                   Lost Tracks                          │ │
│  │   ████████████████░░░░░░░░   ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│  │   $2,000 · 78% spent          $5,000 · 12% spent                    │ │
│  │                                                                      │ │
│  │   Neon Remix                                                         │ │
│  │   ░░░░░░░░░░░░░░░░░░░░░░░░░   $3,000 · 0% spent                     │ │
│  │                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Release Pulse ─────────────────────────────────────────────────────  │
│                                                                           │
│  ┌────────┬─────────┬─────────┬──────────┬─────────┬──────────┬────────┐ │
│  │        │ Progress│ Health  │ Readiness│ Campaign│ Budget   │ Rights │ │
│  │────────┼─────────┼─────────┼──────────┼─────────┼──────────┼────────│ │
│  │ Lua    │ ████ 43%│ 🟢      │ 🔴 Block │ 🟡 Risk │ 🔴 +$3K  │ 🟢     │ │
│  │Mid Ses │ ████ 57%│ 🟢      │ 🔴 Block │ 🟢      │ 🟢       │ 🟢     │ │
│  │SummerEP│ ████ 90%│ 🟢      │ 🟡 Risk  │ 🟢      │ 🟢       │ 🟡     │ │
│  │Lost Trk│ ██░ 15% │ 🟢      │ 🟡 Risk  │ —       │ 🟢       │ 🟢     │ │
│  │Neon Rem│ ░░░  0% │ 🟡      │ 🔴 Block │ —       │ 🟢       │ 🟡     │ │
│  └────────┴─────────┴─────────┴──────────┴─────────┴──────────┴────────┘ │
│                                                                           │
│  🟢🟢🟢🟡🔴   3 healthy · 1 at risk · 1 blocked                           │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 30-Second Scan Order

The layout is hierarchical — the eye moves top to bottom, left to right,
capturing critical info at each stop:

| Seconds | Zone | What the exec learns |
|---------|------|---------------------|
| 0–5s | Attention banner | "3 things need me" — the most critical signal |
| 5–10s | Four stat cards | "2 critical, 2 blocked, 1 overdue" — severity counts |
| 10–20s | Budget pulse | "Lua is over budget" — financial risk at a glance |
| 20–30s | Release pulse | "Lua and Neon Remix are blocked" — per-release status |

After 30 seconds, the exec knows:
- There are 3 items needing attention
- Lua has a budget problem and a blocked stage
- Neon Remix is blocked
- Midnight Sessions and Summer EP are fine

---

## Attention Banner

The most prominent element. Shows when critical items exist. Hidden when
everything is green.

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ⚠  ATTENTION NEEDED ON 3 ITEMS                                │
│                                                                │
│  🔴 Advertising budget exceeded — Lua                          │
│  🔴 Mastering blocked for 3 days — Lua                        │
│  🟡 Sam Wilson overloaded — 5 releases                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

When zero attention items exist:
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ✅  NOTHING NEEDS ATTENTION                                    │
│                                                                │
│  All 5 releases are on track. No blocked stages.              │
│  All budgets within allocation.                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Stat Cards

Four large cards with big numbers. No labels that require reading — the
number is the signal:

```
┌──────────────┐
│              │
│    🔴 2      │   ← The color IS the label
│  CRITICAL    │
│   ALERTS     │
│              │
└──────────────┘
```

Each card:
- Shows the count of items in that category
- Color indicates severity at a glance
- Clicking navigates to the Operations Center filtered to that category

---

## Budget Pulse

Compact bar for each release showing budget status. Green = within budget,
amber = approaching limit (>75% spent), red = over budget.

Each bar shows the release name, current spend %, and absolute numbers.
No drill-down required unless the exec wants details.

---

## Release Pulse

The densest section. One row per active release. Six columns:

| Column | Source | Values |
|--------|--------|--------|
| Release | Name | Truncated if needed |
| Progress | TASK-804 | Bar + % (Completed stages ÷ total) |
| Health | TASK-803 | 🟢 Green / 🟡 Amber / 🔴 Red |
| Readiness | TASK-1601 | 🟢 Ready / 🟡 At Risk / 🔴 Blocked |
| Campaign | TASK-2203 | 🟢 On Track / 🟡 At Risk / 🔴 Delayed / — (none) |
| Budget | TASK-2601 | 🟢 Within / 🟡 >75% spent / 🔴 Over / +$N over |
| Rights | TASK-2603 | 🟢 Cleared / 🟡 Not Cleared / — (not started) |

Each cell is a color dot or a short label. The entire row is scannable in
under 2 seconds.

---

## Empty State (No Releases)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ReleaseFlow                                                   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  ✅  ALL CLEAR                                             │ │
│  │                                                           │ │
│  │  No active releases. Create your first release to get     │ │
│  │  started.                                                 │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  ✚ Create Release                                   │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface ExecutiveDashboard {
  orgId: string;
  attentionItems: AttentionItem[];
  stats: {
    criticalAlerts: number;
    blockedStages: number;
    overdueDeadlines: number;
    releasedThisMonth: number;
  };
  budgetPulse: BudgetPulseItem[];
  releasePulse: ReleasePulseItem[];
  computedAt: Timestamp;
}

interface AttentionItem {
  id: string;
  severity: 'critical' | 'warning';
  title: string;                 // "Advertising budget exceeded"
  releaseName: string;           // "Lua"
  entityUrl: string;
}

interface BudgetPulseItem {
  releaseId: string;
  releaseName: string;
  allocated: number;
  spent: number;
  percentage: number;
  status: 'within' | 'approaching' | 'over';
  variance?: number;             // + over, − under (only if over)
}

interface ReleasePulseItem {
  releaseId: string;
  releaseName: string;
  progress: number;              // 0–100
  health: 'green' | 'amber' | 'red';
  readiness: 'ready' | 'at_risk' | 'blocked';
  campaignHealth?: 'on_track' | 'at_risk' | 'delayed';
  budgetStatus: 'within' | 'approaching' | 'over';
  rightsCleared?: boolean;
}
```
