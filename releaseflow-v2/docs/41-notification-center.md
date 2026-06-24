# TASK-1802 — Notification Center

## Concept

A unified notification panel grouping every alert by type. Four groups:

1. **Tasks** — assignments, deadlines, completions
2. **Deliverables** — uploads, versions, submissions
3. **Approvals** — review requests, decisions, escalations
4. **Mentions** — @mentions in comments across stages, tasks, deliverables

This replaces the generic flat notification list in the current design
(Doc 19) with a structured, filterable, actionable panel.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Notifications                                              [×]  │
│                                                                   │
│  ┌────────┬──────────┬──────────┬──────────┐                     │
│  │ ● Tasks│ ○ Approvals│ ○ Deliver| ○ Mentions│  ← Group tabs   │
│  │  (3)   │   (2)     │  (1)     │  (4)    │                     │
│  └────────┴──────────┴──────────┴──────────┘                     │
│                                                                   │
│  ─── Tasks · 3 unread ────────────────────────────────────────   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  🟡 Task assigned: "EQ vocal chain"                          │ │
│  │     Midnight Sessions · Mixing stage                        │ │
│  │     Assigned by Alex Taylor · 2 hours ago                   │ │
│  │     Due: Jun 28, 2026  🔴 Overdue                           │ │
│  │     ┌──────────┐                                             │ │
│  │     │  View    │  → opens Task Detail                        │ │
│  │     └──────────┘                                             │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  🔴 Deadline approaching: "Arrange drum patterns"            │ │
│  │     Midnight Sessions · Production stage                    │ │
│  │     Due in 24 hours · Jul 12, 2026                          │ │
│  │     ┌──────────┐                                             │ │
│  │     │  View    │                                             │ │
│  │     └──────────┘                                             │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  🟢 Task completed: "Import stems"                           │ │
│  │     Midnight Sessions · Mixing stage                        │ │
│  │     Completed by Sam Wilson · 4 hours ago                   │ │
│  │     ┌──────────┐                                             │ │
│  │     │  View    │                                             │ │
│  │     └──────────┘                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  12 older notifications · Last 7 days                 [See all]   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Mark all as read        ⚙ Notification settings         │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Group Tabs

Four horizontal tabs at the top of the panel. Each shows an unread count:

| Tab | Icon | Content | Trigger Events |
|-----|------|---------|---------------|
| Tasks | 🟡 | Task assignments, deadlines, completions, status changes | `task:assign`, `task:due_soon`, `task:complete`, `task:status_change` |
| Approvals | 🔴 | Review requests, decisions, escalations, delegation | `approval:requested`, `approval:decided`, `approval:escalated`, `approval:delegated` |
| Deliverables | 📁 | Uploads, new versions, submissions for review, granted/rejected | `deliverable:uploaded`, `deliverable:version_added`, `deliverable:submitted`, `deliverable:decided` |
| Mentions | 💬 | @mentions in comments | `comment:mentioned` |

Tapping a tab filters the list. The active tab has a bottom border. All
tabs are always visible. Tapping the same tab again scrolls to the top.

---

## Notification Item Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│  [Icon] [Action] [Entity name]                          ⋯ [Menu] │
│         [Context] · [Relative time]                              │
│         [Due date / urgency indicator]                           │
│         ┌──────────┐                                             │
│         │  Action  │  ← Contextual button (View / Review / etc)  │
│         └──────────┘                                             │
└──────────────────────────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| Icon | Color-coded type indicator (see icon table below) |
| Action | Bold user name + action text |
| Entity name | Release name + stage/context |
| Relative time | "2 hours ago", "1 day ago" |
| Urgency | Optional: "Overdue 🔴", "Due today 🟡" |
| Action button | "View" (most cases), "Review" (approvals), "Reply" (mentions) |
| Menu (⋯) | "Mark as read", "Mute this type", "Snooze 1 hour" |

---

## Icon & Color Mapping

| Event Type | Icon | Color | CSS Class |
|------------|------|-------|-----------|
| Task assigned | 📋 | Amber `#D97706` | `.notify-task` |
| Task due soon | 🔴 | Red `#DC2626` | `.notify-task-urgent` |
| Task completed | 🟢 | Green `#16A34A` | `.notify-task-done` |
| Task status change | 🔵 | Blue `#2563EB` | `.notify-task` |
| Approval requested | 📬 | Red `#DC2626` | `.notify-approval` |
| Approval granted | ✅ | Green `#16A34A` | `.notify-approval-done` |
| Approval changes requested | 🔄 | Amber `#D97706` | `.notify-approval` |
| Approval rejected | ✕ | Red `#DC2626` | `.notify-approval-urgent` |
| Approval escalated | ⚠ | Red `#DC2626` | `.notify-approval-urgent` |
| Deliverable uploaded | 📁 | Blue `#2563EB` | `.notify-deliverable` |
| Version added | 🔖 | Blue `#2563EB` | `.notify-deliverable` |
| Deliverable submitted | 📤 | Purple `#7C3AED` | `.notify-deliverable` |
| Deliverable granted/rejected | ✅ / ✕ | Green / Red | `.notify-deliverable` |
| @mention | 💬 | Primary `#7C3AED` | `.notify-mention` |

---

## Unread vs Read

| State | Visual |
|-------|--------|
| Unread | Left border 3px Primary `#7C3AED`; slight purple tint background; bold entity name |
| Read | No left border; white background; normal weight |

Clicking a notification marks it as read. Marking as read is immediate
(optimistic UI update, confirmed by backend).

