# Approval Queue v1 — Visual Spec

## Route

Shown inline on A&R/PM dashboard, accessible via `/dashboard?tab=approvals`

## Backend Entity Validation

| Entity | Source | Validated |
|--------|--------|-----------|
| approval_requests | `approvals` collection, `reviewerId = currentUser.id`, `status = 'pending'` | ✅ |
| notifications | `notifications` collection (approval-requested events) | ✅ |
| tasks | `tasks` collection (linked to approval entity) | ✅ |
| deliverables | `deliverables` collection (linked to approval via deliverable review) | ✅ |
| activities | `activity` log (approval decisions logged) | ✅ |

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Approval Queue · Sam A&R                                                 │
│                                                                           │
│  ┌──────────────┬──────────────┬──────────────┐                           │
│  │ ● All (5)    │ ○ Stage (1) │ ○ Deliv (2)  │ ○ Task (2)   │           │
│  └──────────────┴──────────────┴──────────────┴──────────────┘           │
│                                                                           │
│  ─── Overdue (2) ────────────────────────────────────────────────────    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 🔴 CRITICAL · Review: Mastering Stage                               │ │
│  │                                                                      │ │
│  │    Lua – The Fading Light · Submitted Aug 20 by Sam W               │ │
│  │    SLA was Aug 23 · 2 days overdue                                   │ │
│  │    ████████████████████████████████████████  100% SLA elapsed        │ │
│  │                                                                      │ │
│  │    ┌──────────┐ ┌──────────┐ ┌──────────┐                            │ │
│  │    │  Review  │ │  Snooze  │ │ Reassign │                            │ │
│  │    └──────────┘ └──────────┘ └──────────┘                            │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ 🔴 CRITICAL · Review: Cover Art v3                                  │ │
│  │                                                                      │ │
│  │    Midnight Sessions · Submitted Aug 18 by Taylor                   │ │
│  │    SLA was Aug 21 · 4 days overdue                                   │ │
│  │    ██████████████████████████████████████████████  120% SLA elapsed   │ │
│  │                                                                      │ │
│  │    ┌──────────┐ ┌──────────┐ ┌──────────┐                            │ │
│  │    │  Review  │ │ Escalate │ │ Reassign │                            │ │
│  │    └──────────┘ └──────────┘ └──────────┘                            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Due Soon (1) ────────────────────────────────────────────────────   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 🟡 WARNING · Review: Stereo Mix — Track 2                            │ │
│  │                                                                      │ │
│  │    Summer EP · Submitted Aug 24 by Sam W                            │ │
│  │    SLA: Aug 26 · 1 day remaining                                     │ │
│  │    ████████████████████████░░░░░░░░░░░░  50% SLA elapsed             │ │
│  │                                                                      │ │
│  │    ┌──────────┐ ┌──────────┐                                          │ │
│  │    │  Review  │ │  Snooze  │                                          │ │
│  │    └──────────┘ └──────────┘                                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── On Track (2) ────────────────────────────────────────────────────   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 🟢 Review: Rough Mix — Track 1                                       │ │
│  │    Neon Remix · Submitted 1h ago · SLA: Aug 28 · 3 days remaining   │ │
│  │    ┌──────────┐ ┌──────────┐                                          │ │
│  │    │  Review  │ │  Snooze  │                                          │ │
│  │    └──────────┘ └──────────┘                                          │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ 🟢 Review: Task "Book studio session"                                 │ │
│  │    Autumn EP · Submitted 30m ago · 1 day remaining                   │ │
│  │    ┌──────────┐ ┌──────────┐                                          │ │
│  │    │  Review  │ │  Snooze  │                                          │ │
│  │    └──────────┘ └──────────┘                                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Summary ──────────────────────────────────────────────────────────   │
│  5 pending · 2 overdue · 1 due soon · 2 on track                         │
│  Oldest: 4 days (Cover Art v3) · Average response: 2.3 days              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Spacing

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Content max-width: 800px · padding 24px                                │
│                                                                          │
│  Filter tabs: mb 16px (lg) · tabs gap 0 · pill style                   │
│                                                                          │
│  Urgency group: mb 16px (lg)                                            │
│  │ Group header: H3 · mb 8px (sm)                                       │
│  │ Approval card: mb 8px (sm)                                           │
│  │ Card padding: 12px (md)                                              │
│  │ Card internal gap: 8px (sm)                                          │
│  │ SLA bar: h 4px · mt 4px · mb 8px                                    │
│  │ Action buttons: flex · gap 8px (sm)                                  │
│  └────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  Summary bar: mt 16px (lg) · p 8px 0                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Typography

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Element                │ Token         │ Size / Weight     │ Color     │
│────────────────────────┼───────────────┼───────────────────┼───────────│
│ Page title             │ H2            │ 20px / 600        │ #18181B   │
│ Filter tab             │ Body · 600    │ 14px / 600        │ #18181B   │
│ Filter count           │ Label         │ 12px / 500        │ #52525B   │
│ Urgency group header   │ H3            │ 16px / 600        │ #18181B   │
│ Card severity badge    │ Label         │ 12px / 500        │ severity  │
│ Card title             │ Body · 600    │ 14px / 600        │ #18181B   │
│ Card context           │ Body Small    │ 12px / 400        │ #52525B   │
│ SLA label              │ Body Small · 6│ 12px / 600        │ urgency   │
│ SLA percentage         │ Caption       │ 11px / 400        │ #A1A1AA   │
│ Action button          │ Label         │ 12px / 500        │ btn color │
│ Summary label          │ Body Small    │ 12px / 400        │ #52525B   │
│ Summary value          │ Body · 600    │ 14px / 600        │ #18181B   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Colors

