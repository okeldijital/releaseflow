# OPS-001-INDEX-AUDIT.md

**Date:** 2026-06-29
**Status:** Complete

---

## Summary

| Metric | Value |
|--------|-------|
| Total indexes | 35 |
| Distinct collections | 22 |
| Single-field indexes | 8 |
| Multi-field composite indexes | 27 |
| Collections without composite index | 8 (auto single-field sufficient) |

---

## Index Specification

### 1. releases — 2 indexes

| # | Fields | Queries Served |
|---|--------|---------------|
| 1 | organizationId ASC, createdAt DESC | R2, release listing by org |
| 2 | organizationId ASC, status ASC, createdAt DESC | R5, releases by org+status |

### 2. tasks — 5 indexes

| # | Fields | Queries Served |
|---|--------|---------------|
| 3 | stageId ASC, createdAt ASC | R76, tasks by stage |
| 4 | releaseId ASC, status ASC, createdAt DESC | R83, tasks by release+status |
| 5 | assigneeId ASC, status ASC, priority DESC, createdAt DESC | R82, Work page (getTasksByAssignee) |
| 6 | assigneeId ASC, dueDate ASC | — |
| 7 | assigneeId ASC, status ASC, dueDate ASC | — |

### 3. deliverables — 4 indexes

| # | Fields | Queries Served |
|---|--------|---------------|
| 8 | releaseId ASC, createdAt DESC | R105, deliverables by release |
| 9 | campaignId ASC, createdAt DESC | R115, deliverables by campaign |
| 10 | stageId ASC, createdAt DESC | R106, deliverables by stage |
| 11 | taskId ASC, createdAt DESC | R107, deliverables by task |

### 4. stages — 2 indexes

| # | Fields | Queries Served |
|---|--------|---------------|
| 12 | workflowId ASC, order ASC | R21, stages by workflow |
| 13 | status ASC | — (single-field) |

### 5. notifications — 2 indexes

| # | Fields | Queries Served |
|---|--------|---------------|
| 14 | userId ASC, read ASC, archived ASC, createdAt DESC | R130, unread count |
| 15 | userId ASC, archived ASC, createdAt DESC | R129, notification list |

### 6. release_budgets — 2 indexes

| # | Fields | Queries Served |
|---|--------|---------------|
| 16 | releaseId ASC, createdAt DESC | R88, R117, budgets by release |
| 17 | releaseId ASC, status ASC, updatedAt DESC | R120, budget status queries |

### 7. asset_references — 2 indexes

| # | Fields | Queries Served |
|---|--------|---------------|
| 18 | deliverableId ASC, uploadedAt DESC | R51, assets by deliverable |
| 19 | releaseId ASC, uploadedAt DESC | R52, assets by release |

### 8. dependencies — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 20 | releaseId ASC, createdAt ASC | R89, R94, dependencies by release |

### 9. distribution_packages — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 21 | releaseId ASC, createdAt DESC | R42, R43, distribution packages by release |

### 10. distribution_events — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 22 | packageId ASC, createdAt DESC | R46, events by package |

### 11. campaigns — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 23 | releaseId ASC, createdAt DESC | R87, R111, campaigns by release |

### 12. campaign_tasks — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 24 | campaignId ASC, createdAt ASC | R90, R114, tasks by campaign |

### 13. comments — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 25 | taskId ASC, createdAt ASC | R81, comments by task |

### 14. cost_items — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 26 | releaseId ASC, createdAt DESC | R119, cost items by release |

### 15. release_requirements — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 27 | releaseId ASC, createdAt ASC | R86, R96, requirements by release |

### 16. activities — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 28 | releaseId ASC, createdAt DESC | R25, activities by release |

### 17. operational_alerts — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 29 | releaseId ASC, resolved ASC, priority DESC, createdAt DESC | R136/R138 (4-field query), R141, alerts grouped by release |

### 18. approval_requests — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 30 | approverId ASC, status ASC, createdAt DESC | R134, pending approvals by approver |

### 19. memberships — 1 index

| # | Fields | Queries Served |
|---|--------|---------------|
| 31 | userId ASC, status ASC | R26 (active), R28 (pending), R37/R38, user memberships |

### 20-22. Single-Field Indexes (4 total)

| # | Collection | Field |
|---|-----------|-------|
| 32 | release_ownerships | releaseId ASC |
| 33 | release_artists | releaseId ASC |
| 34 | resource_assignments | userId ASC |
| 35 | track_credits | trackId ASC |

---

## Collections Without Composite Indexes

These 8 collections use only single-field (auto-created) indexes because queries are either:
- Single where clause equality filters
- `getDoc(doc())` keyed reads
- Write-only operations

| Collection | Reason |
|-----------|--------|
| `workflows` | Single doc reads, batch writes |
| `organizations` | getDoc only |
| `artists` | Single `orderBy name` query |
| `tracks` | getDoc only |
| `rights_holders` | No filter queries (getDocs all) |
| `track_ownerships` | Single `where trackId` |
| `budgets` | BUG — should be release_budgets |
| `resource_assignments` | Single `where userId` or `where releaseId` |

---

## Deployment

```bash
firebase deploy --only firestore:indexes
```

Expected: 35 indexes, 22 collections. All report `Enabled` after 5-10 minutes.
