# TASK-1603 — Pre-Release Checklist UX

## Concept

The checklist the release manager runs through before launch. Answers
three questions immediately:

1. **What is missing?** — Every incomplete item, sorted by urgency.
2. **Who owns it?** — The person responsible for resolving it.
3. **How late is it?** — Days overdue or days until due.

This is the operational view. Not an overview, not a dashboard — a
checklist designed for action.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Pre-Release Checklist · Midnight Sessions                 Oct 01 street │
│                                                                           │
│  ─── Lost Time ───────────────────────────────────── 12 days total ────  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  🔴 Overdue ──────────────────────────────────────────────────────── ││
│  │                                                                       ││
│  │  ┌─────────────────────────────────────────────────────────────────┐ ││
│  │  │ ○  Cover art not approved                         👤 A&R Sam    │ ││
│  │  │    Submitted Aug 14 by Taylor · Waiting 4 days                   │ ││
│  │  │    Due: Aug 10  🔴 6 days overdue                               │ ││
│  │  │    ┌──────────┐  ┌──────────┐  ┌──────────┐                    │ ││
│  │  │    │ Review   │  │ Reassign │  │ Snooze   │                    │ ││
│  │  │    └──────────┘  └──────────┘  └──────────┘                    │ ││
│  │  ├─────────────────────────────────────────────────────────────────┤ ││
│  │  │ ○  ISRC codes — Track 4 missing                   👤 Alex PM   │ ││
│  │  │    Other 3 tracks have ISRC. Track 4 is blank.                  │ ││
│  │  │    Due: Aug 12  🔴 4 days overdue                              │ ││
│  │  │    ┌──────────┐  ┌──────────┐  ┌──────────┐                    │ ││
│  │  │    │ Generate │  │ Reassign │  │ Snooze   │                    │ ││
│  │  │    └──────────┘  └──────────┘  └──────────┘                    │ ││
│  │  └─────────────────────────────────────────────────────────────────┘ ││
│  │                                                                       ││
│  │  🟡 Due This Week ────────────────────────────────────────────────── ││
│  │                                                                       ││
│  │  ┌─────────────────────────────────────────────────────────────────┐ ││
│  │  │ ○  UPC code not assigned                          👤 Alex PM   │ ││
│  │  │    GS1 GTIN-12 required for distribution. Not yet requested.    │ ││
│  │  │    Due: Aug 18  🟡 2 days                                     │ ││
│  │  │    ┌──────────┐  ┌──────────┐  ┌──────────┐                    │ ││
│  │  │    │ Assign   │  │ Reassign │  │ Snooze   │                    │ ││
│  │  │    └──────────┘  └──────────┘  └──────────┘                    │ ││
│  │  ├─────────────────────────────────────────────────────────────────┤ ││
│  │  │ ○  Metadata sheet for DSP submission              👤 Alex PM   │ ││
│  │  │    Genre, credits, copyright must be finalized before submit.   │ ││
│  │  │    Due: Aug 20  🟡 4 days                                     │ ││
│  │  │    ┌──────────┐  ┌──────────┐  ┌──────────┐                    │ ││
│  │  │    │ Prepare  │  │ Reassign │  │ Snooze   │                    │ ││
│  │  │    └──────────┘  └──────────┘  └──────────┘                    │ ││
│  │  └─────────────────────────────────────────────────────────────────┘ ││
│  │                                                                       ││
│  │  🟢 Due Later ─────────────────────────────────────────────────────  ││
│  │                                                                       ││
│  │  ┌─────────────────────────────────────────────────────────────────┐ ││
│  │  │ ○  DSP assets (Spotify Canvas, Apple Motion)     👤 Anna Mkt  │ ││
│  │  │    Optional but recommended for release day.                    │ ││
│  │  │    Due: Sep 20  🟢 35 days                                    │ ││
│  │  │    ┌──────────┐  ┌──────────┐  ┌──────────┐                    │ ││
│  │  │    │ Create   │  │ Reassign │  │ Snooze   │                    │ ││
│  │  │    └──────────┘  └──────────┘  └──────────┘                    │ ││
│  │  │                                                                  │ ││
│  │  ├─────────────────────────────────────────────────────────────────┤ ││
│  │  │ ○  Press photos                                    👤 Taylor   │ ││
│  │  │    3000x3000 JPG for media kit. Not yet captured.               │ ││
│  │  │    Due: Sep 25  🟢 40 days                                    │ ││
│  │  │    ┌──────────┐  ┌──────────┐  ┌──────────┐                    │ ││
│  │  │    │ Create   │  │ Reassign │  │ Snooze   │                    │ ││
│  │  │    └──────────┘  └──────────┘  └──────────┘                    │ ││
│  │  └─────────────────────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ─── Summary ──────────────────────────────────────────────────────────  │
│  🔴 2 overdue    🟡 2 this week    🟢 2 upcoming    ○ 12 complete       │
│                                                                           │
│  ─── Completed (last 7 days) ────────────────────────────────────────    │
│  ✓ Master files approved — Aug 12 · Sam                                     │
│  ✓ Stereo mix submitted — Aug 10 · Sam                                      │
│  ✓ Track metadata T1-T3 — Aug 09 · Alex                                     │
│  ✓ Release metadata set — Aug 08 · Alex                                      │
│  ✓ Cover art v3 uploaded — Aug 07 · Taylor                                    │
│  ✓ Contributors confirmed — Aug 05 · Alex                                     │
│  ✓ Raw stems delivered — Aug 01 · Producer Z                                   │
│  ✓ Track listing finalized — Jul 28 · Alex                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Checklist Item Anatomy

