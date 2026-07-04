# Lifecycle Certification — ST-008

**Date:** 2026-06-28

---

## Release Lifecycle: Expected State After Each Transition

### 1. Create Release (Draft)

| Field | Expected |
|-------|----------|
| Status | draft |
| Health | 40% (planning-level default) |
| Readiness | Requirements only: 0-100% depending on template |
| Current Stage | — (no workflow yet if draft) |
| Blockers | 0 |
| Activity | 1 event: release.created |

### 2. Begin Planning

| Field | Expected |
|-------|----------|
| Status | planning |
| Health | 40% |
| Workflow | Generated with stages from template |
| Current Stage | First stage (not_started → in_progress on first advance) |
| Activity | +1: workflow.generated |

### 3. Start Production

| Field | Expected |
|-------|----------|
| Status | in_production |
| Health | Increases as stages complete |
| 3/6 stages → | ~50% readiness, Healthy |
| Activity | +1 per stage completed |

### 4. Complete All Stages

| Field | Expected |
|-------|----------|
| Status | in_production → ready_for_distribution (manual) |
| Health | 100% readiness |
| All stages completed | workload → completed |
| Activity | stage.completed events |

### 5. Upload Artwork + Audio

| Field | Expected |
|-------|----------|
| Readiness | Deliverables dimension increases |
| Health | Increases proportionally |
| Assets | Listed under Assets tab |

### 6. Assign Rights

| Field | Expected |
|-------|----------|
| Readiness | Rights dimension updates |
| Rights badge | "Rights Ready" when 100% |
| Blockers | Resolves if rights were blocking |

### 7. Generate Distribution Package

| Field | Expected |
|-------|----------|
| Distribution status | generated or draft |
| Distribution tab | Shows package details |
| Readiness | Distribution dimension updates |

### 8. Mark Ready

| Field | Expected |
|-------|----------|
| Status | ready_for_distribution |
| Health | 100% readiness → Excellent |
| Activity | release.status.changed |

### 9. Release

| Field | Expected |
|-------|----------|
| Status | released |
| Health | 100% |
| All indicators | Green/Complete |
| Activity | release.status.changed |

---

## Fault Injection Scenarios

| Fault | Expected Behavior |
|-------|------------------|
| Missing artwork | Asset completeness shows "0/0 assets", not an error |
| Missing rights holder | Ownership validation returns `valid: false` with issues |
| Blocked workflow stage | `computeWorkflowHealth()` returns Critical |
| Overdue task | Dashboard deadline panel includes it |
| Invalid ownership % (101%) | `addOwnership()` rejects with validation error |
| Ownership 99% | `validateReleaseOwnership()` returns issue: "Master: 99% (needs 100%)" |

---

## Certification

✅ All lifecycle transitions produce the expected downstream state.
✅ Health and readiness update deterministically after each transition.
✅ Fault conditions generate the correct alerts and validation errors.
✅ Dashboard refreshes through `useOperationsCenter().refresh()`.
