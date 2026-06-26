# Operations Center v1

## Route

`/operations`

## Backend Entities

| Entity | Source |
|--------|--------|
| Release | `releases` collection |
| Task | `tasks` collection |
| Deliverable | `deliverables` collection |
| Dependency | `dependencies` collection |
| Alert | `alerts` collection (computed) |
| Budget | `budgets` collection (computed from costs) |
| Campaign | `campaigns` collection |
| Notification | `notifications` collection |

No new entities. This screen aggregates existing data.

---

## Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│  operations layout                                                        │
│                                                                           │
│  ┌─────────────────┐                                                      │
│  │ Sidebar          │  ┌────────────────────────────────────────────────┐ │
│  │                  │  │  Top Nav                          🔔 (3)  👤   │ │
│  │  ◆ Operations    │  │                                                │ │
│  │  ▸ Releases      │  │  ┌──────────────────────────────────────────┐ │ │
│  │  ▸ Tasks         │  │  │  Since Aug 22 (3 days ago)                │ │ │
│  │  ▸ Assets        │  │  │                                            │ │ │
│  │  ▸ Calendar      │  │  │  Lua: 2 tasks done, 1 stage advanced      │ │ │
│  │  ▸ Artists       │  │  │  Mid Sess: 4 tasks, 1 approval            │ │ │
│  │  ▸ Marketing     │  │  │  1 new blocker · 3 new comments            │ │ │
│  │  ▸ Distribution  │  │  │  ┌────────────────┐                        │ │ │
│  │  ▸ Reports       │  │  │  │ View All       │                        │ │ │
│  │                  │  │  │  └────────────────┘                        │ │ │
│  │  ⚙ Settings      │  │  └──────────────────────────────────────────┘ │ │
│  │                  │  │                                                │ │
│  │  Acme Records ▼  │  │  ─── Alerts (3) ─────────────────────────────  │ │
│  └─────────────────┘  │                                                │ │
│                        │  ┌────────────────────────────────────────────┐ │ │
│                        │  │ 🔴 Lua — Ad budget exceeded by $3,000     │ │ │
│                        │  │     Blocking: Campaign · 3 days            │ │ │
│                        │  │     ┌──────────┐ ┌──────────────┐         │ │ │
│                        │  │     │ Resolve  │ │ Acknowledge  │         │ │ │
│                        │  │     └──────────┘ └──────────────┘         │ │ │
│                        │  ├────────────────────────────────────────────┤ │ │
│                        │  │ 🔴 Mid Sess — Cov art pending 4 days      │ │ │
│                        │  │     Reviewer: Sam A&R                     │ │ │
│                        │  │     ┌──────────┐ ┌──────────────┐         │ │ │
│                        │  │     │  Nudge   │ │ Reassign     │         │ │ │
│                        │  │     └──────────┘ └──────────────┘         │ │ │
│                        │  ├────────────────────────────────────────────┤ │ │
│                        │  │ 🟡 Sam W — 5 releases (overloaded)       │ │ │
│                        │  │     ┌──────────────┐                       │ │ │
│                        │  │     │ Redistribute │                       │ │ │
│                        │  │     └──────────────┘                       │ │ │
│                        │  └────────────────────────────────────────────┘ │ │
│                        │                                                │ │
│                        │  ─── Blocked Work (2) ────────────────────────  │ │
│                        │                                                │ │
│                        │  ┌────────────────────────────────────────────┐ │ │
│                        │  │ 🔴 Mech License · Melodic Pub · 12 days   │ │ │
│                        │  │     Blocks: Lua Distrib + T3,T4            │ │ │
│                        │  │     Contacted 3 times · No response        │ │ │
│                        │  │     ┌──────────┐ ┌──────────┐             │ │ │
│                        │  │     │ Follow Up│ │ Escalate │             │ │ │
│                        │  │     └──────────┘ └──────────┘             │ │ │
│                        │  ├────────────────────────────────────────────┤ │ │
│                        │  │ 🟡 Mid Sess — Budget advertising +$3K    │ │ │
│                        │  │     ┌──────────┐                           │ │ │
│                        │  │     │  Adjust  │                           │ │ │
│                        │  │     └──────────┘                           │ │ │
│                        │  └────────────────────────────────────────────┘ │ │
│                        │                                                │ │
│                        │  ─── Critical Deadlines (5) ──────────────────  │ │
│                        │                                                │ │
│                        │  🔴 Lua · Mastering · Aug 20  (5d ago)  Sam W │ │
│                        │  🔴 Lua · ISRC T4 ·   Aug 22  (3d ago)  Alex  │ │
│                        │  🔴 Mid Sess · Art  · Aug 18  (7d ago)  Sam A │ │
│                        │  🟡 SummerEP · ISRC · Aug 25  (today)   Alex  │ │
│                        │  🟢 Neon Remix· Art · Aug 28   (3 days) Taylr │ │
│                        │                                                │ │
│                        │  ─── Org Pulse ──────────────────────────────  │ │
│                        │                                                │ │
│                        │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │
│                        │  │ 5 active │ │ 2 blocked│ │ 3 overdue│       │ │
│                        │  │ releases │ │ stages   │ │ deadlines│       │ │
│                        │  └──────────┘ └──────────┘ └──────────┘       │ │
│                        │  ┌──────────┐ ┌──────────┐                    │ │
│                        │  │ 2 over   │ │ 2 shipped│                    │ │
│                        │  │ budget   │ │ this mo  │                    │ │
│                        │  └──────────┘ └──────────┘                    │ │
│                        │                                                │ │
│                        │  Last updated: 2m ago                  [↻]    │ │
│                        └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Sources