```
┌──────────────────────────────────────────────────────────────────────┐
│  ○  [Item title]                                  👤 [Owner name]   │
│     [Context: what's missing, why it matters, any blockers]         │
│     Due: [date]  🔴 [N days overdue / 🟡 N days / 🟢 N days]       │
│     ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│     │ [Action] │  │ Reassign │  │ Snooze   │                       │
│     └──────────┘  └──────────┘  └──────────┘                       │
└──────────────────────────────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| Checkbox ○ | Marks item as complete |
| Title | What needs to be done |
| Owner | Avatar + name, clickable to reassign |
| Context | 1-2 lines: what's missing, why it matters |
| Due date + urgency | Date with color-coded urgency indicator |
| Action button | Contextual primary action |
| Reassign | Opens user picker to reassign ownership |
| Snooze | Dismiss for 24h / 3d / 1w |

---

## Urgency Tiers

| Tier | Color | Definition | Sort Priority |
|------|-------|------------|---------------|
| 🔴 Overdue | `#DC2626` | `dueDate < now` | Highest |
| 🟡 This Week | `#D97706` | `dueDate ≤ now + 7d` | Medium |
| 🟢 Later | `#16A34A` | `dueDate > now + 7d` | Low |
| ⚪ No Deadline | `#A1A1AA` | No due date set | Lowest |

Within each tier, items are sorted by due date (most overdue first).

---

## Action Buttons

The primary action on each checklist item adapts to the item type:

| Item Type | Primary Action | What It Does |
|-----------|---------------|--------------|
| Deliverable not submitted | "Review Needed" | Opens deliverable for review / prompts submitter |
| Metadata field missing | "Fix Now" | Opens inline editor for the specific field |
| ISRC missing | "Generate" | Auto-generates ISRC for tracks without one |
| UPC missing | "Assign" | Opens UPC input form |
| Contributor missing | "Add" | Opens contributor assignment |
| DSP assets missing | "Create" | Opens asset upload |
| Approval pending | "Review" | Opens the review panel (TASK-1402) |
| General task | "Start" / "Complete" | Changes task state |

---

## Snooze Behavior

