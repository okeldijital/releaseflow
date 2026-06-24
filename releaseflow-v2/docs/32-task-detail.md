# TASK-1102 — Task Detail

## Concept

A detail panel that opens when a user clicks a task card on the Task Board
(TASK-1101). Shows the task's full information: description, assignee, due
date, comments, and attachments. Also provides actions to change state or
delete the task.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Task Board (dimmed behind panel)                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  ─── Task Detail ───────────────────────────────── [×]  │     │
│  │                                                          │     │
│  │  ┌────────────────────────────────────────────────────┐ │     │
│  │  │  Title: EQ vocal chain                             │ │     │
│  │  │  Status: ○ To Do                  [Change status]  │ │     │
│  │  │  Stage: Mixing · Midnight Sessions                 │ │     │
│  │  └────────────────────────────────────────────────────┘ │     │
│  │                                                          │     │
│  │  ─── Description ──────────────────────────────────────  │     │
│  │                                                          │     │
│  │  Set up the vocal EQ chain for the lead vocal track.     │     │
│  │  Use the reference provided by the Artist.               │     │
│  │  Focus on clarity in the 2-5kHz range.                   │     │
│  │                                                          │     │
│  │  [Edit description]                                      │     │
│  │                                                          │     │
│  │  ─── Assignment ───────────────────────────────────────  │     │
│  │                                                          │     │
│  │  Assignee         │  👤 Sam Wilson · Mix Engineer    [×]  │     │
│  │  Due date         │  Jun 30, 2026              📅        │     │
│  │  Created by       │  Alex Taylor · Jun 14, 2026         │     │
│  │                                                          │     │
│  │  ─── Attachments ──────────────────────────────────────  │     │
│  │                                                          │     │
│  │  ┌─────────────────────────────────────────────────────┐ │     │
│  │  │  📁 lead-vocal-stem.wav                             │ │     │
│  │  │     24-bit / 48kHz · 152.3 MB                      │ │     │
│  │  │     Uploaded Jun 14 by Alex        [Download]       │ │     │
│  │  ├─────────────────────────────────────────────────────┤ │     │
│  │  │  📁 vocal-reference-mix.mp3                         │ │     │
│  │  │     320 kbps · 8.4 MB                              │ │     │
│  │  │     Uploaded Jun 15 by Artist X    [Download]       │ │     │
│  │  └─────────────────────────────────────────────────────┘ │     │
│  │                                                          │     │
│  │  ┌──────────────────────────────────────────────────┐    │     │
│  │  │  + Attach reference                              │    │     │
│  │  └──────────────────────────────────────────────────┘    │     │
│  │                                                          │     │
│  │  ─── Activity & Comments ──────────────────────────────  │     │
│  │                                                          │     │
│  │  🟡 Task created by Alex Taylor                         │     │
│  │     · Jun 14, 2026                                      │     │
│  │                                                          │     │
│  │  👤 Sam Wilson assigned as owner                        │     │
│  │     · Jun 15, 2026                                      │     │
│  │                                                          │     │
│  │  💬 Sam Wilson: "Looking at the reference now.          │     │
│  │     Will have v1 ready by Thursday."                     │     │
│  │     · Jun 15, 2026                                      │     │
│  │                                                          │     │
│  │  ┌────────────────────────────────────────────────┐      │     │
│  │  │  Write a comment...                      [Send]│      │     │
│  │  └────────────────────────────────────────────────┘      │     │
│  │                                                          │     │
│  │  ─── Actions ──────────────────────────────────────────  │     │
│  │                                                          │     │
│  │  └ Status: ○ To Do ────────────────────────────────────  │     │
│  │                                                          │     │
│  │  [Start Work]  or  [Mark as Done]  or  [Delete Task]    │     │
│  │                                                          │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Sections

### Header

| Field | Content | Editable |
|-------|---------|----------|
| Title | Free text (1-200 chars) | Yes — inline edit on click |
| Status | Current state as pill badge | Changed via status dropdown or action buttons |
| Stage + Release | Context: "Mixing · Midnight Sessions" | No — set at creation |

Title editing: click the title → inline text input → Save on blur or
Enter → Cancel on Escape.

### Description

| Field | Content | Editable |
|-------|---------|----------|
| Description | Markdown text area | Yes — all roles with `task:edit` |

Description supports Markdown rendering. Hover shows "[Edit description]"
button. Clicking enters edit mode: textarea with preview toggle. Save on
Ctrl+Enter or button.

### Assignment

| Field | Type | Editable By |
|-------|------|-------------|
| Assignee | User typeahead (from org) | Owner, Admin, PM, A&R |
| Due date | Date picker | Owner, Admin, PM |
| Created by | Read-only metadata | — |

Changing the assignee posts an activity event and sends a notification to
the new assignee. Clearing the assignee sets it to unassigned.

### Attachments

Shows a list of assets referenced by this task. Attachments are
**references only** — they point to existing assets in the release's
asset catalog. No separate file upload happens here.

| Column | Content |
|--------|---------|
| Icon | File type icon (📁 for stems, 🖼 for images, 📄 for docs) |
| Filename | Full name with extension |
| Specs | Format + size (e.g., "24-bit / 48kHz · 152.3 MB") |
| Source info | "Uploaded [date] by [name]" |
| Action | Download button |

