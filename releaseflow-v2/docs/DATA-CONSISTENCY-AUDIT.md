# Data Consistency Audit — ST-006

**Date:** 2026-06-28
**Status:** Complete — 3 inconsistencies found

---

## Consistency Check: Release "Lua" traced through system

| Field | Release Workspace | Dashboard Table | OperationalSummary | Match? |
|-------|-----------------|-----------------|---------------------|--------|
| Title | ✅ From `fetchRelease()` | ✅ From `fetchOperationsData()` | ✅ Derived | ✅ |
| Status | ✅ `release.status` | ✅ `release.status` | ✅ | ✅ |
| Health % | ✅ `readiness.percentage` | ✅ `computeHealthPct()` | ✅ `opsHealthScore` | ❌ |
| Stage | ✅ `workflow.currentStageId → stages.find()` | ✅ `release.status.replace(/_/g, ' ')` | ✅ Narrative | ❌ |
| Owner | ✅ `release.createdBy` | ✅ `release.createdBy.slice(0, 8)` | — | ⚠️ |
| Release Date | ✅ `release.targetReleaseDate` | ✅ Not shown | ✅ Not shown | — |
| Blockers | ✅ `blockingDeps.filter(status != completed)` | ✅ `healthState === 'Blocked' \|\| 'Critical'` | ✅ `blockedItems.length` | ⚠️ |

---

## Inconsistency #1: Health Percentage

| Location | Calculation | Value (example) |
|----------|-------------|-----------------|
| Release Workspace | `computeReadiness().percentage` → weighted avg of reqs + stages + dels + deps | 68% |
| Dashboard Table | `computeHealthPct()` → based on status/estimated progression | 65% |
| OperationalSummary | `opsHealthScore` → simple ternary based on blocked/over-budget/releases | 85 |

**Impact**: Same release shows 68% health on workspace, 65% in dashboard table, and contributes to an 85% aggregate in OperationalSummary. Three different numbers.

**Root cause**: Dashboard `opsHealthScore` doesn't use `computeReadiness()` or `computeWorkflowHealth()`. Dashboard table uses `computeHealthPct()` which only looks at release status. Workspace uses `computeReadiness()`.

**Recommendation**: Consolidate to `computeReadiness().percentage` everywhere. Remove `opsHealthScore` heuristic and `computeHealthPct()`.

---

## Inconsistency #2: Current Stage

| Location | Calculation |
|----------|-------------|
| Release Workspace | `stages.find(s.id === workflow.currentStageId)?.name` |
| Dashboard Table | `release.status.replace(/_/g, ' ')` |

**Impact**: Workspace shows "Mastering" (stage name). Dashboard table shows "in production" (release status with underscores replaced). Different values.

**Root cause**: Dashboard doesn't have workflow/stage data for each release.

**Recommendation**: Either fetch stage names for dashboard or show the status with consistent formatting.

---

## Inconsistency #3: Health State Labels

| Source | Labels |
|--------|--------|
| `computeWorkflowHealth()` (3-level) | green, amber, red |
| `getHealthState()` (5-level) | Excellent, Healthy, Attention, Blocked, Critical |
| PDS (5-level PDS-06) | Excellent, Healthy, Attention, Blocked, Critical |

**Impact**: `computeWorkflowHealth()` is used in `workflow-progression.ts` for updating workflow documents but only produces 3 states. The UI uses 5 states.

**Root cause**: Two implementations with different granularity.

**Recommendation**: Upgrade `computeWorkflowHealth()` to 5-level.

---

## Consistent Items

| Concept | Implementation | Count | Consistent? |
|---------|---------------|-------|-------------|
| Release Status | `types.ts` | 1 | ✅ |
| Workflow Status | `types.ts` | 1 | ✅ |
| Readiness | `readiness-engine.ts` | 1 | ✅ |
| Distribution Readiness | `distribution-service.ts` | 1 | ✅ |
| Rights Readiness | `rights-service.ts` | 1 | ✅ |
| Artist Readiness | `artist-service.ts` | 1 | ✅ |
| Stage Transitions | `workflow-progression.ts` | 1 | ✅ |
| Status Transitions | `STATUS_TRANSITIONS` in page | 1 | ✅ |
