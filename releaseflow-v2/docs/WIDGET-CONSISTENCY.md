# Widget Consistency Audit — ST-006

**Date:** 2026-06-28

---

## Widget: Active Releases (Dashboard Table)

| Question | Answer | Status |
|----------|--------|--------|
| Which releases qualify? | `status !== 'archived' && status !== 'cancelled'` in `fetchOperationsData()` | ✅ Consistent |
| Health shown? | `computeHealthPct()` — estimated from status | ⚠️ Doesn't use readiness |
| Stage shown? | `release.status.replace(/_/g, ' ')` | ⚠️ Not the workflow stage name |
| Organization scoped? | `where('organizationId', '==', orgId)` | ✅ |
| Who sees it? | All roles — 13 columns of Table component | — |
| Empty state? | "No active releases" with Create Release CTA | ✅ |

---

## Widget: Operational Summary

| Question | Answer | Status |
|----------|--------|--------|
| Health score source? | `opsHealthScore` — ternary heuristic | ❌ Not from `computeReadiness()` |
| Stages shown? | `pulseMetrics.activeReleases - pulseMetrics.blockedReleases` | ⚠️ Org-level, not per-release |
| Blockers count? | `blockedItems.length` from `useOperationsCenter()` | ✅ From hook |
| Pending approvals? | `alerts.length` from `useOperationsCenter()` | ✅ From hook |
| Days remaining? | `deadlines.length > 0 ? 7 : 30` | ❌ Hardcoded, not from release data |
| Narrative generated? | By `OperationalSummary` domain component from inputs | ✅ |

---

## Widget: Org Pulse (5 Stat Cards)

| Card | Source | Real data? |
|------|--------|------------|
| Active Releases | `pulseMetrics.activeReleases` | ✅ From `fetchOperationsData()` |
| Blocked Stages | `pulseMetrics.blockedReleases` | ⚠️ `releaseRows.filter(healthState === 'Blocked' \|\| 'Critical')` |
| Overdue Deadlines | `pulseMetrics.overdueDeadlines` | ⚠️ Hardcoded to 0 |
| Over Budget | `pulseMetrics.overBudget` | ⚠️ Hardcoded to 0 |
| Shipped This Month | `pulseMetrics.shippedThisMonth` | ✅ From `releasedThisMonth` filter |

---

## Widget: Recent Activity

| Question | Answer | Status |
|----------|--------|--------|
| Source? | `useActivity()` → `fetchActivity()` → `workflow-repository.ts` | ✅ |
| Ordered by? | `orderBy('createdAt', 'desc')` | ✅ |
| Organization filtered? | Via `releaseId` scope (release controls org access) | ✅ |
| Actor shown? | `actorId` truncated | ⚠️ Shows raw ID, not name |
| Empty state? | "No recent activity" | ✅ |

---

## Widget: Attention Panel

| Section | Source | Real data? |
|---------|--------|------------|
| Alerts | `useOperationsCenter().alerts` | ✅ From `fetchOperationsData()` |
| Blocked Work | `useOperationsCenter().blockedItems` | ✅ From `fetchOperationsData()` |
| Critical Deadlines | `useOperationsCenter().deadlines` | ✅ From `fetchOperationsData()` |

Note: `fetchOperationsData()` currently returns empty arrays for alerts, blockedItems, deadlines, and activities. The full Firestore queries were removed during the refactoring to `operations-center-service.ts`. The dashboard shows 0 for these sections until those queries are re-added.

---

## Widget: Quick Actions

| Role | Actions | Source |
|------|---------|--------|
| owner/admin/release_manager | New Release, New Artist, Upload Assets, Invite User | `useRoleStore()` |
| contributor | My Tasks, Continue Work | `useRoleStore()` |

✅ Role-aware. No hardcoded permissions.
