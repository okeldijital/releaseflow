# Contributor Home v2 — Visual Spec

## Route

`/home`

## Backend Entity Validation

| Entity | Source | Validated |
|--------|--------|-----------|
| tasks | `tasks` collection, `assigneeId = currentUser.id` | ✅ |
| deliverables | `deliverables` collection, `ownerId = currentUser.id` | ✅ |
| approval_requests | `approvals` collection, `reviewerId = currentUser.id` | ✅ |
| notifications | `notifications` collection, `userId = currentUser.id` | ✅ |
| activities | `activity` log, scoped to this user's releases | ✅ |

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  contributor layout · no sidebar · 960px max-width content              │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Top Nav · h 56px · bg Surface · 🔔 (3) · 👤 Sam W                 │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Hello, Sam                                      ⚙ Account          │  │
│  │ Mix Engineer · 3 active projects                  H3 16/600        │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────┐                                │
│  │ ┌──────────┐ ┌──────────────────────┐│                                │
│  │ │● My Tasks│ │ ○ Pending · All      ││  ← Tab bar · h 44px          │
│  │ │   (4)    │ │     (12)             ││                                │
│  │ └──────────┘ └──────────────────────┘│                                │
│  └──────────────────────────────────────┘                                │
│                                                                           │
│  ─── Assigned Tasks (4) ────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ┌── left border 3px #DC2626 ──────────────────────────────────────┐ │ │
│  │ │ 12px padding                                                      │ │ │
│  │ │                                                                   │ │ │
│  │ │ ◉ EQ drum stem                  🏷 Mastering · Lua               │ │ │
│  │ │    Due Aug 25 · 2h ago 🔴 Overdue                                 │ │ │
│  │ │                                                                   │ │ │
│  │ │ ┌──────────────┐ ┌──────────────┐                                 │ │ │
│  │ │ │ + Upload v3  │ │  Mark Done   │    ← btn M 40px · gap 8px     │ │ │
│  │ │ └──────────────┘ └──────────────┘                                 │ │ │
│  │ └──────────────────────────────────────────────────────────────────┘ │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ ┌── left border 3px #D97706 ──────────────────────────────────────┐ │ │
│  │ │ ◉ Level stems                    🏷 Mastering · Lua               │ │ │
│  │ │    Due Aug 28 · Today 🟡 This week                               │ │ │
│  │ │                                                                   │ │ │
│  │ │ ┌──────────────┐                                                  │ │ │
│  │ │ │ + Upload v2  │                                                  │ │ │
│  │ │ └──────────────┘                                                  │ │ │
│  │ └──────────────────────────────────────────────────────────────────┘ │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ ┌── left border 3px #16A34A ──────────────────────────────────────┐ │ │
│  │ │ ◉ Reverb bus setup               🏷 Mixing · Midnight Sessions    │ │ │
│  │ │    Due Sep 01 · 7 days 🟢 Future                                 │ │ │
│  │ │                                                                   │ │ │
│  │ │ ┌──────────────┐                                                  │ │ │
│  │ │ │   Start      │                                                  │ │ │
│  │ │ └──────────────┘                                                  │ │ │
│  │ └──────────────────────────────────────────────────────────────────┘ │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ ┌── left border 3px #16A34A ──────────────────────────────────────┐ │ │
│  │ │ ○ Vocal comp                      🏷 Mixing · Summer EP           │ │ │
│  │ │    Due Sep 05 · 11 days 🟢 Future                                │ │ │
│  │ │                                                                   │ │ │
│  │ │ ┌──────────────┐                                                  │ │ │
│  │ │ │   Start      │                                                  │ │ │
│  │ │ └──────────────┘                                                  │ │ │
│  │ └──────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Pending Reviews (1) ───────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ┌── left border 3px #7C3AED ──────────────────────────────────────┐ │ │
│  │ │ ⏳ Review mix v2                  🏷 Mixing · Midnight Sessions    │ │ │
│  │ │    Submitted Aug 24 by Sam W                                      │ │ │
│  │ │    SLA: Aug 27 · ████████████████░░░░░░░░  67% · 2 days remain   │ │ │
│  │ │                                                                   │ │ │
│  │ │ ┌──────────┐ ┌──────────┐                                         │ │ │
│  │ │ │  Review  │ │  Snooze  │    ← btn M 40px · gap 8px             │ │ │
│  │ │ └──────────┘ └──────────┘                                         │ │ │
│  │ └──────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Recent Activity (3) ───────────────────────────────────────────────  │
│                                                                           │
│  💬 Alex PM: "Mastering deadline moved to Aug 25"  · Lua · 2h ago       │
│  🔄 A&R requested changes on mix v1                 · Mid Sess · 1d ago │
│  🟢 Task "Import stems" completed                   · Lua · 3d ago      │
│                                                                           │
│  ─── Upcoming Deadlines (5) ────────────────────────────────────────────  │
│                                                                           │
│  🔴 Aug 25 · EQ drum stem                     · Lua · Mastering          │
│  🟡 Aug 28 · Level stems                      · Lua · Mastering          │
│  🟡 Sep 01 · Reverb bus setup                 · Mid Sess · Mixing        │
│  🟢 Sep 05 · Vocal comp                       · Summer EP · Mixing       │
│  ⚪ TBD    · Final master delivery              · Lua · Mastering          │
│                                                                           │
│  ─── Quick Links ──────────────────────────────────────────────────────   │
│                                                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                         │
│  │ Lua         │ │ Mid Sessions│ │ Summer EP   │                         │
│  │ Mastering   │ │ Mixing      │ │ Mixing      │                         │
│  │ 4 tasks     │ │ 1 task      │ │ 1 task      │                         │
│  └─────────────┘ └─────────────┘ └─────────────┘                         │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Spacing

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Content max-width: 960px · centered · p 24px                           │
│                                                                          │
│  Greeting: mb 24px (xl)                                                  │
│  Tab bar: mb 24px (xl) · tabs gap 0 · tab pill gap 4px                 │
│                                                                          │
│  Section: mb 32px (2xl)                                                  │
│  │ Section header: H2 · mb 12px (md)                                    │
│  │ Task/review card: mb 8px (sm)                                        │
│  │ Card padding: 12px (md)                                              │
│  │ Card internal gap: 8px (sm) between title and meta                   │
│  │ Card button gap: 8px (sm)                                            │
│  │ Deadlines: rows, gap 4px (xs)                                        │
│  │ Activity items: gap 8px (sm)                                         │
│  │ Quick links: flex, gap 12px (md), cards w 200px                     │
│  └────────────────────────────────────────────────────────────────────── │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Typography

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Element                │ Token         │ Size / Weight     │ Color     │
│────────────────────────┼───────────────┼───────────────────┼───────────│
│ Greeting "Hello, Sam"  │ H2            │ 20px / 600        │ #18181B   │
│ Role + project count   │ H3            │ 16px / 600        │ #52525B   │
│ Tab label              │ Body · 600    │ 14px / 600        │ #18181B   │
│ Tab count badge        │ Label         │ 12px / 500        │ #52525B   │
│ Section title          │ H2            │ 20px / 600        │ #18181B   │
│ Task title             │ Body · 600    │ 14px / 600        │ #18181B   │
│ Task meta (stage, due) │ Body Small    │ 12px / 400        │ #52525B   │
│ Task urgency label     │ Label         │ 12px / 500        │ urgency   │
│ Button text            │ Label         │ 12px / 500        │ #FFFFFF   │
│ Review SLA label       │ Body Small    │ 12px / 400        │ #52525B   │
│ Activity item          │ Body Small    │ 12px / 400        │ #52525B   │
│ Activity actor         │ Body Small·600│ 12px / 600        │ #18181B   │
│ Deadline item          │ Body Small    │ 12px / 400        │ #52525B   │
│ Quick link name        │ Body · 600    │ 14px / 600        │ #18181B   │
│ Quick link detail      │ Body Small    │ 12px / 400        │ #52525B   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Colors

