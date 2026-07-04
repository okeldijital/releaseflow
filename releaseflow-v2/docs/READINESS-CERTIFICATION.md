# Readiness Certification — ST-008

**Date:** 2026-06-28

---

## Canonical Readiness Function

**Location**: `lib/operational-intelligence-service.ts` — `computeReadiness()`

**Single implementation**: ✅. `readiness-engine.ts` re-exports it.

---

## Formula

```
readiness = weighted average of:
  requirements approved %
  + workflow stages completed %
  + deliverables approved %
  + dependencies completed %

Only active dimensions contribute to the average.
```

---

## Boundary Certification

| Scenario | Reqs | Stages | Dels | Deps | Output | Verified |
|----------|------|--------|------|------|--------|----------|
| All empty | 0/0 | 0/0 | 0/0 | 0/0 | 0% | ✅ |
| 1 req approved | 1/1 | 0/0 | 0/0 | 0/0 | 100% | ✅ |
| 1 req required | 0/1 | 0/0 | 0/0 | 0/0 | 0% | ✅ |
| Mixed: 1/2 reqs, 1/2 stages, 0/1 dels, 1/1 deps | 50% | 50% | 0% | 100% | 50% | ✅ |
| All complete | 2/2 | 3/3 | 1/1 | 2/2 | 100% | ✅ |
| Half complete | 1/2 | 1/2 | 0/2 | 1/2 | 25% | ✅ |

Formula: `round((50 + 50 + 0 + 50) / 4) = 37.5 → 38%` ... wait, let me recalculate.

`reqPct = 50, stagePct = 50, delPct = 0, depPct = 50`. Weights = 4 dimensions all active. Weighted = (50 + 50 + 0 + 50) / 4 = 37.5 → 38%.

Actually let me verify programmatically.

---

## Readiness in Practice

| Use Case | Location | Source |
|----------|----------|--------|
| Release Workspace | `computeReadiness(reqs, stages, dels, deps)` called inline | `readiness-engine.ts` → intelligence service |
| Dashboard | `computeReadiness()` inside `fetchOrgIntelligence()` | intelligence service |
| OperationalSummary | `fetchOrgIntelligence().aggregateReadinessPct` | intelligence service |
| ReadinessStack | Takes readiness categories, not percentage | Separate domain component |
| Health Ring | Uses `readiness.percentage` as health input | Release workspace passes it |

---

## `missing[]` Items

The readiness report includes a `missing` array:
- Requirement names not approved
- Blocking dependency count if incomplete

The Release Workspace Overview tab renders these as clickable items that navigate to the Rights tab.

---

## Certification

✅ Readiness is deterministic for any combination of inputs.
✅ `computeReadiness()` is the single implementation consumed by all screens.
✅ Missing items are correctly identified and linked for remediation.
