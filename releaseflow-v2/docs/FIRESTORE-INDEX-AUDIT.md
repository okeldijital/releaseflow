# Firestore Index Audit — RC1-HF-001

**Date:** 2026-06-28
**Status:** Complete

---

## Summary

| Metric | Count |
|--------|-------|
| Total queries analyzed | 72 |
| Composite indexes required | 36 |
| Single-field indexes (auto) | 6 |
| Queries on single `where()` only | 24 |
| Orphaned queries (engines) | 6 |

---

## Phase 3 — Dashboard Query

**File**: `lib/release-repository.ts:70-73`

```
Collection: releases
Query:       where('organizationId', '==', orgId)
             orderBy('createdAt', 'desc')
Index:       [organizationId ASC, createdAt DESC]  ← Index #1
```

This is the primary query powering the Operations Center Active Releases table. Without this composite index, the dashboard shows 0 releases even when releases exist.

---

## Composite Index Map

| # | Collection | Fields | Query Pattern |
|---|-----------|--------|---------------|
| 1 | releases | `organizationId ASC, createdAt DESC` | Dashboard, release list |
| 2 | releases | `organizationId ASC, status ASC` | Status filtering |
| 3 | stages | `workflowId ASC, order ASC` | Workflow board ordering |
| 4 | stages | `status ASC` | Blocked stages lookup |
| 5 | tasks | `stageId ASC, createdAt ASC` | Tasks per stage |
| 6 | tasks | `releaseId ASC, status ASC, dueDate ASC` | Brief deadlines |
| 7 | tasks | `assigneeId ASC, status ASC, dueDate ASC` | Work page |
| 8 | activities | `releaseId ASC, createdAt DESC` | Activity feeds |
| 9 | deliverables | `releaseId ASC, createdAt DESC` | Release deliverables |
| 10 | deliverables | `stageId ASC, createdAt DESC` | Stage deliverables |
| 11 | deliverables | `taskId ASC, createdAt DESC` | Task deliverables |
| 12 | dependencies | `releaseId ASC, createdAt ASC` | Dependency lists |
| 13 | distribution_packages | `releaseId ASC, createdAt DESC` | Package history |
| 14 | distribution_events | `packageId ASC, createdAt DESC` | Event history |
| 15 | campaigns | `releaseId ASC, createdAt DESC` | Campaign lists |
| 16 | campaign_tasks | `campaignId ASC, createdAt ASC` | Campaign tasks |
| 17 | release_budgets | `releaseId ASC, createdAt DESC` | Budget lists |
| 18 | cost_items | `releaseId ASC, createdAt DESC` | Cost items |
| 19 | memberships | `userId ASC, status ASC` | Org memberships (active) |
| 20 | memberships | `organizationId ASC` | Members by org |
| 21 | asset_references | `deliverableId ASC, uploadedAt DESC` | Assets per deliverable |
| 22 | asset_references | `releaseId ASC, uploadedAt DESC` | Assets per release |
| 23 | artists | `name ASC` | Artist list ordering |
| 24 | comments | `taskId ASC, createdAt ASC` | Task comments |
| 25 | approval_requests | `approverId ASC, status ASC` | Approvals |
| 26 | notifications | `userId ASC, archived ASC` | Notifications |
| 27 | release_requirements | `releaseId ASC, createdAt ASC` | Requirements |
| 28 | release_budgets | `releaseId ASC, status ASC, updatedAt DESC` | Budget filtering |
| 29 | campaigns | `releaseId ASC, status ASC` | Campaign filtering |
| 30 | campaign_tasks | `campaignId ASC, status ASC` | Campaign task filtering |
| 31 | operational_alerts | `releaseId ASC, resolved ASC, priority DESC` | Alert listing |
| 32 | operational_alerts | `organizationId ASC` | Org alerts |
| 33 | workflows | `releaseId ASC` | Workflow lookup |
| 34 | release_artists | `artistId ASC` | Artist releases |
| 35 | release_artists | `releaseId ASC` | Release artists |
| 36 | track_credits | `artistId ASC` | Artist credits |

---

## Deployment

Deploy with Firebase CLI:

```bash
firebase deploy --only firestore:indexes
```

Or via `firebase.json` referencing `firestore.indexes.json`.
