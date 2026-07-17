# UX-001 — Assignment Workspace Refinement

**Status:** Implemented  
**Priority:** P1  
**Depends on:** ARS-003, ARS-004, BUG-002  

## Summary

Polishes the Assignment Detail Workspace: human-readable activity, clearer header hierarchy, themed sidebar, live comments, and removal of estimated hours from operational UI.

## Header (UX-001.2)

```
Title
Release          → linked name
Assigned to      → display name
Role             → contribution role
Status / Priority / Due date
```

Watching is secondary (sidebar + overflow only).

## Sidebar (UX-001.3)

Token-based: `bg-layer-2`, `text-content-primary`, `text-content-label`, `border-surface-700`.

Sections: Release artwork, Status, Priority, Assignee, Assigned by, Contribution role, Due date, Watch.

## Activity (UX-001.1)

`ActivityTimeline` + `humanizeAssignmentActivity`:

- Sentence form with display names only
- Strips leaked Firebase/Person IDs from legacy `metadata.details`
- Actor resolution via `resolveActorDisplayNames` (Person.id **or** Auth uid → org people)

Examples:

- “Kinn Timo created this assignment.”
- “StiffPap accepted this assignment.”
- “StiffPap added a comment.”

## Comments (UX-001.4)

```
Form → assignment-comments-service → assignment_comments collection
     → onSnapshot (repository) → panel
```

- Single collection: `assignment_comments`
- `subscribeAssignmentComments` for live updates
- Optimistic insert after post
- Empty: “Start the discussion for this assignment.”

## Hours removal (UX-001.5)

Removed from:

- Assignment create form
- Assignment detail Details card
- My Work est. hours tile / row display

Repository fields remain optional for analytics/capacity until a dedicated cleanup migration; not written from UX create path.

## Performance (UX-001.11)

`useAssignment` sets primary assignment + loading false before waiting on activity/links/context.

## Files

| File | Change |
|------|--------|
| `activity-timeline.tsx` | Human sentences |
| `assignment-comments-repository.ts` | Live subscribe |
| `assignment-comments-panel.tsx` | Snapshot + optimistic |
| `assignments/[id]/page.tsx` | Header/sidebar/layout |
| `assignment-create-form.tsx` | No est. hours |
| `resolve-person-names.ts` | `resolveActorDisplayNames` |
| `useAssignment.ts` | Faster primary load + activity names |
| `my-work/page.tsx` | No hours UI |

## Acceptance

| Check | Status |
|-------|--------|
| No Firebase IDs in activity UI | ✓ |
| Display names for actors | ✓ |
| Sidebar dark-theme tokens | ✓ |
| Comments live + optimistic | ✓ |
| Est. hours absent from workspace/create | ✓ |
| Build | (verify CI) |
