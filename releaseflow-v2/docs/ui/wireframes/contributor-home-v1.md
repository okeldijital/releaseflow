# Contributor Home v1

## Route

`/home`

## Backend Entities

| Entity | Source |
|--------|--------|
| Task | `tasks` collection, filtered by `assigneeId = currentUser.id` |
| Deliverable | `deliverables` collection, filtered by `ownerId = currentUser.id` |
| Notification | `notifications` collection, filtered by `userId = currentUser.id` |
| Approval Request | `approvals` collection, filtered by `reviewerId = currentUser.id` |
| Release | `releases` collection, filtered by `contributorIds` |

---

## Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│  contributor layout                                                       │
│                                                                           │
│  ┌──────────────────────┐                                                 │
│  │ No sidebar           │  ┌───────────────────────────────────────────┐ │
│  │                      │  │  Top Nav                        🔔 (3) 👤  │ │
│  │  ┌────────┐┌────────┐│  │                                           │ │
│  │  │●My Tasks││○Pending││  │  Hello, Sam                      ⚙ Acct  │ │
│  │  │  (4)   ││  (1)   ││  │  Mix Engineer · 3 active projects         │ │
│  │  └────────┘└────────┘│  │                                           │ │
│  │                      │  │  ── Assigned Tasks (4) ──────────────────  │ │
│  │                      │  │                                           │ │
│  │                      │  │  ┌───────────────────────────────────────┐ │ │
│  │                      │  │  │ ◉ EQ drum stem                        │ │ │
│  │                      │  │  │    Lua – The Fading Light · Mastering │ │ │
│  │                      │  │  │    Due Aug 25 🔴 Overdue (today)      │ │ │
│  │                      │  │  │    ┌──────────┐ ┌──────────┐         │ │ │
│  │                      │  │  │    │ + Upload │ │ Mark Done│         │ │ │
│  │                      │  │  │    └──────────┘ └──────────┘         │ │ │
│  │                      │  │  ├───────────────────────────────────────┤ │ │
│  │                      │  │  │ ◉ Level stems                        │ │ │
│  │                      │  │  │    Lua – The Fading Light · Mastering │ │ │
│  │                      │  │  │    Due Aug 28 🟡 This week           │ │ │
│  │                      │  │  │    ┌──────────┐                       │ │ │
│  │                      │  │  │    │ + Upload │                       │ │ │
│  │                      │  │  │    └──────────┘                       │ │ │
│  │                      │  │  ├───────────────────────────────────────┤ │ │
│  │                      │  │  │ ◉ Reverb bus setup                   │ │ │
│  │                      │  │  │    Midnight Sessions · Mixing         │ │ │
│  │                      │  │  │    Due Sep 01 🟢 Future             │ │ │
│  │                      │  │  │    ┌──────────┐                       │ │ │
│  │                      │  │  │    │  Start   │                       │ │ │
│  │                      │  │  │    └──────────┘                       │ │ │
│  │                      │  │  ├───────────────────────────────────────┤ │ │
│  │                      │  │  │ ○ Vocal comp                         │ │ │
│  │                      │  │  │    Summer EP · Mixing                 │ │ │
│  │                      │  │  │    Due Sep 05 🟢 Future             │ │ │
│  │                      │  │  │    ┌──────────┐                       │ │ │
│  │                      │  │  │    │  Start   │                       │ │ │
│  │                      │  │  │    └──────────┘                       │ │ │
│  │                      │  │  └───────────────────────────────────────┘ │ │
│  │                      │  │                                           │ │
│  │                      │  │  ── Pending Approvals (1) ──────────────  │ │
│  │                      │  │                                           │ │
│  │                      │  │  ┌───────────────────────────────────────┐ │ │
│  │                      │  │  │ ⏳ Review mix v2                      │ │ │
│  │                      │  │  │    Midnight Sessions · Mixing         │ │ │
│  │                      │  │  │    Submitted Aug 24 by Sam W          │ │ │
│  │                      │  │  │    SLA: Aug 27 (2 days)               │ │ │
│  │                      │  │  │    ┌──────────┐ ┌──────────┐         │ │ │
│  │                      │  │  │    │  Review  │ │  Snooze  │         │ │ │
│  │                      │  │  │    └──────────┘ └──────────┘         │ │ │
│  │                      │  │  └───────────────────────────────────────┘ │ │
│  │                      │  │                                           │ │
│  │                      │  │  ── Recent Notifications (3) ───────────  │ │
│  │                      │  │                                           │ │
│  │                      │  │  💬 Alex PM: "Mastering deadline moved"   │ │
│  │                      │  │     Lua · 2h ago                          │ │
│  │                      │  │  🔄 A&R requested changes on mix v1       │ │
│  │                      │  │     Mid Sess · 1d ago                     │ │
│  │                      │  │  🟢 Task "Import stems" completed          │ │
│  │                      │  │     Lua · 3d ago                          │ │
│  │                      │  │                                           │ │
│  │                      │  │  ── Upcoming Deadlines (5) ──────────────  │ │
│  │                      │  │                                           │ │
│  │                      │  │  🔴 Aug 25  EQ drum stem                  │ │
│  │                      │  │             Lua · Mastering               │ │
│  │                      │  │  🟡 Aug 28  Level stems                   │ │
│  │                      │  │             Lua · Mastering               │ │
│  │                      │  │  🟢 Sep 01  Reverb bus setup              │ │
│  │                      │  │             Mid Sess · Mixing             │ │
│  │                      │  │  🟢 Sep 05  Vocal comp                    │ │
│  │                      │  │             Summer EP · Mixing            │ │
│  │                      │  │  ⚪ TBD     Final master delivery          │ │
│  │                      │  │             Lua · Mastering               │ │
│  │                      │  │                                           │ │
│  │                      │  │  ── Quick Links ──────────────────────────  │ │
│  │                      │  │                                           │ │
│  │                      │  │  ┌─────────────┐ ┌─────────────┐         │ │
│  │                      │  │  │ Lua         │ │ Mid Sess    │         │ │
│  │                      │  │  │ Mastering   │ │ Mixing      │         │ │
│  │                      │  │  └─────────────┘ └─────────────┘         │ │
│  │                      │  │  ┌─────────────┐                          │ │
│  │                      │  │  │ Summer EP   │                          │ │
│  │                      │  │  │ Mixing      │                          │ │
│  │                      │  │  └─────────────┘                          │ │
│  │                      │  └───────────────────────────────────────────┘ │
│  └──────────────────────┘                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Sections