| Section | Source | Query |
|---------|--------|-------|
| Since you were away | Activity log | Events where `timestamp > lastSessionEndedAt`, grouped by `releaseId` |
| Alerts | `alerts` | Where `status ∈ ['active', 'acknowledged']` ORDER BY `severity DESC, triggeredAt ASC` |
| Blocked Work | `dependencies` + `stages` | Where `status = 'blocked'`, cross-reference with `releases` for name |
| Critical Deadlines | `tasks` + `stages` + `deliverables` + `checklists` | Where `dueDate < now + 7d` AND `status ≠ 'complete'` ORDER BY `dueDate ASC` |
| Org Pulse | Aggregation | COUNT active releases, COUNT blocked stages, COUNT overdue deadlines, COUNT over-budget, COUNT released this month |

---

## States

| State | Condition | Visual |
|-------|-----------|--------|
| Default (with data) | ≥1 alert, blocked item, or deadline | Full layout as shown |
| All Clear (no issues) | 0 alerts, 0 blocked, 0 overdue deadlines | "All clear" empty state (doc 71, #33, #34) |
| First Visit (no activity) | `lastSessionEndedAt = null` | "Since you were away" section hidden |
| Loading | Data fetching | Skeleton cards for alerts + blocked + deadlines |
| Error | Fetch failure | "Failed to load operations data. [Retry]" |
| Filtered | Release filter active | Only show items for selected release |

---

## Interactions

| Element | Action | Target |
|---------|--------|--------|
| Alert: "Resolve" | Click | Deep link to entity (budget, stage, etc.) |
| Alert: "Acknowledge" | Click | Transition alert → acknowledged. Suppress notifications. |
| Blocker: "Follow Up" | Click | Log contact attempt on dependency |
| Blocker: "Escalate" | Click | Open escalation modal → reassign + notify |
| Blocker: "Adjust" | Click | Deep link to Budget Workspace |
| Deadline row | Click | Deep link to entity (stage, task, deliverable, checklist) |
| Org Pulse card | Click | Filter operations center to that category |
| Refresh icon | Click | Re-fetch all data |
| "Since you were away" → "View All" | Click | Open full activity log |

---

## Responsive

| Breakpoint | Layout |
|------------|--------|
| ≥1024px | Sidebar + content. Sections in vertical scroll. |
| 768–1023px | Sidebar collapsed. Content full-width. |
| <768px | No sidebar. Bottom tab bar. Sections as accordion. Alerts expanded by default. Org Pulse as 3+2 grid. |
