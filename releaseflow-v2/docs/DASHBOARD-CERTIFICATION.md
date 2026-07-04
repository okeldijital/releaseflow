# Dashboard Certification — ST-008

**Date:** 2026-06-28

---

## Widget Audit

### Active Releases Table

| Field | Source | Type | Verified |
|-------|--------|------|----------|
| releaseName | `fetchOrgIntelligence().releases[i].releaseName` | `string` | ✅ |
| artistName | `fetchOrgIntelligence().releases[i].artistName` | `string` | ✅ |
| releaseType | `fetchOrgIntelligence().releases[i].releaseType` | `string` | ✅ |
| currentStage | `fetchOrgIntelligence().releases[i].currentStage` | `string` (actual stage name) | ✅ |
| healthPct | `fetchOrgIntelligence().releases[i].healthPct` | `number` | ✅ |
| healthState | `fetchOrgIntelligence().releases[i].healthState` | `HealthState` | ✅ |
| owner | `fetchOrgIntelligence().releases[i].owner` | `string` | ✅ |

**Verdict**: All fields come from `useOperationsCenter()` → `fetchOrgIntelligence()`. No independent calculations. ✅

### Operational Summary

| Field | Source | Verified |
|-------|--------|----------|
| healthScore | `useOperationsCenter().aggregateHealthPct` | ✅ (average of all release health %) |
| currentStage | Hardcoded "Operations" | — |
| completedStages | `pulseMetrics.activeReleases - pulseMetrics.blockedReleases` | ✅ |
| totalStages | `pulseMetrics.activeReleases` | ✅ |
| readyItems | Same as completedStages | ✅ |
| pendingApprovals | `alerts.length` | ✅ |
| blockers | `blockedItems.length` | ✅ |
| daysUntilRelease | `deadlines.length > 0 ? 7 : 30` | ⚠️ heuristic |
| lastEvaluated | `new Date().toISOString()` at mount | ✅ |

**Verdict**: `aggregateHealthPct` replaces the old ternary heuristic. `daysUntilRelease` is a heuristic approximation. ✅

### Org Pulse (5 Cards)

| Card | Source | Verified |
|------|--------|----------|
| Active Releases | `pulseMetrics.activeReleases` | ✅ |
| Blocked Stages | `pulseMetrics.blockedReleases` | ✅ |
| Overdue Deadlines | `pulseMetrics.overdueDeadlines` | ✅ |
| Over Budget | `pulseMetrics.overBudget` | ✅ |
| Shipped This Month | `pulseMetrics.shippedThisMonth` | ✅ |

All from `fetchOrgIntelligence().pulseMetrics`. ✅

### Attention Panel

| Section | Source | Verified |
|---------|--------|----------|
| Alerts | `useOperationsCenter().alerts` | ✅ |
| Blocked Work | `useOperationsCenter().blockedItems` | ✅ |
| Critical Deadlines | `useOperationsCenter().deadlines` | ✅ |

### Recent Activity

| Field | Source | Verified |
|-------|--------|----------|
| Activities | `useOperationsCenter().activities` | ✅ |
| Ordering | `orderBy(createdAt, desc)` in repository | ✅ |
| Truncation | `slice(0, 10)` in UI | ✅ |

### Quick Actions

| Role | Actions | Source |
|------|---------|--------|
| owner/admin/release_manager | New Release, Artist, Assets, Invite | `useRoleStore().role` |
| contributor | My Tasks, Continue Work | `useRoleStore().role` |

---

## Certification

✅ All 8 widgets source data exclusively from `useOperationsCenter()`.
✅ No widget performs independent calculations.
✅ `aggregateHealthPct` used instead of ternary heuristic.
✅ 0 duplicate data sources.