### 1. Assigned Tasks

Tasks where `assigneeId = currentUser.id` AND `status ∈ ['TODO', 'IN_PROGRESS', 'REVIEW']`.

Sorted by: overdue first, then due date ascending.

| Element | Data Source |
|---------|-------------|
| Task title | `task.title` |
| Release + Stage | `release.name` + `stage.name` (denormalized) |
| Due date + urgency | `task.dueDate`, computed: overdue / this week / future |
| Action button | Contextual: "Start" (TODO), "Upload" (IN_PROGRESS, has linked deliverable), "Mark Done" (all states) |
| Empty state | "All clear! No assigned tasks." (doc 71, #1) |

### 2. Pending Approvals

Approval requests where `reviewerId = currentUser.id` AND `status = 'pending'`.

| Element | Data Source |
|---------|-------------|
| Approval title | `approval.entityType` + `approval.entityName` |
| Release + Stage | `release.name` + `stage.name` |
| Submitted info | `approval.submittedBy` + `approval.submittedAt` |
| SLA | `approval.slaDeadline` — computed days remaining |
| Action button | "Review" → opens review panel (doc 35) |
| Empty state | "All caught up! No items awaiting your review." (doc 71, #35) |

### 3. Recent Notifications

Most recent 3 notifications where `userId = currentUser.id`.

| Element | Data Source |
|---------|-------------|
| Notification content | `notification.title` + `notification.body` |
| Relative time | `notification.createdAt` → "2h ago" |
| Click | Opens the relevant entity (task, deliverable, stage) |
| Empty state | "No notifications yet." (implied by absence) |

### 4. Upcoming Deadlines

Tasks where `assigneeId = currentUser.id` AND `dueDate IS NOT NULL` AND
`status ≠ 'DONE'`, ordered by `dueDate ASC`.

| Element | Data Source |
|---------|-------------|
| Urgency indicator | Computed: 🔴 overdue, 🟡 ≤7 days, 🟢 >7 days, ⚪ no date |
| Task title + release + stage | Same as Assigned Tasks |
| Empty state | "No upcoming deadlines. You're ahead of schedule." (doc 71, #2) |

### 5. Quick Links

Releases where `currentUser.id ∈ release.contributorIds`. Limited to 5.

| Element | Data Source |
|---------|-------------|
| Release name | `release.name` |
| Current stage | `stage.name` (active stage for this contributor) |
| Click | Opens release at the contributor's stage |

---

## Tab: Pending

Second tab shows all tasks (including completed), not just active.

```
┌─ Pending (12) ───────────────────────────────────────────────────────┐
│                                                                       │
│  ── Active (4) ──────────────────────────────────────────────────    │
│  [Same as Assigned Tasks in My Tasks tab]                             │
│                                                                       │
│  ── Completed (8) ────────────────────────────────────────────────   │
│  ✓ Import stems            Lua · Mixing · Aug 12                     │
│  ✓ Set up session          Mid Sess · Mixing · Aug 10               │
│  ✓ ...                                                                │
└──────────────────────────────────────────────────────────────────────┘
```

---

## States

| State | Condition | Visual |
|-------|-----------|--------|
| Default | Tasks exist | Full layout |
| Empty (no tasks) | Assignee has 0 active tasks | "All clear! No assigned tasks." |
| Empty (no approvals) | No pending reviews | "All caught up! No items awaiting your review." |
| Empty (no notifications) | No notifications | "No notifications yet." |
| Loading | Data fetching | Skeleton cards for tasks + approvals |
| Error | Fetch failure | "Failed to load your tasks. [Retry]" |

---

## Responsive

| Breakpoint | Layout |
|------------|--------|
| ≥1024px | Two tabs at top. Content sections in vertical scroll. |
| 768–1023px | Same layout, narrower cards. |
| <768px | Two tabs. Task cards stack full-width. Color-coded left border (🔴🟡🟢). Action buttons full-width. Approvals below tasks. Notifications: last 3 inline. Deadlines: list. Quick Links: horizontal scroll. |
