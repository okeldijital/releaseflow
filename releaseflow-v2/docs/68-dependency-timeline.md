# TASK-3203 — Dependency Timeline

## Concept

A Gantt-style timeline showing WHEN each dependency will resolve and
what downstream work it unblocks. The PM answers: *"When will this be
unblocked, and what happens then?"*

Not a calendar of tasks. A forecast of resolution dates for blocked
and in-progress dependencies, showing the cascade through the release
pipeline.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Dependency Timeline · Lua – The Fading Light                            │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Today: Aug 28 · 79 days until release (Nov 15)                    │  │
│  │  ████████████████████████████████████████░░░░░░░░░░  55% elapsed   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Aug                    September             October          November  │
│  15  20  25  30   05  10  15  20  25  30   05  10  15  20   01  05  10  │
│  ───────────────────────────────────────────────────────────────────────  │
│                                                                           │
│  Planning     ████████✓                                                  │
│                                                                           │
│  Production   ░░░░████████████✓                                          │
│                                                                           │
│  Mixing       ░░░░░░░░░░░░░░███████████████✓                             │
│                                                                           │
│  Mastering    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████✓                 │
│                                                                           │
│  Artwork      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████✓           │
│                                                                           │
│  ── BLOCKED ──────────────────────────────────────────────────────────   │
│                                                                           │
│  License      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░????░░░░░░░░░░   │
│  (External)   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░Contacted░░░░░░░░   │
│               ▲                                                           │
│               Estimated: Sep 15 (optimistic) / Sep 30 (pessimistic)      │
│                                                                           │
│  Distribution ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░🔴░░░░░░   │
│               ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░BLOCKED░░   │
│               ▲                                                           │
│               Blocked until license resolves                              │
│                                                                           │
│  ── After Unblocked (Forecast) ───────────────────────────────────────   │
│                                                                           │
│  If license resolves Sep 15 (optimistic):                                │
│  Distribution ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░███████████✓   │
│               ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│               Expected: Sep 15 – Oct 01 (16 days — full window)         │
│                                                                           │
│  Release      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████✓│
│               Expected: Nov 15 — ON TIME ✓                               │
│                                                                           │
│  ── If License Resolves Sep 30 (pessimistic) ──────────────────────────  │
│                                                                           │
│  Distribution ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│               Expected: Sep 30 – Oct 15 (15 days — compressed by 1 day) │
│                                                                           │
│  Release      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│               Expected: Nov 15 — AT RISK ⚠ (only 30 days for distrib)  │
│                                                                           │
│  ⚠ If license unresolved past Oct 01: Release date MUST shift.          │
│                                                                           │
│  ─── Critical Path ─────────────────────────────────────────────────────  │
│                                                                           │
│  Planning → Production → Mixing → Mastering → [License] → Distribution  │
│  ████████ ████████████ ███████████████ ████████████ 🔴 ░░░░░░░░░░░░░░  │
│                                                                           │
│  Longest chain: License is the only remaining blocker on the critical    │
│  path. All internal stages are complete.                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Timeline Zones

### Completed (Green)
Stages or dependencies that are DONE. Shown as a solid green bar with ✓.

### In Progress (Blue)
Stages or dependencies being worked on. Shown as a solid blue bar.

### Blocked (Red)
Stages or dependencies that cannot proceed. Shown as a hashed red bar
with 🔴 marker. Extended past the expected date as a dashed line.

### Forecast (Dashed)
Predicted completion range based on owner estimates. Shown as a dashed
outline with optimistic (green) and pessimistic (amber) bounds.

### External (Patterned)
External dependencies use a distinct visual (diagonal stripes) to
indicate they are outside ReleaseFlow's control.

---

## Estimate Types

| Type | Icon | Definition |
|------|------|------------|
| Optimistic | 🟢 | Best-case scenario — everything goes right |
| Pessimistic | 🟡 | Worst realistic case — one round of delays |
| Unknown | ???? | No estimate provided — cannot forecast |

---

## Critical Path

The critical path is the longest chain of dependencies that determines
whether the release date is achievable:

