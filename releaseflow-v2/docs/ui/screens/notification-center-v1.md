# Notification Center v1 — Visual Spec

## Route

Slide-out panel triggered by 🔔 bell icon in Top Nav. No route.

## Backend Entity Validation

| Entity | Source | Validated |
|--------|--------|-----------|
| notifications | `notifications` collection, `userId = currentUser.id` | ✅ |
| approval_requests | `approvals` (drives "review requested" notification items) | ✅ |
| tasks | `tasks` (drives "task assigned", "due soon", "completed" items) | ✅ |
| deliverables | `deliverables` (drives "version uploaded", "submitted" items) | ✅ |
| activities | `activity` log (drives notification content text) | ✅ |

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  background overlay · rgba(0, 0, 0, 0.3)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Notification Panel · w 400px · h 100vh · bg Surface       │ │
│  │  slides from right · 300ms ease-in-out                      │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │  🔔 Notifications                            [×]     │   │ │
│  │  │  ───────────────────────────────────────────────────  │   │ │
│  │  │                                                      │   │ │
│  │  │  ┌──────────┬──────────┬──────────┬──────────┐       │   │ │
│  │  │  │● All (12)│ Tasks (3)│Approvals(2│Deliver(1)│       │   │ │
│  │  │  └──────────┴──────────┴──────────┴──────────┘       │   │ │
│  │  │  ┌──────────┐                                          │   │ │
│  │  │  │○Mentions(4)│                                        │   │ │
│  │  │  └──────────┘                                          │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  │                                                              │ │
│  │  ─── All · 12 unread ─────────────────────────────────────   │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │ 🟡 Task assigned: "EQ drum stem"                      │  │ │
│  │  │     Lua · Mastering · Assigned by Alex PM             │  │ │
│  │  │     Due Aug 25 · 2h ago                               │  │ │
│  │  │     ┌──────────┐                                       │  │ │
│  │  │     │  View    │                                       │  │ │
│  │  │     └──────────┘                                       │  │ │
│  │  ├────────────────────────────────────────────────────────┤  │ │
│  │  │ 🔴 Approval requested: Mastering Stage                │  │ │
│  │  │     Lua · Submitted by Sam W · SLA Aug 23            │  │ │
│  │  │     2 days overdue · 2h ago                           │  │ │
│  │  │     ┌──────────┐                                       │  │ │
│  │  │     │  Review  │                                       │  │ │
│  │  │     └──────────┘                                       │  │ │
│  │  ├────────────────────────────────────────────────────────┤  │ │
│  │  │ 🔴 Deadline tomorrow: "EQ drum stem"                  │  │ │
│  │  │     Lua · Mastering · Due Aug 25 · 3h ago            │  │ │
│  │  │     ┌──────────┐                                       │  │ │
│  │  │     │  View    │                                       │  │ │
│  │  │     └──────────┘                                       │  │ │
│  │  ├────────────────────────────────────────────────────────┤  │ │
│  │  │ 🟢 Task completed: "Import stems"                     │  │ │
│  │  │     Lua · Mixing · Completed by Sam W · 5h ago       │  │ │
│  │  │     ┌──────────┐                                       │  │ │
│  │  │     │  View    │                                       │  │ │
│  │  │     └──────────┘                                       │  │ │
│  │  ├────────────────────────────────────────────────────────┤  │ │
│  │  │ 📁 Version uploaded: "master-v1.wav"                   │  │ │
│  │  │     Lua · Mastering · Uploaded by Sam W · 5h ago      │  │ │
│  │  │     ┌──────────┐                                       │  │ │
│  │  │     │  View    │                                       │  │ │
│  │  │     └──────────┘                                       │  │ │
│  │  ├────────────────────────────────────────────────────────┤  │ │
│  │  │ 💬 Alex PM mentioned you                               │  │ │
│  │  │     Lua · Mastering · "Mastering deadline moved..."   │  │ │
│  │  │     2h ago                                            │  │ │
│  │  │     ┌──────────┐                                       │  │ │
│  │  │     │  Reply   │                                       │  │ │
│  │  │     └──────────┘                                       │  │ │
│  │  ├────────────────────────────────────────────────────────┤  │ │
│  │  │ ... 6 older notifications                             │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │  Mark all as read          ⚙ Notification Settings   │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Spacing

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Panel: w 400px · h 100vh · p 16px · overflow-y auto                   │
│                                                                          │
│  Header: mb 12px (md) · h 56px                                          │
│  Tab row: mb 16px (lg) · tabs gap 0                                    │
│  Tab pill: p 6px 12px · radius 9999px                                   │
│  Section label: mb 8px (sm) · "12 unread" aligned right               │
│                                                                          │
│  Notification item: mb 4px (xs) · p 10px 12px · radius 6px            │
│  │ Unread: left border 3px Primary · bg tint                           │
│  │ Read: no border · bg transparent                                     │
│  │ Item gap: 4px (xs) between icon and content                          │
│  │ Action button: mt 8px                                                │
│  │ Divider between items: 1px solid #F1F5F9                             │
│  └────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  Footer: sticky bottom · p 12px 16px · bg Surface · border-t 1px       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Typography

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Element                │ Token         │ Size / Weight     │ Color     │
│────────────────────────┼───────────────┼───────────────────┼───────────│
│ Panel title            │ H3            │ 16px / 600        │ #18181B   │
│ Tab label              │ Label         │ 12px / 500        │ #52525B   │
│ Tab count              │ Label         │ 12px / 500        │ #52525B   │
│ Section label          │ Label         │ 12px / 500        │ #52525B   │
│ Notification actor     │ Body · 600    │ 14px / 600        │ #18181B   │
│ Notification action    │ Body          │ 14px / 400        │ #18181B   │
│ Notification context   │ Body Small    │ 12px / 400        │ #52525B   │
│ Notification time      │ Body Small    │ 12px / 400        │ #A1A1AA   │
│ Urgency label          │ Caption       │ 11px / 400        │ urgency   │
│ Action button          │ Label         │ 12px / 500        │ #7C3AED   │
│ Footer text            │ Body Small    │ 12px / 400        │ #52525B   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Colors

### Notification Type Icons

```
Type                │ Icon │ Color
────────────────────┼──────┼──────────
Task assigned       │ 🟡   │ #D97706
Task due soon       │ 🔴   │ #DC2626
Task completed      │ 🟢   │ #16A34A
Approval requested  │ 🔴   │ #DC2626
Approval decided    │ 🟢/🔴│ #16A34A / #DC2626
Deliverable uploaded│ 📁   │ #2563EB
Version added       │ 🔖   │ #2563EB
Deliverable decided  │ 🟢/🔴│ #16A34A / #DC2626
@mention            │ 💬   │ #7C3AED
System              │ 🔵   │ #2563EB
```

### Notification Row States

```
State       │ Background    │ Left Border    │ Icon
────────────┼───────────────┼────────────────┼────────
Unread      │ #F5F3FF       │ 3px #7C3AED    │ Full color
Read        │ transparent   │ none           │ Muted
Hover       │ #F4F4F5       │ (unchanged)    │ (unchanged)
```

### Tab Pill States

```
State       │ Background    │ Text
────────────┼───────────────┼──────────
Active      │ #F5F3FF       │ #7C3AED
Inactive    │ transparent   │ #52525B
Hover       │ #F4F4F5       │ #52525B
```

---

## Filter Tabs

```
All (12)    Tasks (3)    Approvals (2)    Deliverables (1)    Mentions (4)
```

Each tab filters the notification list. The count badge shows unread count
for that group. Clicking a tab filters to that group only. Active tab has
a primary background.

---

## Notification Item Anatomy

### Unread

```
┌── left border 3px #7C3AED ────────────────────────────────────────────┐
│ 10px padding · bg #F5F3FF                                              │
│                                                                         │
│  🟡 Alex PM assigned you "EQ drum stem"              ⋯                  │
│      Lua · Mastering · Due Aug 25 · 2h ago                             │
│      ┌──────────┐                                                      │
│      │  View    │                                                      │
│      └──────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Read

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 10px padding · bg transparent                                           │
│                                                                         │
│  🟡 Alex PM assigned you "EQ drum stem"              ⋯                  │
│      Lua · Mastering · Due Aug 25 · 2h ago                             │
│      ┌──────────┐                                                      │
│      │  View    │                                                      │
│      └──────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Actions by Notification Type

| Type | Primary Action | Secondary |
|------|---------------|-----------|
| Task assigned | "View" → opens Task Detail | ⋯ → "Mark as read", "Mute this type" |
| Task due soon | "View" → opens Task Detail | ⋯ → "Mark as read" |
| Approval requested | "Review" → opens Review Panel | ⋯ → "Mark as read" |
| Approval decided | "View" → opens entity | — |
| Deliverable uploaded | "View" → opens Deliverable | — |
| @mention | "Reply" → opens comment input, pre-@'d | ⋯ → "View" → context |
| Task completed | "View" → opens Task Detail | — |

---

## States

| State | Condition | Visual |
|-------|-----------|--------|
| Default | Notifications exist | Full list as shown |
| Empty — all read | 0 unread, has read items | "No new notifications." with older read items visible |
| Empty — never had any | 0 notifications total | "No notifications yet. Notifications will appear here when your team takes action." |
| Filtered | Tab filter active | Only matching items shown. |
| Loading | Panel opens, data fetching | Skeleton rows: 6 items with pulsing bars. |
| Error | Fetch failure | "Failed to load notifications. [Retry]" |
| Mark all as read | Footer button clicked | All items transition to read state. 300ms fade. |

---

## Bell Badge Behavior

```
🔔 · 0 unread → no badge
🔔 (3) · 3 unread → red badge
🔔 (12) · 12 unread → red badge, max display "9+"
```

The badge counts only unread notifications across all groups. Opening the
panel does NOT clear the badge. Badge clears when items are read.

---

## Interactions

| Element | Action | Result |
|---------|--------|--------|
| Panel open | Bell icon click | Panel slides in. Bell badge persists. |
| Panel close | × click or click outside | Panel slides out. |
| Notification item | Click body | Marks as read. Navigates to entity. |
| "View" button | Click | Same as clicking body. |
| "Review" button | Click | Opens Review Panel. Closes notification panel. |
| "Reply" button | Click | Opens entity at comment input. |
| Tab pill | Click | Filter list to that group. |
| "Mark all as read" | Click | All current items → read. Badge clears. |
| Notification settings | Click | Navigate to Settings > Account > Notifications. |
| ⋯ menu | Click | "Mark as read", "Mute this type", "Snooze 1h". |

---

## Responsive

| Breakpoint | Panel |
|------------|-------|
| ≥768px | 400px slide-out from right. Content behind dimmed. |
| <768px | Full-screen panel. Swipe right to close. "← Back" header. |

---

## CSS Implementation

```css
.notification-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: #FFFFFF;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 300ms ease-in-out;

  &.open { transform: translateX(0); }
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #E4E4E7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  flex-shrink: 0;

  h3 { font: var(--text-h3); }
  .close-btn { cursor: pointer; font-size: 20px; color: #A1A1AA; }
}

.panel-tabs {
  padding: 12px 16px;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  flex-shrink: 0;
  border-bottom: 1px solid #F1F5F9;

  .tab {
    padding: 6px 12px;
    border-radius: 9999px;
    font: var(--text-label);
    cursor: pointer;
    white-space: nowrap;

    &.active { background: #F5F3FF; color: #7C3AED; }
    &:not(.active) { color: #52525B; }
    &:hover:not(.active) { background: #F4F4F5; }

    .tab-count { margin-left: 2px; opacity: 0.7; }
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.notification-item {
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: background 100ms;
  position: relative;

  &.unread {
    background: #F5F3FF;
    border-left: 3px solid #7C3AED;
    margin-left: -3px;
  }

  &:hover { background: #F4F4F5; }

  .notif-icon { margin-right: 4px; }
  .notif-actor { font: var(--text-body); font-weight: 600; }
  .notif-action { font: var(--text-body); }
  .notif-context { font: var(--text-body-sm); color: #52525B; }
  .notif-time { font: var(--text-body-sm); color: #A1A1AA; }

  .notif-action-btn {
    all: unset;
    font: var(--text-label);
    color: #7C3AED;
    cursor: pointer;
    margin-top: 8px;
    &:hover { text-decoration: underline; }
  }

  .notif-menu {
    position: absolute;
    right: 12px;
    top: 10px;
    cursor: pointer;
    color: #A1A1AA;
    &:hover { color: #52525B; }
  }
}

.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid #E4E4E7;
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
  font: var(--text-body-sm);
  color: #52525B;

  button {
    all: unset;
    cursor: pointer;
    &:hover { color: #18181B; }
  }
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
  opacity: 0;
  transition: opacity 300ms ease-in-out;
  pointer-events: none;

  &.open {
    opacity: 1;
    pointer-events: auto;
  }
}
```
