# State Model — ReleaseFlow Canonical Definitions

**Date:** 2026-06-28
**Status:** Complete

---

## Release Status

**Definition**: `apps/web/src/app/(app)/types.ts:10`

```
draft
planning
in_production
on_hold
ready_for_distribution
released
cancelled
archived
```

8 canonical statuses. No aliases. Single source of truth.

---

## Workflow Status

**Definition**: `apps/web/src/app/(app)/types.ts:35`

```
not_started
in_progress
blocked
review
approved
completed
```

6 canonical statuses. Used by both Workflow and Stage entities.

---

## Health

**ISSUE**: Two different health systems exist:

### A) Workflow Health (3-level) — `lib/workflow-health.ts`
```
green   → all stages complete or no blocks/overdue
amber   → <7 days until target release
red     → blocked stage OR overdue stage
```

Used by: `workflow-progression.ts` during stage advancement.

### B) Operations Health (5-level) — `lib/operations-center-service.ts`
```
Excellent → ≥90%
Healthy   → ≥70%
Attention → ≥50%
Blocked   → ≥30%
Critical  → <30%
```

Used by: Dashboard Active Releases table, Release Workspace hero health pill.

### C) Dashboard Aggregate Health — `dashboard/page.tsx`
```
blockedReleases > 0  → 50
overBudget > 0       → 65
releases > 0         → 85
otherwise            → 100
```

Simple heuristic passed to OperationalSummary. Does not use either health function.

**GAP**: The 5-level health system is what the PDS defines, but `computeWorkflowHealth()` uses the 3-level system. The dashboard aggregate doesn't use either.

**AI-assisted**: OperationalSummary expects a 0-100 score, but the `opsHealthScore` doesn't derive from actual per-release health calculations. It's a simple ternary.

---

## Readiness

**Definition**: `lib/readiness-engine.ts` — `computeReadiness()`

Calculated from 4 weighted dimensions:

| Dimension | Weight | Source |
|-----------|--------|--------|
| Requirements | 1 | `getRequirementsByRelease()` |
| Workflow | 1 (if stages exist) | Stage completion % |
| Deliverables | 1 (if deliverables exist) | Approved % |
| Dependencies | 1 (if blocking deps exist) | Completed % |

Output: `{ percentage, ready, missing[], breakdown }`

Single implementation. Used by Release Workspace and Artist Workspace. ✅

---

## Distribution Readiness

**Definition**: `lib/distribution-service.ts` — `checkDistributionReadiness()`

4 dimensions, 25% each:
- **Metadata**: 8 required fields (upc, catalog, label, copyright, pLine, cLine, genre, language)
- **Deliverables**: All approved
- **Requirements**: All approved
- **Dependencies**: All blocking completed

Single implementation. ✅

---

## Current Stage

Derived from `workflow.currentStageId` — the stage that is `in_progress`. If no workflow, falls back to `release.status` with underscores replaced by spaces.

---

## Rightness (Rights Readiness)

**Definition**: `lib/rights-service.ts` — `validateReleaseOwnership()`

| Dimension | Rule |
|-----------|------|
| Master | Must = 100% if defined |
| Publishing | Must = 100% if defined |
| Mechanical | Must = 100% if defined |
| Blocked | No ownership defined at all |

---

## Artist Readiness

**Definition**: `lib/artist-service.ts` — `checkArtistReadiness()`

6 items: Name, Bio, Artist Image, Country, Genre, Social Links
Each item = ~16.7%. Ready when all 6 pass.

Single implementation. ✅