### Urgency Group

```
Urgency     │ Header Color │ Card Left Border │ Card Background
────────────┼──────────────┼──────────────────┼─────────────────
Overdue     │ #DC2626      │ #DC2626          │ #FEF2F2
Due Soon    │ #D97706      │ #D97706          │ #FEF3C7
On Track    │ #16A34A      │ #E4E4E7          │ #FFFFFF
```

### SLA Bar

```
SLA %       │ Fill Color │ Track Color │ Label
────────────┼────────────┼─────────────┼──────────
0-50%       │ #16A34A    │ #F4F4F5     │ "N days remaining"
51-99%      │ #D97706    │ #F4F4F5     │ "1 day remaining"
100%+       │ #DC2626    │ #FEE2E2     │ "N days overdue"
```

### Card Severity Badge

```
Severity    │ Background    │ Text         │ Left Accent
────────────┼───────────────┼──────────────┼──────────────
Critical    │ #FEE2E2       │ #DC2626      │ #DC2626
Warning     │ #FEF3C7       │ #D97706      │ #D97706
Normal      │ #F4F4F5       │ #52525B      │ #E4E4E7 (none)
```

---

## States

| State | Condition | Visual |
|-------|-----------|--------|
| Default | Approvals exist | Full queue as shown |
| Empty (all done) | 0 pending approvals | "All caught up! No items awaiting your review. 🎉" |
| Filtered | Entity type filter active | Only matching approvals shown. |
| Loading | Data fetching | Skeleton cards: 5 cards with pulsing bars. |
| Error | Fetch failure | "Failed to load approval queue. [Retry]" |

---

## Interactions

| Element | Action | Result |
|---------|--------|--------|
| Approval card | Click | Open Review Panel (doc 35) |
| "Review" button | Click | Open Review Panel |
| "Snooze" button | Click | Snooze dialog: 24h / 3d / 1w. Card moves to Snoozed tab. |
| "Escalate" button | Click | Escalation modal: select new reviewer, add reason. Alert created. |
| "Reassign" button | Click | User picker: change reviewer. Approval transfers. |
| Filter tab | Click | Filter queue by entity type. |
| SLA bar | Hover | Tooltip: "Due Aug 23. 2 days overdue." |

---