---

## Actions Per Notification Type

| Type | Primary Action | Secondary Action |
|------|---------------|-----------------|
| Task assigned / due soon | "View" → opens Task Detail (TASK-1102) | "Snooze 1h" |
| Task completed | "View" → opens Task Detail | — |
| Approval requested | "Review" → opens Review Panel (TASK-1402) | "Snooze 1d" |
| Approval decided | "View" → opens the affected entity | — |
| Deliverable uploaded / versioned | "View" → opens Deliverable (TASK-1401) | — |
| Deliverable submitted | "Review" → opens Review Panel | "Snooze 1d" |
| Mention | "Reply" → opens comment input, focused and pre-@'d | "View" → opens context |

---

## Filtering & Search

```
┌──────────────────────────────────────────────────┐
│  🔍 Search notifications...                       │
│                                                    │
│  Show: ◉ All  ○ Unread only                       │
│  From: ◉ All releases  ○ Midnight Sessions ▼      │
│  Since: ◉ All time  ○ Today  ○ This week          │
└──────────────────────────────────────────────────┘
```

The search box filters across all groups simultaneously. Selecting a
specific release shows only notifications for that release. Unread-only
toggle hides read items.

---

## Notification Settings

Accessed via ⚙ in the footer or Settings > Account > Notifications:

```
┌──────────────────────────────────────────────────────────┐
│  Notification Preferences                                 │
│                                                           │
│  ─── Tasks ────────────────────────────────────────────  │
│  ☑ Task assigned to me           In-app  ☑  Email  ☑   │
│  ☑ Task due in 24 hours          In-app  ☑  Email  ☐   │
│  ☐ Task completed by others      In-app  ☐  Email  ☐   │
│                                                           │
│  ─── Approvals ────────────────────────────────────────  │
│  ☑ Review requested from me      In-app  ☑  Email  ☑   │
│  ☑ Review decision on my work    In-app  ☑  Email  ☐   │
│  ☐ Approval escalated            In-app  ☐  Email  ☐   │
│                                                           │
│  ─── Deliverables ─────────────────────────────────────  │
│  ☑ New version on my deliverable In-app  ☑  Email  ☐   │
│  ☐ Deliverable status change     In-app  ☐  Email  ☐   │
│                                                           │
│  ─── Mentions ─────────────────────────────────────────  │
│  ☑ @mentioned in comments        In-app  ☑  Email  ☑   │
│                                                           │
│  ─── Digest ───────────────────────────────────────────  │
│  Daily summary email:  ◉ Yes  ○ No                      │
│  Send at:  [9:00 AM ▼]  [America/New_York ▼]            │
└──────────────────────────────────────────────────────────┘
```

---

## Email Digest

Users who enable the daily digest receive one email per day summarizing
their notifications:

```
Subject: ReleaseFlow Daily Digest — Aug 15, 2026

┌──────────────────────────────────────────────────┐
│  ◐ ReleaseFlow                                   │
│                                                   │
│  Here's your daily summary for Aug 15, 2026.      │
│                                                   │
│  ── Tasks ──                                     │
│  • EQ drum stem is overdue (2 days)              │
│  • Set up reverb bus due tomorrow                │
│                                                   │
│  ── Approvals ──                                 │
│  • Sam Wilson approved your Mastering stage      │
│                                                   │
│  ── Mentions ──                                  │
│  • Alex Taylor mentioned you in Mixing stage     │
│                                                   │
│  View all: https://app.releaseflow.app/           │
│                                                   │
│  Manage preferences: [link to settings]           │
└──────────────────────────────────────────────────┘
```

---

## Real-Time Updates

Notifications use Firestore real-time listeners:

| Channel | Scope |
|---------|-------|
| `notifications/{userId}` | All notifications for the current user |
| On new document | → Appears at top of list, bell badge increments |
| On read status change | → Visual update (bold → normal, border removed) |
| On "Mark all as read" | → Bulk update, all items in current group marked read |

The bell icon in the top nav shows a count badge:

```
🔔 (5)
```

The badge counts only UNREAD notifications across all groups. Opening
the panel does NOT clear the badge — the badge clears only when items
are individually marked as read or when "Mark all as read" is clicked.

---

## Data Model

```typescript
interface Notification {
  id: string;
  userId: string;
  group: NotificationGroup;
  type: NotificationType;
  title: string;                 // "Task assigned: EQ vocal chain"
  body: string;                  // "Midnight Sessions · Mixing stage"
  severity: 'info' | 'warning' | 'urgent';
  isRead: boolean;
  readAt?: Timestamp;
  action: {
    type: 'view' | 'review' | 'reply';
    resourceType: string;        // 'task' | 'stage' | 'deliverable' | 'release'
    resourceId: string;
    url: string;                 // Deep link to the entity
  };
  actor: {
    id: string;
    name: string;
  };
  metadata?: {
    dueDate?: Timestamp;
    releaseName?: string;
    stageName?: string;
  };
  createdAt: Timestamp;
}

type NotificationGroup = 'tasks' | 'approvals' | 'deliverables' | 'mentions';
type NotificationType = 'task:assign' | 'task:due_soon' | 'task:complete'
  | 'task:status_change' | 'approval:requested' | 'approval:decided'
  | 'approval:escalated' | 'approval:delegated' | 'deliverable:uploaded'
  | 'deliverable:version_added' | 'deliverable:submitted' | 'deliverable:decided'
  | 'comment:mentioned';
```
