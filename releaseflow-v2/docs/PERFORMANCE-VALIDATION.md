# Performance Validation — ST-008

**Date:** 2026-06-28

---

## Query Profile

`fetchOrgIntelligence(orgId)` performs:

| Operation | Per | Collection | Composite Index |
|-----------|-----|------------|-----------------|
| Get all releases | Once | `releases` | #1 |
| Get workflow | Per release | `workflows` | — (single where) |
| Get stages | Per release | `stages` | #3 |
| Get dependencies | Per release | `dependencies` | #12 |
| Get requirements | Per release | `release_requirements` | #27 |
| Get deliverables | Per release | `deliverables` | #9 |
| Get activities | Per release | `activities` | #8 |

**Total queries for N releases**: 1 + (6 × N) = 1 + 6N

| N (Releases) | Firestore Queries | Estimated Time |
|-------------|-------------------|---------------|
| 1 | 7 | ~200ms |
| 3 | 19 | ~400ms |
| 5 | 31 | ~600ms |
| 10 | 61 | ~1.2s |

---

## N+1 Query Pattern

The per-release queries (workflow, stages, deps, reqs, dels, activities) are N+1. This is acceptable for small orgs (< 10 releases) but will degrade linearly.

**Recommendation**: Batch the per-release queries using `where('releaseId', 'in', [...ids])` for deliverables, dependencies, requirements, and activities. This would reduce queries from 1+6N to ~5 total.

---

## Bundle Size

| Asset | Size |
|-------|------|
| Dashboard page | 6.5 kB |
| `operational-intelligence-service.ts` | ~254 lines |
| `useOperationsCenter.ts` | ~60 lines |

Compiled together, these add minimal overhead.

---

## Regression Validation

| Check | Result |
|-------|--------|
| TypeScript | ✅ 6/6 |
| Build | ✅ 1/1 |
| Tests | ✅ 327 passed |
| No new console errors | ✅ |
| No new lint errors | ✅ |
| No architectural violations introduced | ✅ |

---

## Recommendation

Acceptable for current architecture. The N+1 query pattern should be batched when orgs regularly have 10+ releases. Current composite indexes cover all ordered queries.