### Task Card Left Border

```
Urgency     │ Border Color │ Background
────────────┼──────────────┼──────────────
Overdue     │ #DC2626      │ #FEF2F2
Today       │ #D97706      │ #FEF3C7
This week   │ #D97706      │ #FEF3C7
Future      │ #16A34A      │ #F0FDF4
Done        │ #16A34A      │ #F0FDF4
```

### Review Card

```
Element         │ Color
────────────────┼──────────
Left border     │ #7C3AED (Primary)
Background      │ #F5F3FF
SLA bar fill    │ #7C3AED
SLA bar track   │ #EDE9FE
```

### Activity Icons

```
Event           │ Icon Color
────────────────┼───────────
Comment         │ #7C3AED 💬
Status change   │ #2563EB 🔵
Task completed  │ #16A34A 🟢
Review decided  │ #7C3AED 🔄
Asset uploaded  │ #D97706 🟡
```

### Deadline Urgency

```
Urgency     │ Dot Color │ Text Color
────────────┼───────────┼─────────────
Overdue     │ #DC2626   │ #DC2626
Today       │ #D97706   │ #D97706
This week   │ #D97706   │ #52525B
Future      │ #16A34A   │ #52525B
No date     │ #A1A1AA   │ #A1A1AA
```

---

## Tab: Pending (All Tasks)

