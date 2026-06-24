# Design Principles

## Source of Truth

This document governs all UX decisions. Every screen, component, and
interaction must be traceable to one or more of these principles.
When trade-offs arise, the principles below dictate the resolution.

---

## Principles

### 1. Clarity over Complexity

Every screen should be understandable at a glance. If a user needs
a tutorial to navigate a view, the design has failed.

**Rules of thumb:**
- One primary action per page; secondary actions are subordinate
- No field without a label; no label without a field
- Confirmation dialogs explain *what happened* and *what happens next*
- Error messages state the problem and the fix in plain language
- Empty states are helpful, not blank

### 2. Workflow First

ReleaseFlow is a production tool, not a dashboard toy. The workflow
pipeline is the most important visual element on every release page.

**Rules of thumb:**
- The stage pipeline is always visible on the release workspace
- Task lists are grouped by stage, not by assignee
- Progress indicators show stage completion, not arbitrary percentages
- Deadlines are tied to stages, not to the release as a whole
- The next required action is always surfaced (never hidden in a menu)

### 3. Release-Centric Navigation

The release is the atomic unit of the system. Every feature orbits
around it.

**Rules of thumb:**
- Global nav favors release-related destinations
- Contextual nav within a release workspace covers all sub-features
- Dashboard is a cross-release overview, not a standalone product
- Search defaults to release titles; all other entities secondary
- The "New Release" action is always one click away

### 4. Mobile Friendly

The app must be usable on a phone during studio sessions, at venues,
and on the go.

**Rules of thumb:**
- All core workflows (view release, approve stage, check tasks) work
  on a 375px viewport
- Sidebar collapses to bottom tab bar below 640px
- Tables reflow to cards below 768px
- Touch targets are minimum 44x44px
- No horizontal scrolling on any view
- Critical actions (approve, reject, complete) are thumb-reachable

### 5. Minimal Clicks

Every interaction that takes more than 3 clicks should be scrutinized.
The release creation flow targets under 60 seconds.

**Rules of thumb:**
- Defaults are pre-filled intelligently (label from org, date +90 days)
- Batch operations supported (multi-select tracks, bulk assign tasks)
- Keyboard shortcuts for power users (`a` approve, `r` reject, `n` new)
- Modals for creation flows (no page navigation for CRUD)
- Autosave eliminates "Save" buttons where possible

### 6. Progress Visibility

Users should always know where they are in any process — from a single
task to the full release lifecycle.

**Rules of thumb:**
- Every stage in the pipeline shows its status at a glance
- Task completion drives stage advancement visually
- Deadlines use semantic colors (green/amber/red) without relying on
  color alone (icons + text also signal urgency)
- Step indicators in wizards show total steps and current position
- Activity feeds show what changed and who changed it

### 7. Role-Based Experiences

The system adapts to who you are. An Artist sees a different release
workspace than a Project Manager.

**Rules of thumb:**
- Navigation items are hidden if the user has no permission for them
- Actions that a user cannot take are hidden, not disabled grayed out
- Dashboard shows role-relevant metrics (Artist sees their releases,
  PM sees all pending tasks)
- "Coming Soon" tabs are shown to all roles but have the same
  informational empty state
- Notification preferences are per-role (Engineer gets task assigns,
  A&R gets approval requests)

---

## Inspiration

### Linear

**What we borrow:** Keyboard-first navigation, minimal UI chrome,
progress visibility through the issue pipeline.

- Keyboard shortcuts as a primary interaction model, not an afterthought
- Single-column layout with clear hierarchy (no split panes)
- `j`/`k` navigation through lists, `Enter` to open
- The pipeline view as a sequence of clearly distinguishable states

### Notion

**What we borrow:** Block-based content editing, nested navigation,
wiki-quality documentation surfaces.

- The release workspace as a structured document (metadata block,
  track list block, workflow block)
- Collapsible sections for long forms
- `/` command palette for quick actions
- Inline editing without mode switches

### ClickUp

**What we borrow:** Custom views, hierarchy clarity, ClickApp
extensibility concept.

- Multiple view types for the same data (list, kanban, calendar)
- Clear folder > list > task hierarchy (mirrored as
  Organization > Release > Track)
- Custom fields that per-org admin can configure on templates
- Status-based workflows with clear entry/exit criteria

### Asana

**What we borrow:** Timeline view, dependency management, clear
assignment model.

- Release timeline as a Gantt-like view (stages with durations)
- Task dependencies modeled as blocking/blocked-by relationships
- Clear "Assignee" and "Reviewer" distinction on every task
- Portfolios as a cross-release status view (Organization > Releases)

---

## Anti-Patterns (What We Avoid)

| Anti-pattern                     | Why                                       |
|----------------------------------|-------------------------------------------|
| Feature walls                    | "Coming Soon" is fine; 50 gray buttons is not |
| Modal inception                  | No modal on top of a modal                |
| Disabled buttons without tooltip | Hide instead; if shown, explain why       |
| Infinite scroll for tables       | Paginate at 25 rows; let user choose more |
| Toast spam                       | One notification at a time; queue rest    |
| Confirmation on every action     | Only if destructive or irreversible       |
| Over-engineered empty states     | Simple icon + message + CTA is enough     |
| Settings buried in menus         | One-click from avatar; searchable         |
