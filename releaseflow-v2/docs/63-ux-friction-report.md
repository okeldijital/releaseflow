# TASK-3002 — UX Friction Report

## Methodology

Each doc was reviewed for friction across three dimensions:
1. **Too Many Clicks** — Does the user need more than 3 clicks to reach a
   common destination?
2. **Confusing Flows** — Are there ambiguous entry points, overlapping
   workspaces, or unclear navigation paths?
3. **Missing Shortcuts** — Are common actions missing direct access?

---

## Finding 1: Too Many Clicks

### Workspace Switching (4–5 clicks)

A PM doing daily review needs to check: release overview → workflow →
budget → campaign. Each requires navigating to a different tab or
workspace.

```
Current path to check budget:
1. Open release
2. Click Budget tab (or navigate to Budget Workspace from sidebar)
3. Review costs
4. Click Back
5. Click Campaign tab
6. Review campaign health

Result: 6 clicks to check two things.
```

**Recommendation:** Add a "Quick Jump" bar at the top of every workspace:

```
┌──────────────────────────────────────────────────────────┐
│  Midnight Sessions                                       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐│
│  │Overview│ │Workflow│ │Budget  │ │Campaign│ │Distrib││
│  └────────┘ └────────┘ └────────┘ └────────┘ └───────┘│
└──────────────────────────────────────────────────────────┘
```

Each jump goes directly to the relevant workspace tab, reducing 6 clicks to 2.

### Approval Queue (3+ clicks)

An A&R reviewer needs to: open notifications → find approval request →
click "Review" → open review panel → listen to audio → decide.

The audio playback requires the reviewer to open an attachment, which is
another click. For an A&R reviewing 5 mixes in a row, this is fatiguing.

**Recommendation:** Inline audio player directly in the review panel.
"Approve" and "Next" buttons to move through the approval queue without
returning to the notification center.

### Adding a Cost (4 clicks)

```
1. Navigate to Budget Workspace
2. Click Costs tab
3. Click "+ Add Cost"
4. Fill modal
5. Submit

But if the PM is in the Deliverable Workspace and realizes they need to
log a cost, they must leave that context entirely.
```

**Recommendation:** "+ Add Cost" as a context action wherever cost data is
referenced. Add a Quick Action shortcut from any workspace.

---

## Finding 2: Confusing Flows

### Overlapping Workspaces

A PM sees three workspaces that all relate to "completeness":

| Workspace | What It Shows | Confusion |
|-----------|---------------|-----------|
| Requirements Workspace (38) | Template-defined requirements | "What does the template say I need?" |
| Deliverable Workspace (34) | Actual files and their status | "What has been delivered?" |
| Distribution Workspace (43) | DSP-specific requirements | "What does Spotify need?" |

A PM might not know which workspace to check for a given question.

**Recommendation:** Merge Requirements into the Deliverable Workspace as a
filter. The Deliverable Workspace already shows status — adding a
"Required by template" column and a "Show only missing" filter removes
the need for a separate Requirements view.

### Two Stage Views

The Workflow Board (doc 28) shows stages as columns. The Stage Detail
(doc 29) shows a single stage's details. There are two ways to interact
with the same entity depending on whether you clicked the column or the
"View" button.

**Recommendation:** Consistent behavior — clicking a stage column always
opens the Task Board (kanban) inline below the board. The Stage Detail
panel is accessible from a ⚙ icon on the stage column header. This
separates "I want to see tasks" from "I want to edit stage metadata."

### Multiple Health Models

A PM sees three health indicators that use different vocabularies:

| Model | States | For |
|-------|--------|-----|
| Release Health (30) | Green / Amber / Red | Execution risk |
| Release Readiness (37) | Ready / At Risk / Blocked | Shipping readiness |
| Campaign Health (48) | On Track / At Risk / Delayed | Campaign status |

A new PM will not immediately know which model to consult for which
decision.

**Recommendation:** Add a tooltip to each health badge explaining what it
measures. Example: hover "🟡 At Risk" → "2 overdue stages. 1 blocked
stage. Check Workflow tab." This educates the PM over time.

---

## Finding 3: Missing Shortcuts

### No "Jump to My Task"

A Producer opens the app. They see the Contributor Home (doc 42) with
"My Tasks." But clicking a task opens the Task Detail panel — from there,
how do they get to the Deliverable Workspace to upload a file?

**Recommendation:** Task Detail panel includes a "Go to Deliverable"
button when the task is linked to a deliverable. One click opens the
Deliverable Workspace filtered to that deliverable.

### No "Notify All"

When a stage is blocked, the PM may want to notify all contributors
affected. Currently, each notification must be sent manually.

**Recommendation:** "Notify Stage Team" button on the Stage Detail panel.
Sends a single notification to all contributors assigned to that stage.

### No "Duplicate Release"

If a label frequently releases similar content (e.g., an EP every quarter
with the same workflow, same artist, same budget), there's no way to
duplicate a release as a template.

**Recommendation:** "Duplicate as Template" on the Release Settings tab.
Copies workflow, budget categories, contributor slots, and deliverable
requirements. The PM adjusts the title and date.

### No "Bulk Assign"

If 4 tracks all need the same Mix Engineer, the PM must assign the
engineer 4 times.

**Recommendation:** "Apply to all tracks" checkbox when assigning a
contributor at the release level.

### No Command Palette

Power users (PMs running 10+ releases) need keyboard shortcuts.

**Recommendation:** `Cmd+K` command palette:
```
> Go to Midnight Sessions
> Create task in Mastering
> Assign Sam W to...
> Check budget for Lua
> Run DSP readiness on Summer EP
```

---

## Finding 4: Context Loss

### Navigation Erases Context

If a PM is viewing the Mastering stage of Midnight Sessions and clicks
"Back to Releases," then clicks "Summer EP," then clicks "Artwork" —
they've lost their place in Midnight Sessions.

**Recommendation:** Breadcrumb history remembers the last-viewed tab per
release. When the PM returns to Midnight Sessions, they land on Mastering,
not Overview.

### No "What Changed?" Summary

When a PM returns after 3 days away, there's no summary of what changed.
They must manually check each release, stage, and task.

**Recommendation:** A "Since you were last here" section on the Operations
Center showing: tasks completed, stages advanced, approvals decided,
alerts resolved since the user's last session.

---

## Summary

| Category | Findings | Severity |
|----------|----------|----------|
| Too Many Clicks | 3 | Medium |
| Confusing Flows | 3 | Medium |
| Missing Shortcuts | 5 | Medium–High |
| Context Loss | 2 | Low |

### Top 3 Priorities

1. **Quick Jump bar** (cross-workspace navigation) — highest impact for PM productivity
2. **Command palette** (`Cmd+K`) — largest quality-of-life improvement for power users
3. **Merge Requirements into Deliverable Workspace** — removes a confusing workspace duplication
