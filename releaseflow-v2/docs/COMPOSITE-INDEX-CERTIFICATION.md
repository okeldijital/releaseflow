# Composite Index Certification — ST-HF-006

**Date:** 2026-06-28
**Status:** ✅ Certified — 23 indexes, 0 redundant, deployment passed

---

## Deployment Result

```
firebase deploy --only firestore:indexes
✔  Deploy complete! (0 HTTP errors)
```

23 composite indexes deployed to `releaseflow-prod`.

---

## Certification Matrix

| # | Index | Repository Function | Query | Composite Required | Firestore Rule |
|---|-------|-------------------|-------|-------------------|----------------|
| 1 | `releases [orgId, createdAt DESC]` | `getReleasesByOrganization` | `where(orgId) orderBy(createdAt, desc)` | ✅ Yes | where≠orderBy |
| 2 | `releases [orgId, status, createdAt DESC]` | `getReleasesByStatus` (via brief/budgets) | `where(orgId) where(status) orderBy(createdAt, desc)` | ✅ Yes | where≠orderBy |
| 3 | `stages [workflowId, order ASC]` | `getStages` | `where(workflowId) orderBy(order, asc)` | ✅ Yes | where≠orderBy |
| 4 | `activities [releaseId, createdAt DESC]` | `getActivities` | `where(releaseId) orderBy(createdAt, desc)` | ✅ Yes | where≠orderBy |
| 5 | `deliverables [releaseId, createdAt DESC]` | `getDeliverablesByRelease` | `where(releaseId) orderBy(createdAt, desc)` | ✅ Yes | where≠orderBy |
| 6 | `deliverables [stageId, createdAt DESC]` | `getDeliverablesByStage` | `where(stageId) orderBy(createdAt, desc)` | ✅ Yes | where≠orderBy |
| 7 | `deliverables [taskId, createdAt DESC]` | `getDeliverablesByTask` | `where(taskId) orderBy(createdAt, desc)` | ✅ Yes | where≠orderBy |
| 8 | `tasks [stageId, createdAt ASC]` | `getTasksByStage` | `where(stageId) orderBy(createdAt, asc)` | ✅ Yes | where≠orderBy |
| 9 | `tasks [releaseId, status, dueDate ASC]` | Brief deadlines | `where(releaseId, in) where(status, !=) orderBy(dueDate, asc)` | ✅ Yes | inequality+orderBy |
| 10 | `tasks [assigneeId, status, dueDate ASC]` | `getTasksByAssignee` (Work page) | `where(assigneeId) where(status, !=) orderBy(dueDate, asc)` | ✅ Yes | inequality+orderBy |
| 11 | `dependencies [releaseId, createdAt ASC]` | `getDependenciesByRelease` | `where(releaseId) orderBy(createdAt, asc)` | ✅ Yes | where≠orderBy |
| 12 | `distribution_packages [releaseId, createdAt DESC]` | `getLatestPackage` | `where(releaseId) orderBy(createdAt, desc)` | ✅ Yes | where≠orderBy |
| 13 | `distribution_events [packageId, createdAt DESC]` | `getEvents` | `where(packageId) orderBy(createdAt, desc)` | ✅ Yes | where≠orderBy |
| 14 | `asset_references [deliverableId, uploadedAt DESC]` | `getAssetsByDeliverable` | `where(deliverableId) orderBy(uploadedAt, desc)` | ✅ Yes | where≠orderBy |
| 15 | `asset_references [releaseId, uploadedAt DESC]` | `getAssetsByRelease` | `where(releaseId) orderBy(uploadedAt, desc)` | ✅ Yes | where≠orderBy |
| 16 | `campaigns [releaseId, createdAt DESC]` | `getCampaignsByRelease` | `where(releaseId) orderBy(createdAt, desc)` | ✅ Yes | where≠orderBy |
| 17 | `campaign_tasks [campaignId, createdAt ASC]` | `getCampaignTasks` | `where(campaignId) orderBy(createdAt, asc)` | ✅ Yes | where≠orderBy |
| 18 | `release_budgets [releaseId, createdAt DESC]` | `getBudgetByRelease` | `where(releaseId) orderBy(createdAt, desc)` | ✅ Yes | where≠orderBy |
| 19 | `cost_items [releaseId, createdAt DESC]` | Cost items query | `where(releaseId) orderBy(createdAt, desc)` | ✅ Yes | where≠orderBy |
| 20 | `comments [taskId, createdAt ASC]` | `getCommentsByTask` | `where(taskId) orderBy(createdAt, asc)` | ✅ Yes | where≠orderBy |
| 21 | `release_requirements [releaseId, createdAt ASC]` | `getRequirementsByRelease` | `where(releaseId) orderBy(createdAt, asc)` | ✅ Yes | where≠orderBy |
| 22 | `release_budgets [releaseId, status, updatedAt DESC]` | Budget filtering | `where(releaseId) where(status, in) orderBy(updatedAt, desc)` | ✅ Yes | range+orderBy |
| 23 | `operational_alerts [releaseId, resolved, priority DESC]` | Alert listing | `where(releaseId) where(resolved, ==, false) orderBy(priority, desc)` | ✅ Yes | where≠orderBy |

---

## Rejected During Deployment

| Index | Reason | Action |
|-------|--------|--------|
| `workflows [releaseId ASC]` | Firestore returned HTTP 400: "this index is not necessary, configure using single field index controls" | Removed — single `where(field)` covered by auto single-field index |

---

## Verification

| Check | Result |
|-------|--------|
| `firebase deploy --only firestore:indexes` | ✅ Deploy complete, 0 HTTP errors |
| Project | `releaseflow-prod` |
| Indexes in file | 23 |
| Indexes deployed | 23 |
| Redundant indexes | 0 |
| Auto-index covered queries | Not in file |
| App code changes | 0 ✅ |
