# ST-008 — Runtime Validation Report

**Date:** 2026-06-28
**Status:** Complete

---

## Single Source Verification

| Function | Source | Consumers | Status |
|----------|--------|-----------|--------|
| `computeHealth()` | `operational-intelligence-service.ts` | `fetchOrgIntelligence()` internal | ✅ Single |
| `computeReadiness()` | `operational-intelligence-service.ts` → `readiness-engine.ts` re-export | `releases/[id]/page.tsx`, `fetchOrgIntelligence()` | ✅ Single |
| `computeWorkflowHealth()` | `operational-intelligence-service.ts` → `workflow-health.ts` re-export | `workflow-progression.ts` | ✅ Single |
| `fetchOrgIntelligence()` | `operational-intelligence-service.ts` | `useOperationsCenter.ts` → `dashboard/page.tsx` | ✅ Single |

**Dead code**: `operations-center-service.ts` still exists with old `computeHealthPct()` and `getHealthState()` functions. No consumer imports them. This file should be deleted.

---

## Cross-Screen Consistency

| Field | Dashboard | Release Workspace | Same? |
|-------|-----------|-------------------|-------|
| Release Title | `fetchOrgIntelligence()` | `fetchRelease()` | ✅ |
| Status | `fetchOrgIntelligence()` | `fetchRelease()` | ✅ |
| Current Stage | `fetchOrgIntelligence()` — from workflow stage name | `workflow.currentStageId → stages.find()` | ✅ |
| Health % | `computeHealth()` from readiness % | `computeReadiness().percentage` | ✅ |
| Readiness % | `computeReadiness()` via `fetchOrgIntelligence()` | `computeReadiness()` via `readiness-engine.ts` | ✅ |
| Blockers | `fetchOrgIntelligence()` — blockerCount | `blockingDeps.filter(!completed)` | ✅ |
| Release Date | `fetchOrgIntelligence()` — daysUntilRelease | `release.targetReleaseDate` | ✅ |
| Artist | `fetchOrgIntelligence()` — artistName | From `release.artistName` if available | ⚠️ |
| Owner | `fetchOrgIntelligence()` — createdBy | `release.createdBy` | ✅ |
| Org Pulse | `fetchOrgIntelligence()` — pulseMetrics | N/A | ✅ |
| Activity | `fetchOrgIntelligence()` — activities | `useActivity(id)` hook | ✅ |

**Artist name note**: Dashboard shows `artistName` from release record which is not always populated. Release Workspace doesn't currently show artist name in its hero (was removed when the type field was missing).

---

## Boundary Condition Certification

### `computeHealth()`

| Input | Output | Rule |
|-------|--------|------|
| 0-29% | Critical | pct < 30 |
| 30-49% | Blocked | pct >= 30, < 50 |
| 50-69% | Attention | pct >= 50, < 70 |
| 70-89% | Healthy | pct >= 70, < 90 |
| 90-100% | Excellent | pct >= 90 |

✅ Deterministic. ✅ All boundaries validated.

### `computeReadiness()`

| Scenario | Requirements | Stages | Deliverables | Dependencies | Output |
|----------|-------------|--------|-------------|-------------|--------|
| All empty | [] | [] | [] | [] | 0% |
| 1 req approved only | 1/1 approved | [] | [] | [] | 100% |
| 1 req pending only | 0/1 approved | [] | [] | [] | 0% |
| Mixed | 1/2 approved | 1/2 completed | 0/1 approved | 1/1 completed | 33% |
| All full | 1/1 approved | 3/3 completed | 2/2 approved | 2/2 completed | 100% |

✅ Deterministic. Weighted average: (reqPct + stagePct + delPct + depPct) / active dimensions.

### `computeWorkflowHealth()`

| Scenario | Output | Rule |
|----------|--------|------|
| All completed | Excellent | every stage completed |
| Any blocked | Critical | any stage status === 'blocked' |
| Overdue stage | Blocked | any not-completed stage past due date |
| In progress, on track | Healthy | default |
| No stages | Excellent | empty stages array |

✅ Deterministic. Upgraded from 3-level to 5-level per PDS-06.

---

## Widget Source Trace

| Widget | Data Source |
|--------|------------|
| Active Releases Table | `useOperationsCenter().releases` |
| Operational Summary | `useOperationsCenter().aggregateHealthPct` + `pulseMetrics` |
| Org Pulse | `useOperationsCenter().pulseMetrics` |
| Attention Panel (Alerts) | `useOperationsCenter().alerts` |
| Attention Panel (Blocked) | `useOperationsCenter().blockedItems` |
| Attention Panel (Deadlines) | `useOperationsCenter().deadlines` |
| Recent Activity | `useOperationsCenter().activities` |
| Quick Actions | `useRoleStore().role` |

All 8 widgets source from `useOperationsCenter()` → `fetchOrgIntelligence()` → `operational-intelligence-service.ts`. No widget does independent calculations. ✅

---

## Performance

Dashboard `fetchOrgIntelligence()` performs N+1 queries per release (workflow, stages, deps, reqs, dels, activities). For an org with 5 releases: ~30 Firestore queries. Composite indexes cover all ordered queries.

**Recommendation**: Batch queries where possible — `getDocs` with `where('releaseId', 'in', [...ids])` instead of per-release queries.

---

## Regression Check

| Journey | Status |
|---------|--------|
| TypeScript | ✅ 6/6 |
| Build | ✅ 1/1 |
| Tests | ✅ 327 passed |
| Auth flow | ✅ No changes |
| Org CRUD | ✅ No changes |
| Artist CRUD | ✅ No changes |
| Release CRUD | ✅ No changes |
| Asset CRUD | ✅ No changes |
| Rights CRUD | ✅ No changes |
| Distribution | ✅ No changes |
| Operations Center | ✅ Uses unified service |
