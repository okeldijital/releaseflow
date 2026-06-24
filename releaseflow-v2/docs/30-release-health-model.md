# TASK-803 — Release Health Model

## Concept

A traffic-light health indicator (Green / Amber / Red) that gives
stakeholders an instant, at-a-glance assessment of whether a release is on
track. Health is computed from three factors:

1. **Overdue Stages** — stages past their due date
2. **Blocked Stages** — stages in BLOCKED status
3. **Release Date Risk** — proximity to street date vs completion

Health is displayed on the release card (release list), the dashboard stat
card, and the release header (alongside the status badge).

---

## Computation

### Formula

```
Health = WORST(overdueScore, blockedScore, dateRiskScore)
```

Health is the worst of three independent scores. Each factor produces a
Green / Amber / Red rating. The release's overall health is the lowest
(most severe) rating among the three.

### Factor 1: Overdue Stages

| Condition | Score |
|-----------|-------|
| 0 stages overdue | 🟢 Green |
| 1 stage overdue | 🟡 Amber |
| 2+ stages overdue | 🔴 Red |

A stage is "overdue" when `dueDate < now` AND `status ≠ COMPLETE`.

Exclude SKIPPED stages from the count.

### Factor 2: Blocked Stages

| Condition | Score |
|-----------|-------|
| 0 stages blocked | 🟢 Green |
| 1 stage blocked | 🟡 Amber |
| 2+ stages blocked | 🔴 Red |

A stage is "blocked" when `status = BLOCKED`.

### Factor 3: Release Date Risk

| Condition | Score |
|-----------|-------|
| No release date set | 🟢 Green (no date = no risk) |
| Date set, all stages complete | 🟢 Green |
| Date set, ≥14 days away, <100% complete | 🟢 Green |
| Date set, 7–13 days away, <100% complete | 🟡 Amber |
| Date set, <7 days away, <100% complete | 🔴 Red |
| Date set, date is past due, <100% complete | 🔴 Red |

---

## Overall Health Mapping

| Worst Factor | Overall Health |
|--------------|----------------|
| All Green | 🟢 Green |
| Any Amber | 🟡 Amber |
| Any Red | 🔴 Red |

---

## Display

### Release Card (Release List)

```
┌─────────────────────────────────────────┐
│  Midnight Sessions             🟡 Amber  │
│  Single · Artist X                      │
│  ──[████████░░░░░░]── 60%               │
│  Mastering · Due Jun 30                 │
└─────────────────────────────────────────┘
```

The health indicator appears as a colored dot + label in the top-right of
release cards.

### Dashboard Stat Card

```
┌──────────────────┐
│  📈              │
│  60%             │
│  Release Progress│
│  🟡 On Track?    │
│  1 stage overdue │
└──────────────────┘
```

The stat card shows the health indicator below the progress percentage. The
sub-label describes the primary risk factor ("1 stage overdue", "2 blocked
stages", "Release in 5 days").

### Release Header

```
┌─────────────────────────────────────────────────────────────────┐
│  ◀ Back to Releases                                              │
│                                                                  │
│  Midnight Sessions         Single · Artist X    ┌────────────┐  │
│                                                  │ PRODUCTION  │  │
│                                                  │ 🟡 On Track │  │
│                                                  └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

Health indicator shown below the status badge in the release header, giving
a secondary signal alongside the release lifecycle state.

---

## Health vs Status

Release status and release health are independent concepts:

| Dimension | Release Status | Release Health |
|-----------|---------------|----------------|
| What it tracks | Lifecycle phase (DRAFT → RELEASED) | Execution risk |
| Values | DRAFT, PLANNING, PRODUCTION, etc. | 🟢 Green, 🟡 Amber, 🔴 Red |
| Changes | Manual action / stage completion | Auto-computed daily |
| Purpose | "Where is this release?" | "Is this release on track?" |

A release can be in PRODUCTION (normal status) but have 🔴 Red health
(overdue stages + imminent release date). Both signals are shown together.

---

## Examples

| Scenario | Overdue | Blocked | Date Risk | Overall |
|----------|---------|---------|-----------|---------|
| All stages on time, no blocks, date in 3 weeks | 🟢 | 🟢 | 🟢 | 🟢 Green |
| One stage overdue by 2 days | 🟡 | 🟢 | 🟢 | 🟡 Amber |
| One stage blocked + release date in 10 days | 🟢 | 🟡 | 🟡 | 🟡 Amber |
| Two stages overdue + release date in 3 days | 🔴 | 🟢 | 🔴 | 🔴 Red |
| One stage blocked + two stages overdue | 🔴 | 🟡 | 🟢 | 🔴 Red |
| No date set, no stages started | 🟢 | 🟢 | 🟢 | 🟢 Green |

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No stages exist | Overdue = 0, Blocked = 0, Date risk = no date → 🟢 Green |
| No due dates on any stage | Overdue factor always 🟢 Green (no stage can be overdue) |
| Release is DRAFT | Health still computed; draft with no date → 🟢 Green |
| Release is RELEASED or ARCHIVED | Health not computed (hidden in UI) |
| All stages skipped | Overdue = 0, Blocked = 0, Date risk per release date → 🟢 or 🟡 or 🔴 |
| Release date is past and all stages complete | Date risk = 🟢 (all complete) → overall depends on overdue/blocked |

---

## Data Model

```typescript
interface ReleaseHealth {
  releaseId: string;
  overall: 'green' | 'amber' | 'red';
  factors: {
    overdueStages: {
      score: 'green' | 'amber' | 'red';
      count: number;
    };
    blockedStages: {
      score: 'green' | 'amber' | 'red';
      count: number;
    };
    dateRisk: {
      score: 'green' | 'amber' | 'red';
      daysUntilRelease?: number;  // null if no date set
    };
  };
  computedAt: Timestamp;
}
```

### Computation Schedule

| Trigger | Action |
|---------|--------|
| On release load (any page) | Compute health, cache for session |
| On stage status change | Recompute, update cache |
| On release date change | Recompute, update cache |
| Daily cron (midnight UTC) | Recompute all active releases |

Health is not stored as a persistent field. It is computed on read from
live stage data. The daily cron updates a cache for dashboard/release list
performance.
