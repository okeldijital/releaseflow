# TASK-2801 — Operations Center

## Concept

A cross-release command center for the PM and Admin. Brings together
Alerts, Recommendations, Blocked Work, and Critical Deadlines from every
active release into one view. This is the first screen a PM opens in the
morning.

Unlike the Release Operations Dashboard (TASK-2604) which is per-release,
the Operations Center spans the entire org.

---

## Product Constraint

All alerts, recommendations, and status assessments derive from
deterministic rules — thresholds, deadlines, and status checks. No AI
models. No LLM-generated text. No machine learning.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Operations Center                                          Aug 16, 2026  │
│                                                                           │
│  ─── Alerts (3) ────────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  🔴 CRITICAL  │  Lua — Advertising budget exceeded by $3,000        │ │
│  │               │  Planned: $4,000. Allocated: $1,000. 3 days.       │ │
│  │               │  ┌──────────┐ ┌──────────┐                          │ │
│  │               │  │  Resolve │ │  Snooze  │                          │ │
│  │               │  └──────────┘ └──────────┘                          │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  🟡 WARNING   │  Sam Wilson has 5 active releases — overloaded      │ │
│  │               │  Mix engineer across Midnight Sessions, Summer EP,  │ │
│  │               │  Lost Tracks, Neon Remix, Autumn EP.               │ │
│  │               │  ┌──────────┐ ┌──────────┐                          │ │
│  │               │  │  Review  │ │  Snooze  │                          │ │
│  │               │  └──────────┘ └──────────┘                          │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  🔵 INFO      │  Summer EP released — monitoring period active     │ │
│  │               │  Distribution live on Spotify, Apple Music, Tidal. │ │
│  │               │  ┌──────────┐ ┌──────────┐                          │ │
│  │               │  │  View    │ │ Dismiss  │                          │ │
│  │               │  └──────────┘ └──────────┘                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Recommendations (2) ───────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  💡 Redistribute mix engineer workload                              │ │
│  │     Sam Wilson has 5 releases. Taylor (Designer) has 0 active       │ │
│  │     design tasks after Sep 01. Could take on Neon Remix artwork     │ │
│  │     to free Sam's capacity.                                         │ │
│  │     ┌──────────┐                                                    │ │
│  │     │  Apply   │  Auto-reassigns Taylor to Neon Remix artwork       │ │
│  │     └──────────┘                                                    │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  💡 Fast-track mastering for Midnight Sessions                      │ │
│  │     Mastering deadline is Aug 15 (3 days ago). Release date is      │ │
│  │     Oct 01. If mastering doesn't finish by Sep 01, remaining        │ │
│  │     stages have 30 days instead of 45. Recommend: escalate to      │ │
│  │     mastering engineer with SLA notice.                              │ │
│  │     ┌──────────┐                                                    │ │
│  │     │  Escalate│  Sends SLA notice to mastering engineer            │ │
│  │     └──────────┘                                                    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Blocked Work (2) ────────────────────────────────────────────────   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Lua — Mastering stage                                               │ │
│  │  Blocked 3 days · Waiting on Sam Wilson (Mix Engineer)              │ │
│  │  ┌──────────┐ ┌──────────┐                                          │ │
│  │  │  Nudge   │ │ Reassign │                                          │ │
│  │  └──────────┘ └──────────┘                                          │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  Midnight Sessions — Cover art approval                              │ │
│  │  Blocked 5 days · Waiting on Sam A&R                                │ │
│  │  ┌──────────┐ ┌──────────┐                                          │ │
│  │  │  Nudge   │ │ Reassign │                                          │ │
│  │  └──────────┘ └──────────┘                                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Critical Deadlines (4) ────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  🔴 Lua · Mastering · Aug 15        3 days overdue    Sam Wilson   │ │
│  │  🔴 Lua · Mix revision · Aug 15     3 days overdue    Sam Wilson   │ │
│  │  🔴 Mid Sess · Cover art · Aug 12   6 days overdue    Sam A&R      │ │
│  │  🟡 Summer EP · ISRC codes · Aug 18 Due today         Alex PM     │ │
│  │  🟡 Mid Sess · Ad budget · Aug 18   Due today          Anna Mkt    │ │
│  │  🟢 Summer EP · DSP assets · Aug 20 2 days            Alex PM     │ │
│  │  🟢 Neon Remix · Artwork · Aug 22  4 days            Taylor Des   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Org Pulse ────────────────────────────────────────────────────────  │
│                                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 5 active │ │ 2 blocked│ │ 4 overdue │ │ 3 over   │ │ 2 released│      │
│  │ releases │ │ stages   │ │ deadlines │ │ budget   │ │ this month│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                                           │
│  Last updated: 3 minutes ago                                  [Refresh]   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Sections

