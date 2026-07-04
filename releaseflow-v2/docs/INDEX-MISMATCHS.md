# Index Mismatch Analysis — ST-HF-003

**Date:** 2026-06-28

---

## Comparison: Runtime Queries vs `firestore.indexes.json`

| # | Runtime Query | firestore.indexes.json Entry | Match |
|---|--------------|------------------------------|-------|
| 1 | `releases` `where(orgId)` `orderBy(createdAt, desc)` | Index #1: `[organizationId ASC, createdAt DESC]` | ✅ |
| 2 | `releases` `where(orgId)` `where(status)` | Index #2: `[organizationId ASC, status ASC]` | ✅ |
| 3 | `stages` `where(workflowId)` `orderBy(order, asc)` | Index #3: `[workflowId ASC, order ASC]` | ✅ |
| 4 | `stages` `where(status, ==, 'blocked')` | Index #4: `[status ASC]` | ✅ |
| 5 | `tasks` `where(stageId)` `orderBy(createdAt, asc)` | Index #5: `[stageId ASC, createdAt ASC]` | ✅ |
| 6 | `tasks` `where(releaseId, in)` `where(status, !=)` `orderBy(dueDate, asc)` | Index #6: `[releaseId ASC, status ASC, dueDate ASC]` | ✅ |
| 7 | `tasks` `where(assigneeId)` `where(status, !=)` `orderBy(dueDate, asc)` | Index #7: `[assigneeId ASC, status ASC, dueDate ASC]` | ✅ |
| 8 | `activities` `where(releaseId)` `orderBy(createdAt, desc)` | Index #8: `[releaseId ASC, createdAt DESC]` | ✅ |
| 9 | `deliverables` `where(releaseId)` `orderBy(createdAt, desc)` | Index #9: `[releaseId ASC, createdAt DESC]` | ✅ |
| 10 | `deliverables` `where(stageId)` `orderBy(createdAt, desc)` | Index #10: `[stageId ASC, createdAt DESC]` | ✅ |
| 11 | `deliverables` `where(taskId)` `orderBy(createdAt, desc)` | Index #11: `[taskId ASC, createdAt DESC]` | ✅ |
| 12 | `dependencies` `where(releaseId)` `orderBy(createdAt, asc)` | Index #12: `[releaseId ASC, createdAt ASC]` | ✅ |
| 13 | `distribution_packages` `where(releaseId)` `orderBy(createdAt, desc)` | Index #13: `[releaseId ASC, createdAt DESC]` | ✅ |
| 14 | `distribution_events` `where(packageId)` `orderBy(createdAt, desc)` | Index #14: `[packageId ASC, createdAt DESC]` | ✅ |
| 15 | `campaigns` `where(releaseId)` `orderBy(createdAt, desc)` | Index #15: `[releaseId ASC, createdAt DESC]` | ✅ |
| 16 | `campaign_tasks` `where(campaignId)` `orderBy(createdAt, asc)` | Index #16: `[campaignId ASC, createdAt ASC]` | ✅ |
| 17 | `release_budgets` `where(releaseId)` `orderBy(createdAt, desc)` | Index #17: `[releaseId ASC, createdAt DESC]` | ✅ |
| 18 | `cost_items` `where(releaseId)` `orderBy(createdAt, desc)` | Index #18: `[releaseId ASC, createdAt DESC]` | ✅ |
| 19 | `memberships` `where(userId)` `where(status)` | Index #19: `[userId ASC, status ASC]` | ✅ |
| 20 | `memberships` `where(orgId)` | Index #20: `[organizationId ASC]` | ✅ |
| 21 | `asset_references` `where(deliverableId)` `orderBy(uploadedAt, desc)` | Index #21: `[deliverableId ASC, uploadedAt DESC]` | ✅ |
| 22 | `asset_references` `where(releaseId)` `orderBy(uploadedAt, desc)` | Index #22: `[releaseId ASC, uploadedAt DESC]` | ✅ |
| 23 | `artists` `orderBy(name, asc)` | Index #23: `[name ASC]` | ✅ |
| 24 | `comments` `where(taskId)` `orderBy(createdAt, asc)` | Index #24: `[taskId ASC, createdAt ASC]` | ✅ |
| 25 | `approval_requests` `where(approverId)` `where(status)` | Index #25: `[approverId ASC, status ASC]` | ✅ |
| 26 | `notifications` `where(userId)` `where(archived)` | Index #26: `[userId ASC, archived ASC]` | ✅ |
| 27 | `release_requirements` `where(releaseId)` `orderBy(createdAt, asc)` | Index #27: `[releaseId ASC, createdAt ASC]` | ✅ |
| 28 | `release_budgets` `where(releaseId)` `where(status)` `orderBy(updatedAt, desc)` | Index #28: `[releaseId ASC, status ASC, updatedAt DESC]` | ✅ |
| 29 | `campaigns` `where(releaseId)` `where(status)` | Index #29: `[releaseId ASC, status ASC]` | ✅ |
| 30 | `campaign_tasks` `where(campaignId)` `where(status)` | Index #30: `[campaignId ASC, status ASC]` | ✅ |
| 31 | `operational_alerts` `where(releaseId)` `where(resolved)` `orderBy(priority, desc)` | Index #31: `[releaseId ASC, resolved ASC, priority DESC]` | ✅ |
| 32 | `operational_alerts` `where(orgId)` | Index #32: `[organizationId ASC]` | ✅ |
| 33 | `workflows` `where(releaseId)` | Index #33: `[releaseId ASC]` | ✅ |
| 34 | `release_artists` `where(artistId)` | Index #34: `[artistId ASC]` | ✅ |
| 35 | `release_artists` `where(releaseId)` | Index #35: `[releaseId ASC]` | ✅ |
| 36 | `track_credits` `where(artistId)` | Index #36: `[artistId ASC]` | ✅ |

---

## Result: No Mismatches

All 36 runtime queries match their corresponding entries in `firestore.indexes.json`. Every composite index is defined and accounted for.

The most likely cause of any runtime index error is that `firestore.indexes.json` has not yet been deployed to Firebase. Deploy with:

```bash
firebase deploy --only firestore:indexes
```