## Review Panel (Opens from "Review" click)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Review: Mastering Stage · Lua – The Fading Light             [×]        │
│  ────────────────────────────────────────────────────────────────────    │
│                                                                           │
│  Submitted by Sam Wilson · Aug 20 · 5 days ago                          │
│                                                                           │
│  ─── Submitter Notes ──────────────────────────────────────────────────   │
│  "All 5 tracks mastered at -14 LUFS. True peak at -1dB."                │
│                                                                           │
│  ─── Deliverables ─────────────────────────────────────────────────────   │
│  🔊 Master File — T1 (3:42) · T2 (4:15) · T3 (3:28) · T4 (5:01) · T5  │
│     ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│     │▶ T1  │ │▶ T2  │ │▶ T3  │ │▶ T4  │ │▶ T5  │                       │
│     └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                       │
│                                                                           │
│  ─── Previous Feedback ────────────────────────────────────────────────   │
│  🔄 Aug 22 · Sam A&R requested changes: "Track 4 hi-hat too bright"     │
│                                                                           │
│  ─── Your Decision ────────────────────────────────────────────────────   │
│                                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐                  │
│  │ ✅ Approve   │ │ 🔄 Request   │ │ ✕ Reject        │                  │
│  │              │ │    Changes   │ │                  │                  │
│  │ Accept as-is │ │ Needs        │ │ Fundamentally    │                  │
│  │ Stage advanc │ │ revision     │ │ wrong. Restart.  │                  │
│  └──────────────┘ └──────────────┘ └──────────────────┘                  │
│                                                                           │
│  ┌──────────┐                                                             │
│  │  Cancel  │                                                             │
│  └──────────┘                                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

### Decision Dialogs

**Request Changes:**
```
┌──────────────────────────────────────────┐
│  Request Changes to Mastering Stage       │
│                                            │
│  The submitter will need to revise and    │
│  resubmit.                                 │
│                                            │
│  ── What needs to change? ──              │
│  ┌──────────────────────────────────────┐  │
│  │ Track 4 hi-hat tame 2dB.             │  │
│  │ Track 5 vocal raise in verse 2.      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────┐ ┌──────────┐        │
│  │ Request Changes  │ │  Cancel  │        │
│  └──────────────────┘ └──────────┘        │
└──────────────────────────────────────────┘
```

---

## Responsive

| Breakpoint | Layout |
|------------|--------|
| ≥768px | Cards full-width. 3 action buttons in a row. |
| <768px | Cards full-width. Action buttons stack vertically (full-width). Review panel: full-screen. |

---

## CSS Implementation

```css
.approval-queue {
  max-width: 800px;
  padding: 24px;

  .filter-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 16px;

    .tab {
      padding: 8px 16px;
      font: var(--text-body);
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;

      &.active {
        color: #7C3AED;
        border-bottom-color: #7C3AED;
      }
      &:not(.active) { color: #52525B; }

      .count { font: var(--text-label); margin-left: 4px; }
    }
  }

  .urgency-group {
    margin-bottom: 16px;

    h3 { font: var(--text-h3); margin-bottom: 8px; }
  }

  .approval-card {
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 6px;
    border: 1px solid var(--card-left-color, #E4E4E7);
    border-left: 3px solid var(--card-left-color, #E4E4E7);
    cursor: pointer;

    &.overdue {
      --card-left-color: #DC2626;
      background: #FEF2F2;
    }
    &.due-soon {
      --card-left-color: #D97706;
      background: #FEF3C7;
    }
    &.on-track {
      --card-left-color: #E4E4E7;
      background: #FFFFFF;
    }

    .card-severity {
      font: var(--text-label);
      margin-bottom: 4px;
    }

    .card-title {
      font: var(--text-body);
      font-weight: 600;
    }

    .card-context {
      font: var(--text-body-sm);
      color: #52525B;
    }

    .sla-bar {
      height: 4px;
      border-radius: 2px;
      background: #F4F4F5;
      margin: 8px 0;

      .sla-fill {
        border-radius: 2px;
        transition: width var(--motion-normal);
        &.green { background: #16A34A; }
        &.amber { background: #D97706; }
        &.red { background: #DC2626; background-color: #FEE2E2; }
      }
    }

    .card-actions {
      display: flex;
      gap: 8px;
    }
  }
}
```
