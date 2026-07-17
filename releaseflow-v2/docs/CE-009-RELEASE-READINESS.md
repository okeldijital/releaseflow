# CE-009 — Release Readiness & Go-Live Workspace

**Status:** Implemented  
**Date:** 2026-07-17

---

## Architecture Summary

```
Release
  ↓
release-readiness-service (projection only)
  ↓
Assignments (release + track) · Artwork · Metadata · Milestones · Activity
  ↓
ReleaseReadiness model (never persisted as live state)
  ↓
/releases/{id}/readiness dashboard + manager dashboard summaries
```

**Assignments remain the execution unit.** Readiness never mutates release status to “Ready.”

### Recommendation engine

| Score / blockers | Recommendation |
|---|---|
| Blockers present | `not_ready` (Red) |
| Score ≥ 85 | `ready` (Green) |
| Score ≥ 55 | `needs_attention` (Yellow) |
| else | `not_ready` (Red) |

No manual override.

### Critical path

Incomplete assignments that are blocked, required/high/urgent, overdue, or in review, with due date on/before release date.

### Timeline

Read-only construction from release createdAt, artwork, metadata completeness, activity actions, milestones, and target release date.

---

## Readiness Algorithm

### Weights (configurable — `release-readiness-config.ts`)

| Component | Default weight |
|---|---|
| Assignment completion | 40% |
| No overdue work | 20% |
| No blockers | 20% |
| Approvals complete | 10% |
| Metadata complete | 5% |
| Artwork complete | 5% |

Weights are normalized to sum 1.0. **Never hardcode in scorers.**

### Blockers

- Blocked assignments  
- Rejected reviews  
- Missing artwork  
- Metadata completeness &lt; 50%  
- Assignments in review (pending approval)  
- Critical overdue (urgent/required)

### Warnings

- Due within 24h  
- ≥3 overdue  
- Open review queue  

Warnings do not flip recommendation alone (blockers do).

### History

Only **meaningful transitions** stored in `release_readiness_history` (score Δ≥5, recommendation change, blocker count change). Live score always recalculated.

### Events

Activity: `readiness.score_changed`, `readiness.ready`, `readiness.not_ready`, `readiness.blocker_*`  
Notifications (events only): `release.ready`, `release.not_ready`, `release.readiness_changed`, `release.blocker_added`

---

## File Summary

### New

| File | Purpose |
|---|---|
| `lib/release-readiness-config.ts` | Weights + thresholds |
| `lib/release-readiness-service.ts` | Aggregate + compute + emit transitions |
| `lib/release-readiness-history-repository.ts` | Transition history |
| `components/release/readiness/readiness-dashboard.tsx` | UI panels |
| `app/(app)/releases/[id]/readiness/page.tsx` | Workspace page |
| `__tests__/release-readiness.test.ts` | Unit tests |
| `docs/CE-009-RELEASE-READINESS.md` | This doc |

### Modified

| File | Purpose |
|---|---|
| `notification-type-registry.ts` | Release readiness events |
| `releases/[id]/page.tsx` | Link to readiness workspace |
| `dashboard/page.tsx` | Ready / At risk / Blocked / This week |
| `firestore.rules` / `firestore.indexes.json` | History collection |

---

## Validation

| Check | Result |
|---|---|
| TypeScript | Pass |
| Lint | Pass (pre-existing warnings only) |
| Tests | **581 passed** (incl. `release-readiness.test.ts`) |
| Production build | Pass |

## Acceptance

- [x] Computed readiness without duplicate assignment state  
- [x] Full `/releases/{id}/readiness` dashboard  
- [x] Configurable weights  
- [x] Evidence-based Go/No-Go (no override)  
- [x] Blockers, warnings, critical path, milestones, timeline, countdown  
- [x] Manager dashboard summaries  
- [x] Collaborator scoped view  
- [x] Activity + notification events on transitions  
