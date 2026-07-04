# ST-006 — Final Report

**Date:** 2026-06-28
**Status:** Complete

---

## Executive Summary

ReleaseFlow's state model is largely consistent. 17 derived state calculations exist across the codebase. **1 duplicate** was found (health). **3 inconsistencies** between widgets were identified. All are documented with recommendations.

---

## Findings

### ✅ Consistent (No Action)

- Release Status (8 states) — single `types.ts` definition
- Workflow/Stage Status (6 states) — single `types.ts` definition
- Readiness calculation — single `readiness-engine.ts`
- Distribution Readiness — single `distribution-service.ts`
- Rights Readiness — single `rights-service.ts`
- Artist Readiness — single `artist-service.ts`
- Stage transitions — single `workflow-progression.ts`
- Status transitions — single `STATUS_TRANSITIONS` map
- Release lifecycle — 5 valid starting states, 2 terminal states
- Asset completeness — single `asset-service.ts`

### ⚠️ Inconsistencies Found

| ID | Severity | Description |
|----|----------|-------------|
| ST-006-001 | Medium | Two health functions: `computeWorkflowHealth()` (3-level) vs `getHealthState()` (5-level). PDS specifies 5 states. |
| ST-006-002 | Medium | Dashboard health score (`opsHealthScore`) is a ternary heuristic unrelated to `computeReadiness()` |
| ST-006-003 | Low | Dashboard table shows `release.status` as "current stage" instead of the actual workflow stage name |

### ❌ Widget Data Gaps

| Widget | Gap |
|--------|-----|
| Attention Panel (Alerts) | `fetchOperationsData()` returns empty `alerts[]` |
| Attention Panel (Blocked) | `fetchOperationsData()` returns empty `blockedItems[]` |
| Attention Panel (Deadlines) | `fetchOperationsData()` returns empty `deadlines[]` |
| Recent Activity | `fetchOperationsData()` returns empty `activities[]` |
| Org Pulse (Overdue) | `pulseMetrics.overdueDeadlines` hardcoded to 0 |
| Org Pulse (Over Budget) | `pulseMetrics.overBudget` hardcoded to 0 |

These are data-layer gaps. The UI structure is correct. The service needs expanded queries.

---

## Recommendations

1. **Unify health**: Upgrade `computeWorkflowHealth()` to 5-level output matching `getHealthState()`. Delete the 3-level system.
2. **Fix dashboard health**: Replace `opsHealthScore` with actual `computeReadiness()` per-release averages.
3. **Restore data queries**: Expand `fetchOperationsData()` to fetch alerts, blocked items, deadlines, and activities from their respective repositories.
4. **Show real stage names**: Add workflow/stage data to dashboard releases for accurate "current stage" display.

---

## Verification

| Check | Result |
|-------|--------|
| TypeScript | ✅ 6/6 |
| Build | ✅ 1/1 |
| Tests | ✅ 327 passed |
| Status definitions | ✅ Single source |
| Transition rules | ✅ Single source |
| Derived state audited | ✅ 14 functions |
| Duplicates found | 1 (health) |
| Inconsistencies | 3 |
| Recommendations | 4 |