```
┌──────────────────────────┐
│  Snooze "Cover art review"│
│                            │
│  ○ 24 hours               │
│  ○ 3 days                 │
│  ○ 1 week                 │
│  ○ Until [date picker]    │
│                            │
│  ┌──────────┐ ┌──────────┐│
│  │  Snooze  │ │  Cancel  ││
│  └──────────┘ └──────────┘│
└──────────────────────────┘
```

Snoozed items disappear from the checklist until the snooze expires.
Snooze is logged in the activity feed. Items can be unsnoozed from
a "Snoozed" filter view.

---

## Completion

When a PM checks off an item:

1. Checkbox fills with ✓ animation.
2. Item moves to "Completed" section with a 300ms slide animation.
3. If the item was the last in its urgency tier, the tier header
   disappears.
4. The summary bar updates: "🔴 1 overdue" → "🔴 1 overdue" or
   disappears if zero.

Completed items are shown under a collapsible section:

```
  ─── Completed (last 7 days) ──── [▼] ────────────────────────────
  ✓ Master files approved — Aug 12 · Sam
  ✓ Stereo mix submitted — Aug 10 · Sam
  ...
```

Completed items older than 7 days are hidden by default (expand to
"Show all completed").

---

## Lost Time Metric

The header bar shows lost time — the cumulative delay across all
overdue items:

```
  ─── Lost Time ──────────────────────────────── 12 days total ────
```

Lost time = sum of `(now - dueDate)` in days for each overdue item,
rounded to whole days. This gives the PM one number to communicate to
stakeholders: "We're 12 days behind."

```
  ─── Lost Time ──────────────────────────────── 12 days total ────
    Longest delay: Cover art — 6 days overdue
```

---

## Conditionally Required Items

Some checklist items only appear when a condition is met:

| Condition | Item Appears |
|-----------|-------------|
| Release is ≤30 days from street date | "DSP assets" appears |
| Release is ≤14 days from street date | "Metadata sheet" appears |
| Release is ≤7 days from street date | "Final review by Admin" appears |
| No release date set | "Set release date" appears as first (blocking) item |

This keeps the checklist lean — it only shows what's actionable right now.

---

## Permissions

| Action | Who Can Do It |
|--------|---------------|
| View checklist | Owner, Admin, PM, A&R, Artist |
| Check off items | Owner, Admin, PM |
| Reassign ownership | Owner, Admin, PM |
| Snooze items | Owner, Admin, PM |
| Add custom checklist item | Owner, Admin, PM |
| Remove custom checklist item | Owner, Admin, PM |

---

## Custom Checklist Items

PMs can add custom items beyond the template-defined requirements:

```
┌──────────────────────────────────────────┐
│  + Add Checklist Item                     │
│                                            │
│  Title                                     │
│  ┌──────────────────────────────────────┐  │
│  │ Final listening party with Artist    │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Owner                                     │
│  ┌──────────────────────────────────────┐  │
│  │ 👤 Alex PM                           │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Due date                    📅           │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Add to Checklist                    │  │
│  └──────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

Custom items have a `custom: true` flag and a different icon (📌 instead
of ○). They are removed when checked off (not archived) unless the PM
chooses "Keep this item for future releases."

---

## Data Model

```typescript
interface ChecklistItem {
  id: string;
  releaseId: string;
  type: 'requirement' | 'deliverable' | 'metadata_field' | 'custom';
  title: string;
  description: string;          // Context: what's missing, why it matters
  category: RequirementCategory;
  status: 'open' | 'completed' | 'snoozed';
  owner?: { id: string; name: string };
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  completedBy?: string;
  snoozedUntil?: Timestamp;
  lostDays: number;             // Computed: now - dueDate in days (0 if not overdue)
  linkedResourceId?: string;    // FK to Deliverable / Requirement / Metadata field
  actionType: ChecklistAction;  // Determines the primary button
  custom: boolean;              // Added by PM, not from template
  order: number;                // Sort order within urgency tier
}

type ChecklistAction = 'review' | 'fix_now' | 'generate' | 'assign' | 'add'
  | 'create' | 'start' | 'complete' | 'prepare';
```
