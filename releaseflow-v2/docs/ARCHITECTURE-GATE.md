# Architecture Gate — Sprint 003 → Sprint 004

## Gate Condition

Before Sprint 004 implementation begins, the following domain model
must be fully represented across all four layers:

```
Organization
  └── Release
        ├── Tracks
        ├── Contributors
        └── Workflow Template (stages, deliverables, approvals)
```

---

## Coverage Matrix

| Entity              | Firestore | TypeScript Types | Repository Layer | UX Flows          |
|---------------------|-----------|------------------|-----------------|-------------------|
| Organization        | Required  | Required         | Required        | Created during    |
|                     |           |                  |                 | onboarding + set. |
| Release             | Required  | Required         | Required        | Creation flow,    |
|                     |           |                  |                 | workspace, dash.  |
| Track               | Required  | Required         | Required        | Track list in     |
|                     |           |                  |                 | workspace tab     |
| Contributor         | Required  | Required         | Required        | Contributor tab   |
|                     |           |                  |                 | in workspace      |
| Workflow Template   | Required  | Required         | Required        | Workflow tab      |
|                     |           |                  |                 | in workspace      |

---

## Layer Definitions

### Firestore Collections

```
organizations/
  {orgId}/
    releases/
      {releaseId}/
        tracks/
          {trackId}
        contributors/
          {contributorId}
        stages/
          {stageId}
            tasks/
              {taskId}
```

### TypeScript Types

Located in `packages/shared/src/types/`:

```
Organization.ts      — name, slug, type, country, timezone
Release.ts           — id, title, type, state, dates, metadata
Track.ts             — id, title, duration, isrc, writers
Contributor.ts       — id, name, role, scope, ipi, split
WorkflowTemplate.ts  — id, name, stages (ordered array)
Stage.ts             — id, name, order, deliverables, approvals
Task.ts              — id, title, assignee, dueDate, state
```

### Repository Layer

Abstract repository interfaces in `packages/shared/src/repositories/`:

```
OrganizationRepository
ReleaseRepository
TrackRepository
ContributorRepository
WorkflowTemplateRepository
```

Each provides: `getById`, `list`, `create`, `update`, `delete` (where
applicable).

### UX Flows

| Flow               | Doc Reference            | Implementation Status      |
|--------------------|--------------------------|----------------------------|
| Release Creation   | `11-release-creation-flow.md` | Spec complete            |
| Release Workspace  | `12-release-workspace.md`    | Spec complete            |
| Overview Dashboard | `14-release-dashboard.md`    | Spec complete            |
| Workflow Pipeline  | `15-workflow-templates-v1.md`| Spec complete            |
| Contributor Assign | `17-contributor-taxonomy.md` | Spec complete            |

---

## Gate Sign-Off

Before transitioning to Sprint 004, verify:

- [ ] Organization documents create/read/update in Firestore
- [ ] Release CRUD working end-to-end
- [ ] Tracks can be added to a release
- [ ] Contributors can be assigned to a release/track
- [ ] Workflow template creates stages on release creation
- [ ] Release state transitions (Draft → Planning → Production → Ready → Released → Archived)
- [ ] Progress calculation returns correct percentages
- [ ] TypeScript types match Firestore schema
- [ ] Repository layer abstracts all Firestore operations
