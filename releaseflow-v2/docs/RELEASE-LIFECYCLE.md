# Release Lifecycle — State Machine

**Date:** 2026-06-28
**Status:** Complete

---

## Valid Transitions

**Definition**: `apps/web/src/app/(app)/releases/[id]/page.tsx` (STATUS_TRANSITIONS)

```
draft
  → planning ("Begin Planning")
  → cancelled ("Cancel Release")

planning
  → in_production ("Start Production")
  → cancelled ("Cancel Release")

in_production
  → on_hold ("Put On Hold" — requires reason)
  → ready_for_distribution ("Mark Ready")
  → cancelled ("Cancel Release")

on_hold
  → in_production ("Resume Production")
  → cancelled ("Cancel Release")

ready_for_distribution
  → released ("Publish Release")
  → in_production ("Re-Open Release")
  → cancelled ("Cancel Release")
```

---

## Unreachable States (from transitions)

- `released` → no further transitions defined (terminal)
- `archived` → no transitions defined (terminal, read-only)

---

## Cancellation

- `cancelled` is reachable from: `draft`, `planning`, `in_production`, `on_hold`, `ready_for_distribution`
- Requires confirmation: "This permanently cancels the release."
- Previous status stored in metadata for potential recovery

---

## Stage Transitions (Workflow)

Managed by `lib/workflow-progression.ts` — `stageComplete()`

```
Stage progression:
  not_started → in_progress (when previous stage completes)
  in_progress → completed (when all tasks done)
  blocked     → in_progress (when blocker resolved)

Workflow progression:
  in_progress → completed (when last stage completes)
```

---

## Illegal Transitions

- Cannot advance from `completed` stage
- Cannot advance from `released`
- Cannot advance from `archived`
- Cannot advance from `cancelled`
- Cannot put `draft` on hold
- Cannot mark `draft` as ready
