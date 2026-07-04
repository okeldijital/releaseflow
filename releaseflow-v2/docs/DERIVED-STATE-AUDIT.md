# Derived State Audit — ST-006

**Date:** 2026-06-28

---

## Calculation Inventory

| Function | Location | Purpose | Duplicate? | Consistent? |
|----------|----------|---------|------------|-------------|
| `computeReadiness()` | `readiness-engine.ts` | Release readiness % | No | ✅ Single source |
| `checkArtistReadiness()` | `artist-service.ts` | Artist profile completeness | No | ✅ Single source |
| `checkDistributionReadiness()` | `distribution-service.ts` | Distribution readiness | No | ✅ Single source |
| `validateReleaseOwnership()` | `rights-service.ts` | Rights ownership validation | No | ✅ Single source |
| `computeWorkflowHealth()` | `workflow-health.ts` | Workflow health (3-level) | No | ⚠️ 3-level only |
| `getHealthState()` | `operations-center-service.ts` | Release health (5-level) | No | ⚠️ Different from workflow-health |
| `computeHealthPct()` | `operations-center-service.ts` | Estimated release health % | No | ⚠️ Not from readiness |
| `opsHealthScore` | `dashboard/page.tsx` (inline) | Aggregate dashboard health | No | ⚠️ Simple heuristic |
| `computeProgress()` | `workflow-progress.ts` | Stage completion % | No | ✅ Single source |
| `stageComplete()` | `workflow-progression.ts` | Stage advancement logic | No | ✅ Single source |
| `getRightsReadiness()` | `rights-service.ts` | Rights readiness blockers | No | ✅ Single source |
| `getDistributionReadinessSummary()` | `distribution-service.ts` | Distribution blockers | No | ✅ Single source |
| `fetchAssetCompleteness()` | `asset-service.ts` | Asset completeness | No | ✅ Single source |
| `daysUntil()` | `releases/[id]/page.tsx` (inline) | Days until release date | No | ✅ |

---

## Duplicate Identified

**`getHealthState()`** and **`computeWorkflowHealth()`** are two different health functions:

| Aspect | `computeWorkflowHealth` | `getHealthState` |
|--------|------------------------|-------------------|
| Levels | 3 (green/amber/red) | 5 (Excellent → Critical) |
| Inputs | Stages + target date | Single percentage |
| Used by | Stage advancement engine | Dashboard + Workspace UI |
| PDS Compliant? | ❌ (PDS defines 5 states) | ✅ |

**Resolution**: Upgrade `computeWorkflowHealth()` to output 5-level health states matching `getHealthState()`.

---

## Calculation That Should Exist But Doesn't

**Aggregate Org Health**: The dashboard's `opsHealthScore` is a simple ternary. There should be a function that computes aggregate org health from all releases' readiness scores:

```typescript
function computeOrgHealth(releases: Release[]): number {
  if (releases.length === 0) return 100;
  const avgReadiness = releases.reduce((sum, r) => sum + computeReadiness(r).percentage, 0) / releases.length;
  return Math.round(avgReadiness);
}
```

Currently missing. The dashboard uses its own heuristic.

---

## Single-Implementation Verification

| Calculation | Implementations | Status |
|-------------|----------------|--------|
| Readiness | 1 | ✅ |
| Distribution Readiness | 1 | ✅ |
| Rights Readiness | 1 | ✅ |
| Artist Readiness | 1 | ✅ |
| **Health** | **2** | ❌ Needs consolidation |
| **Dashboard Health** | **1 (heuristic)** | ❌ Should use shared function |
| Progress | 1 | ✅ |
| Stage transitions | 1 | ✅ |