```
Planning → Production → Mixing → Mastering → [License] → Distribution
████████ ████████████ ███████████████ ████████████ 🔴 ░░░░░░░░░░░░░░

Critical path duration: 92 days (Aug 15 – Nov 15)
Completed: 70 days (76%)
Remaining: 22 days (Dependency: License resolution)
Slack: 0 days — any further delay to License WILL push the release date.
```

If slack is ≤0, the timeline shows a 🔴 warning: "Release date at risk.
Every day of delay on the critical path pushes the release date."

---

## Milestone Overlay

Release milestones are overlaid on the timeline:

```
                     ▼ T-30              ▼ T-14      ▼ T-7   ▼ Release
Aug ─────────────────────────────────────────────────────────── Nov 15
     Campaign kickoff    Pre-save launch   Press      Ads     ★
```

Each campaign milestone (from the Promotion Calendar, doc 47) appears as
a marker on the timeline. If a milestone falls in a blocked zone, it's
flagged.

---

## "What If" Mode

The PM can drag the estimate of any unresolved dependency to see how it
affects the release date:

```
  Drag license estimate right → Aug 30 → Sep 05 → Sep 10 → ...

  At Sep 10: Distribution starts Sep 10 (compressed to 12 days)
  At Sep 15: Distribution starts Sep 15 (compressed to 10 days)
  At Sep 20: ⚠ "Release date at risk. Distribution needs minimum 10 days."
  At Oct 01: 🔴 "Release date MUST shift to Nov 20 or later."
```

The "What If" mode is a drag handle on the dependency bar. As the PM
drags, the downstream bars recalculate in real time.

---

## Mobile View

```
┌──────────────────────────────┐
│  Timeline · Lua              │
│                               │
│  Aug 28 · 79 days to release │
│  ████████████████████░░░ 55%│
│                               │
│  ── Completed ──             │
│  Planning     ✓ Aug 15-20    │
│  Production   ✓ Aug 20-Sep 05│
│  Mixing       ✓ Sep 05-20    │
│  Mastering    ✓ Sep 20-30    │
│  Artwork      ✓ Sep 30-Oct 10│
│                               │
│  ── Blocked ──               │
│  🔴 License — 14 days        │
│     Est: Sep 15 – Sep 30     │
│     ⚠ Critical path blocker  │
│     [Follow Up] [Escalate]   │
│                               │
│  ── Waiting ──               │
│  Distribution                 │
│  Release                      │
│                               │
│  ⚠ 0 days slack. Any delay   │
│  pushes release date.         │
└──────────────────────────────┘
```

On mobile, the Gantt collapses to a vertical list grouped by status.
Completed stages collapsed by default. Blocked items expanded.

---

## Data Model

```typescript
interface DependencyTimeline {
  releaseId: string;
  releaseDate: Timestamp;
  today: Timestamp;
  totalElapsed: number;         // days since first stage start
  totalDuration: number;        // total days from start to release date
  progress: number;             // elapsed / duration as percentage

  stages: TimelineStage[];
  dependencies: TimelineDependency[];
  criticalPath: TimelineCriticalPath;
  slack: number;                // Days of buffer before release date is affected
}

interface TimelineStage {
  id: string;
  name: string;
  status: 'complete' | 'in_progress' | 'blocked' | 'pending';
  startDate: Timestamp;
  endDate?: Timestamp;          // Actual if complete, estimated if pending
  duration: number;             // Days
  dependsOn: string[];          // Stage IDs or dependency IDs
}

interface TimelineDependency {
  id: string;
  name: string;                 // "Mechanical License — Melodic Publishing"
  type: 'internal' | 'external';
  status: 'complete' | 'blocked' | 'in_progress';
  startDate: Timestamp;         // When the dependency was first identified
  optimisticEstimate?: Timestamp;
  pessimisticEstimate?: Timestamp;
  blockedSince: Timestamp;
  duration: number;             // Days since blocked
  blocking: string[];           // Stage IDs that are waiting
}

interface TimelineCriticalPath {
  stages: string[];             // Stage IDs in the critical path
  totalDays: number;
  completedDays: number;
  remainingDays: number;
  bottleneck: string;           // ID of the current bottleneck (stage or dependency)
  bottleneckType: 'stage' | 'dependency';
}
```