```
┌──────────────────────────────────────┐
│ ┌──────────┐ ┌──────────────────────┐│
│ │ ○ My Tasks│ │ ● Pending · All      ││
│ │   (4)    │ │     (12)             ││
│ └──────────┘ └──────────────────────┘│
└──────────────────────────────────────┘

┌─ Active (4) ────────────────────────────────────────────────────────────┐
│ [Same content as Assigned Tasks above]                                  │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Completed (8) ──────────────────────────────────────────────────────────┐
│ ✓ Import stems              Lua · Mixing · Aug 12                       │
│ ✓ Set up session            Mid Sess · Mixing · Aug 10                  │
│ ✓ Bass comp & arrangement   Mid Sess · Mixing · Aug 08                  │
│ ✓ Drum bus template         Lua · Production · Aug 05                   │
│ ✓ Guitar layers             Summer EP · Production · Aug 02            │
│ ✓ ... (3 more)                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## States

| State | Condition | Visual |
|-------|-----------|--------|
| Default (with tasks) | Assignee has active tasks | Full layout as shown |
| Empty — no tasks | 0 assigned tasks | "All clear! No assigned tasks. You'll see tasks here when a PM assigns work to you." |
| Empty — no reviews | 0 pending approvals | "All caught up! No items awaiting your review." |
| Empty — no activity | 0 recent activity events | "No recent activity. Activity will appear when your team takes action." |
| Empty — no deadlines | 0 upcoming deadlines | "No upcoming deadlines. You're ahead of schedule." |
| Loading | Data fetching | Skeleton cards. Task cards: 4 bars (title, 2 meta lines, button). |
| Error | Fetch failure | "Failed to load your tasks. [Retry]" |
| All tasks complete | All tasks DONE, 0 active | Completed section expanded. Active section hidden. Celebration banner: "All done! 🎉" |

---

## Interactions

| Element | Action | Result |
|---------|--------|--------|
| Task card | Click | Open Task Detail panel (doc 32) |
| Task button "Start" | Click | Task → IN_PROGRESS. Card updates. |
| Task button "+ Upload" | Click | Open file upload modal. Links to deliverable. |
| Task button "Mark Done" | Click | Task → DONE. Card slides out to completed section. |
| Review card "Review" | Click | Open Review Panel (doc 35) |
| Review card "Snooze" | Click | Snooze dialog: 24h / 3d / 1w |
| Activity item | Click | Navigate to relevant entity |
| Deadline item | Click | Open task detail |
| Quick link card | Click | Navigate to release at the contributor's current stage |
| Tab "Pending" | Click | Switch to Pending tab. Shows all tasks including completed. |
| Notification bell | Click | Open Notification Center (doc 41) |

---

## Responsive

| Breakpoint | Layout |
|------------|--------|
| ≥768px | Content 960px centered. Task cards full width. Quick links in a row. |
| <768px | Content full width minus 16px padding. Task cards stack full-width. Color-coded left border. Action buttons full-width. Quick links horizontal scroll. Tabs centered. |

---

## CSS Implementation

```css
.contributor-home {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.home-greeting {
  margin-bottom: 24px;

  h2 { font: var(--text-h2); }
  p  { font: var(--text-h3); color: #52525B; }
}

.home-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;

  .tab {
    padding: 10px 16px;
    border-radius: 8px;
    font: var(--text-body);
    font-weight: 600;
    cursor: pointer;
    transition: background 100ms ease;

    &.active { background: #F5F3FF; color: #7C3AED; }
    &:not(.active) { color: #52525B; }
    &:hover:not(.active) { background: #F4F4F5; }

    .tab-count {
      font: var(--text-label);
      margin-left: 4px;
    }
  }
}

.home-section {
  margin-bottom: 32px;

  h2 { font: var(--text-h2); margin-bottom: 12px; }
}

.task-item {
  border-left: 3px solid var(--urgency-color);
  background: var(--urgency-bg, #FFFFFF);
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  transition: background 100ms ease;

  &:hover { filter: brightness(0.97); }

  .task-title { font: var(--text-body); font-weight: 600; margin-bottom: 4px; }
  .task-meta { font: var(--text-body-sm); color: #52525B; }
  .task-urgency { font: var(--text-label); color: var(--urgency-color); }

  .task-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  &.overdue    { --urgency-color: #DC2626; --urgency-bg: #FEF2F2; }
  &.today      { --urgency-color: #D97706; --urgency-bg: #FEF3C7; }
  &.this-week  { --urgency-color: #D97706; --urgency-bg: #FEF3C7; }
  &.future     { --urgency-color: #16A34A; --urgency-bg: #F0FDF4; }
  &.done       { --urgency-color: #16A34A; --urgency-bg: #F0FDF4; }
}

.review-item {
  border-left: 3px solid #7C3AED;
  background: #F5F3FF;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 0 6px 6px 0;

  .review-meta { font: var(--text-body-sm); color: #52525B; }
  .review-sla {
    font: var(--text-body-sm);
    margin-bottom: 8px;
  }
  .sla-bar {
    height: 4px;
    border-radius: 2px;
    background: #EDE9FE;
    margin-bottom: 8px;
    .sla-fill { background: #7C3AED; border-radius: 2px; transition: width 300ms; }
  }
  .review-actions { display: flex; gap: 8px; }
}

.activity-item {
  font: var(--text-body-sm);
  color: #52525B;
  padding: 4px 0;
  cursor: pointer;
  &:hover { color: #18181B; }
  .actor { font-weight: 600; color: #18181B; }
  .time { color: #A1A1AA; }
}

.deadline-item {
  font: var(--text-body-sm);
  padding: 2px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  .urgency-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
}

.quick-links {
  display: flex;
  gap: 12px;
  .quick-link-card {
    width: 200px;
    padding: 12px;
    background: var(--color-surface);
    border: 1px solid #E4E4E7;
    border-radius: 8px;
    cursor: pointer;
    &:hover { border-color: #EDE9FE; }
    .ql-name { font: var(--text-body); font-weight: 600; }
    .ql-detail { font: var(--text-body-sm); color: #52525B; }
    .ql-count { font: var(--text-caption); color: #A1A1AA; }
  }
}
```
