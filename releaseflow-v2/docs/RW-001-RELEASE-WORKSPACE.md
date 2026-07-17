# RW-001 — Release Workspace Consolidation

**Status:** Implemented  
**Priority:** Execution UX  
**Depends on:** AW-001 Assignment Creation, AUTH-001 AuthorizationService

## Summary

The Release page is a single vertically scrolling execution workspace. Overview / Workflow / Settings **tabs are removed**. Administrative actions live in a page-level overflow (⋮) menu, permission-gated via `AuthorizationService` (through `usePermissions`).

## Page structure

1. **Release header** — artwork, title, status, compact identity cards, overflow menu  
2. **Release readiness** — ReadinessCard + link to readiness workspace  
3. **Assignments** — list + **Create Assignment** → AW-001 workspace  
4. **Workflow** — open operational tasks for the release  
5. **Activity** — activity feed  
6. **Deliverables** — tracks + asset deliverables  

## Create Assignment (AW-001)

From the Release workspace:

```
/assignments/new?releaseId=<id>&lockRelease=1&from=release
```

- Release is pre-selected and **locked**
- Contributor selector + contribution role selector
- Invite from contributor picker (existing flow)
- No manual ID entry
- Server/service enforces `AuthorizationService.requireManageAssignments()`

## Single creation implementation

| Surface | Implementation |
|---------|----------------|
| `/assignments/new` | `AssignmentCreateForm` |
| `AssignmentDialog` (track, artist, etc.) | wraps `AssignmentCreateForm` |
| Release workspace | navigates to `/assignments/new?releaseId=…&lockRelease=1` |

Shared form: `components/assignments/assignment-create-form.tsx`

## Overflow menu (auth-gated)

| Action | Permission |
|--------|------------|
| Edit release details | `canEditRelease` |
| Change release date | `canEditRelease` |
| Archive / Restore | `canEditRelease` |
| Delete release | `canDeleteRelease` |

## Files

| File | Change |
|------|--------|
| `app/(app)/releases/[id]/page.tsx` | Tabless workspace |
| `components/assignments/assignment-create-form.tsx` | Shared AW-001 form |
| `components/assignment-dialog.tsx` | Thin wrapper |
| `app/(app)/assignments/new/page.tsx` | Query params + form |
| `components/assignments/release-selector.tsx` | `locked` prop |
| `docs/RW-001-RELEASE-WORKSPACE.md` | This document |

## Out of scope (preserved)

- Assignment model  
- Workflow engine internals  
- Activity feed service  
- Release readiness logic  
- RBAC / AuthorizationService implementation  

## Acceptance

- [x] No Overview / Workflow / Settings tabs  
- [x] Single continuous page  
- [x] Workflow embedded  
- [x] Settings → overflow menu  
- [x] Create Assignment → AW-001 with locked release  
- [x] One creation form/component platform-wide  
- [x] TypeScript / tests / lint / production build  

