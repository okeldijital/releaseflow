# Workflow Domain Recovery Report — ST-002.3

**Sprint:** ST-002 Phase 3
**Date:** 2026-06-28
**Status:** Complete

---

## Architecture Achieved

```
/releases/[id] (0 Firestore imports)
      │
      ▼
useWorkflow() + useActivity()  ← hooks/useWorkflow.ts
      │
      ▼
workflow-service.ts + workflow-progression.ts  ← business logic
      │
      ▼
workflow-repository.ts  ← all Firestore persistence
      │
      ▼
Firestore
```

---

## Files Changed

| File | Change | Firestore Imports |
|------|--------|-------------------|
| `lib/workflow-repository.ts` | **NEW** — all workflow/stage/activity Firestore ops | Yes (allowed) |
| `lib/workflow-service.ts` | **REWRITTEN** — delegates to repository | 0 |
| `lib/workflow-progression.ts` | **REFACTORED** — delegates to repository | 1 (Timestamp only) |
| `hooks/useWorkflow.ts` | **NEW** — useWorkflow, useActivity hooks | 0 |
| `app/(app)/releases/[id]/page.tsx` | **REFACTORED** — zero Firestore | **0** (was 6) |

---

## WorkflowRepository API

| Function | Description |
|----------|-------------|
| `getWorkflow(releaseId)` | Fetch workflow by release |
| `getWorkflowById(id)` | Fetch workflow by id |
| `getStages(workflowId)` | All stages for a workflow, ordered |
| `updateStage(id, fields)` | Update stage status/timestamps |
| `updateWorkflow(id, fields)` | Update workflow metadata |
| `createActivity(fields)` | Log an activity event |
| `getActivities(releaseId, max)` | Fetch recent activities |

---

## Activity Domain Established

Activity is now a first-class domain with its own repository and service:

| Layer | Location | Functions |
|-------|----------|-----------|
| Repository | `workflow-repository.ts` | `createActivity`, `getActivities` |
| Service | `workflow-service.ts` | `logActivity`, `fetchActivity` |
| Hook | `hooks/useWorkflow.ts` | `useActivity(releaseId)` |

---

## Release Workspace — Zero Firestore

The workspace page no longer imports `firebase/firestore`. All data flows through:

| Data | Source |
|------|--------|
| Release | `fetchRelease()` from `release-service.ts` |
| Workflow + Stages | `useWorkflow(id)` hook |
| Requirements | `getRequirementsByRelease()` |
| Deliverables | `getDeliverablesByRelease()` |
| Dependencies | `getDependenciesByRelease()` |
| Distribution | `getLatestDistributionPackage()` |
| Rights | `validateReleaseOwnership()` |
| Activity | `useActivity(id)` hook |
| Stage completion | `stageComplete()` from `workflow-progression.ts` |
| Tasks | `createTask`, `completeTask`, etc. from `task-service.ts` |

## Domain Components Verified

All 6 domain-ui components are Firestore-free:
- `ReleaseJourney` — presentational
- `HealthRing` — presentational SVG
- `ReadinessStack` — presentational checklist
- `ContextRail` — presentational side panel
- `WorkflowBoard` — presentational list
- `OperationalSummary` — presentational card

## Verification

| Check | Result |
|-------|--------|
| TypeScript | ✅ 6/6 packages pass |
| Build | ✅ Compiled successfully |
| Tests | ✅ 328 passed, 0 regressions |
| `/releases/[id]` Firestore imports | ✅ 0 |
| Domain-ui Firestore imports | ✅ 0 |
| UI package Firestore | ✅ 0 |
| WorkflowService Firestore | ✅ 0 (uses repository) |
| WorkflowProgression Firestore | ✅ 1 (Timestamp) |

## Architecture Summary

Three foundational domains fully recovered:

```
Phase 1 (ST-002.1): Organization  → organization-repository.ts
Phase 2 (ST-002.2): Release       → release-repository.ts + release-service.ts
Phase 3 (ST-002.3): Workflow      → workflow-repository.ts + workflow-progression.ts
                                    + Activity domain established
```

All three domains follow the same pattern:
```
Page → Hook → Service → Repository → Firestore
```