### Alerts

System-generated alerts based on predefined conditions. Three severities.
Full design in TASK-2803. Shown here as a consolidated list.

| Severity | Trigger Examples |
|----------|-----------------|
| Critical | Budget exceeded, stage blocked > 3 days, release date missed |
| Warning | Contributor overloaded, budget forecast over, SLA approaching |
| Info | Release shipped, milestone completed, new contributor added |

### Recommendations

Rule-based suggestions derived from alert conditions. Each recommendation
comes from a fixed rule, not AI:

| Rule | Condition | Recommendation |
|------|-----------|---------------|
| Contributor overload | User has 4+ active assignments | "Redistribute workload. [Name] has capacity." |
| Upstream block | Stage blocked > 2 days | "Escalate to stage owner with SLA notice." |
| Budget overage | Category forecast > budget by 20%+ | "Adjust allocation or reduce planned spend." |
| Idle resource | Contributor has 0 active, releases need their role | "Assign [Name] to [Release]." |
| Cascade risk | Delayed stage will compress later stages | "Fast-track current stage to protect release date." |

### Blocked Work

Cross-release list of all blocked stages, approvals, and conflicts.
Same format as the Release Operations Dashboard (TASK-2604) but spans
all active releases.

### Critical Deadlines

All overdue and upcoming deadlines across all releases. Color-coded
by urgency, sorted by date ascending (most overdue first).

### Org Pulse

Five stat cards giving an instantaneous org-wide health snapshot.
Replaces the generic dashboard stats with actionable counts.

---

## Filtering

```
┌──────────────────────────────────────────────────────────────┐
│  Release: ◉ All  ○ Midnight Sessions  ○ Lua  ○ Summer EP   │
│  Severity: ◉ All  ○ Critical only  ○ Warnings               │
│  Age: ◉ All  ○ Last 24h  ○ Last 7d                          │
│                                                               │
│  ☐ Show dismissed  ☐ Show resolved                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface OperationsCenter {
  orgId: string;
  alerts: Alert[];               // Full spec in TASK-2803
  recommendations: Recommendation[];
  blockedItems: BlockedItem[];   // Same type as TASK-2604
  criticalDeadlines: DeadlineItem[];
  orgPulse: OrgPulse;
}

interface Recommendation {
  id: string;
  rule: string;                  // "contributor_overload", "budget_overage", etc.
  title: string;                 // "Redistribute mix engineer workload"
  description: string;           // Full explanation with names, numbers
  action: {
    label: string;               // "Apply", "Escalate", "Adjust"
    actionType: 'reassign' | 'escalate' | 'adjust_budget' | 'nudge';
    payload: Record<string, string>;  // targetUserId, releaseId, etc.
  };
  triggeredBy: {
    alertId?: string;            // If derived from an alert
    blockedItemId?: string;      // If derived from a blocked item
  };
}

interface OrgPulse {
  activeReleases: number;
  blockedStages: number;
  overdueDeadlines: number;
  overBudgetReleases: number;
  releasesThisMonth: number;
  computedAt: Timestamp;
}
```