"+ Attach reference" opens a modal asset picker: browse the release's
assets, select one or more files, confirm. This creates a link between
the task and the asset.

### Activity & Comments

Chronological feed of events related to this task:

| Event Type | Icon | Example |
|------------|------|---------|
| Task created | 🟡 | "Task created by Alex Taylor" |
| Status change | 🔵 | "Status changed from To Do to In Progress" |
| Assignee change | 👤 | "Sam Wilson assigned as owner" |
| Due date change | 📅 | "Due date changed from Jul 10 to Jul 15" |
| Comment | 💬 | "Sam Wilson: Will have v1 ready by Thursday." |
| Attachment added | 📎 | "Alex Taylor attached 'lead-vocal-stem.wav'" |
| Attachment removed | 📎 | "Attachment 'old-reference.mp3' removed" |

### Comment Input

Behaves identically to Stage Detail comments (TASK-802):
- Multi-line, auto-expanding, placeholder "Write a comment..."
- @mentions with typeahead from org members
- Enter to send, Shift+Enter for newline

---

## Actions

Action buttons change based on current task state:

| Current State | Available Actions |
|---------------|-------------------|
| TODO | `[Start Work]` → IN_PROGRESS |
| | `[Mark as Done]` → DONE (if task is trivial) |
| | `[Delete Task]` |
| IN_PROGRESS | `[Submit for Review]` → REVIEW |
| | `[Mark as Done]` → DONE |
| | `[Return to To Do]` → TODO |
| | `[Delete Task]` |
| REVIEW | `[Approve]` → DONE |
| | `[Reject]` → IN_PROGRESS |
| | `[Delete Task]` |
| BLOCKED | `[Unblock]` → returns to previous state (IN_PROGRESS typically) |
| DONE | `[Reopen]` → IN_PROGRESS |
| | `[Delete Task]` |

Each action requires the appropriate permission:
- `task:complete` for Mark as Done, Approve
- `task:delete` for Delete Task
- `task:edit` for Start Work, Submit for Review, Return to To Do, Reject, Reopen

---

## Status Dropdown

An alternative to the action buttons, the "Change status" dropdown in the
header allows direct status changes:

```
┌──────────────┐
│ ○ To Do      │
│ ◉ In Progress│
│ ● Blocked    │
│ ◐ Review     │
│ ✓ Done       │
└──────────────┘
```

Each option is conditionally enabled based on allowed transitions from the
current state (same rules as action buttons).

---

## States

| State | Trigger | Visual |
|-------|---------|--------|
| Open | Click task card | Panel slides in from right, 300ms ease-in-out |
| Loading | Data fetch | Skeleton: header pulse, description lines shimmer, attachment list shimmer |
| Loaded | Data received | Full content rendered |
| Saving | Field edited | Save indicator on changed field (autosave on blur except description) |
| Comment posting | Send clicked | Spinner on Send button; comment appears optimistically |
| Error | Fetch failure | "Failed to load task. [Retry]" |
| Delete confirm | Delete clicked | Confirmation dialog: "Delete [task title]? This cannot be undone." |

---

## Permissions

| Section | View | Edit |
|---------|------|------|
| Title | All with `task:view` | Owner, Admin, PM, A&R |
| Description | All with `task:view` | Owner, Admin, PM, A&R, Artist, Producer, Engineer, Designer (assigned only) |
| Assignee | All with `task:view` | Owner, Admin, PM, A&R |
| Due date | All with `task:view` | Owner, Admin, PM |
| Attachments | All with `task:view` | Owner, Admin, PM, A&R, Artist, Producer, Engineer, Designer |
| Comments | All with `task:view` | All roles with `task:view` (create comment) |
| Status actions | — | Per permission table below |

### Status Action Permissions

| Action | Required Permission | Additional Constraint |
|--------|---------------------|----------------------|
| Start Work / Submit / Return / Reopen | `task:edit` | Must be assignee or have global edit |
| Approve / Reject | `task:complete` | — |
| Mark as Done | `task:complete` | — |
| Delete | `task:delete` | — |
| Unblock | `task:edit` | — |

---

## Data Model

```typescript
interface TaskDetail {
  id: string;
  title: string;
  description?: string;        // Markdown
  state: TaskState;
  stageId: string;
  stageName: string;           // Denormalized for display
  releaseId: string;
  releaseName: string;         // Denormalized for display
  assignee?: {
    id: string;
    name: string;
    avatar: string;
  };
  dueDate?: Timestamp;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  attachments: AttachmentReference[];
  comments: Comment[];
}

interface AttachmentReference {
  id: string;
  assetId: string;             // FK to asset
  filename: string;
  format: string;              // "24-bit / 48kHz"
  sizeBytes: number;
  uploadedBy: { id: string; name: string };
  uploadedAt: Timestamp;
}

interface Comment {
  id: string;
  author: { id: string; name: string; avatar: string };
  body: string;                // Markdown
  mentions: string[];          // User IDs mentioned via @
  createdAt: Timestamp;
}
```
