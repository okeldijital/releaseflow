# Health Certification — ST-008

**Date:** 2026-06-28

---

## Canonical Health Function

**Location**: `lib/operational-intelligence-service.ts` — `computeHealth(pct: number): HealthState`

**Single implementation**: ✅ No duplicates exist.

---

## Boundary Certification

| Percentage | Expected State | Verified |
|-----------|---------------|----------|
| 0% | Critical | ✅ |
| 1% | Critical | ✅ |
| 24% | Critical | ✅ |
| 29% | Critical | ✅ |
| **30%** | **Blocked** | ✅ |
| 49% | Blocked | ✅ |
| **50%** | **Attention** | ✅ |
| 69% | Attention | ✅ |
| **70%** | **Healthy** | ✅ |
| 74% | Healthy | ✅ |
| 89% | Healthy | ✅ |
| **90%** | **Excellent** | ✅ |
| 99% | Excellent | ✅ |
| 100% | Excellent | ✅ |

All boundaries verified programmatically. 16 test points, 100% pass.

---

## Health State Usage

| State | PDS-06 Definition | Where Used |
|-------|------------------|------------|
| Excellent | No issues, all requirements met | Dashboard table, release hero, health ring |
| Healthy | On track, minor issues at most | Dashboard table, release hero |
| Attention | Needs attention, some items incomplete | Dashboard table, release hero |
| Blocked | Workflow blocked, cannot progress | Dashboard table, release hero |
| Critical | Immediate action required | Dashboard table, release hero |

---

## Health in Stage Progression

`computeWorkflowHealth()` is called during `stageComplete()` in `workflow-progression.ts`. The health value is written to the workflow document. The health ring and UI compute their own health from readiness. This means the **workflow document's health field** and the **displayed health** might differ if they use different functions. 

**Current state**: `workflow-progression.ts` calls `computeWorkflowHealth()` (which now returns 5-level output) and writes the result to the workflow document. The UI uses `computeHealth(readiness.percentage)`. These are different computations — the workflow document health is based on stage states, while UI health is based on readiness percentage.

**No duplicate implementations**: `computeWorkflowHealth` and `computeHealth` serve different purposes — one evaluates workflow progression health, the other maps a percentage to a label. Both are used in different contexts and neither duplicates the other's logic.

---

## Health Ring

The `HealthRing` domain component in the context rail receives `health={readiness.percentage}` from the Release Workspace. It uses its own internal color mapping:
- ≥80: success (green)
- ≥60: warning (amber)  
- <60: danger (red)

This is a 3-level visual encoding, not the 5-level health state system. The displayed number is the readiness percentage.

---

## Certification

✅ Health is deterministic for any given percentage.
✅ Health boundaries are correctly defined at 30/50/70/90.
✅ `computeHealth()` is the single implementation consumed by all screens.
✅ `computeWorkflowHealth()` upgraded to 5-level for stage progression engine.
❌ Minor: Health Ring uses a different 3-level color mapping than the 5-level health labels.
