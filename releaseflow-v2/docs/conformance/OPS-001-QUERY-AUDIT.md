# OPS-001-QUERY-AUDIT.md

**Date:** 2026-06-29
**Status:** Complete

---

## Scope

183 Firestore operations audited across 30 `.ts` files in `apps/web/src/lib/`.

---

## Summary

| Category | Count |
|----------|-------|
| Total operations | 183 |
| Distinct collections | 30 |
| Composite indexes NEEDED | 35 |
| Auto single-field indexes sufficient | 121 |
| Batch writes | 1 (6 ops) |
| `onSnapshot` listeners | 0 |

---

## Collection Inventory

| # | Collection | Key Queries |
|---|-----------|-------------|
| 1 | `releases` | organizationId + createdAt DESC, organizationId + status |
| 2 | `activities` | releaseId + createdAt DESC |
| 3 | `release_artists` | releaseId ASC, artistId ASC |
| 4 | `workflows` | releaseId ASC (single doc, limit 1) |
| 5 | `stages` | workflowId + order ASC, status ASC |
| 6 | `memberships` | userId + status (active/pending), organizationId ASC |
| 7 | `organizations` | doc(id) — keyed reads only |
| 8 | `distribution_packages` | releaseId + createdAt DESC |
| 9 | `distribution_events` | packageId + createdAt DESC |
| 10 | `asset_references` | deliverableId/releaseId + uploadedAt DESC |
| 11 | `artists` | name ASC (limit 50) |
| 12 | `track_credits` | artistId ASC, trackId ASC |
| 13 | `tracks` | doc(id) — keyed reads only |
| 14 | `rights_holders` | getDocs() — no filters |
| 15 | `release_ownerships` | releaseId ASC |
| 16 | `track_ownerships` | trackId ASC |
| 17 | `tasks` | assigneeId + status + priority/createdAt DESC, stageId + createdAt ASC, releaseId + status |
| 18 | `comments` | taskId + createdAt ASC |
| 19 | `release_requirements` | releaseId + createdAt ASC |
| 20 | `deliverables` | releaseId/stageId/taskId/campaignId + createdAt DESC |
| 21 | `campaigns` | releaseId + createdAt DESC |
| 22 | `campaign_tasks` | campaignId + createdAt ASC |
| 23 | `dependencies` | releaseId + createdAt ASC |
| 24 | `release_budgets` | releaseId + createdAt/status + updatedAt |
| 25 | `cost_items` | releaseId + createdAt DESC |
| 26 | `resource_assignments` | userId ASC, releaseId ASC |
| 27 | `notifications` | userId + read/archived + createdAt DESC |
| 28 | `approval_requests` | approverId + status + createdAt DESC, deliverableId + createdAt DESC |
| 29 | `operational_alerts` | releaseId + resolved + priority DESC + createdAt DESC |
| 30 | `budgets` ⚠️ | BUG: should be `release_budgets` |

---

## Detailed Query Catalog

### release-repository.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R1 | 62 | getDoc | releases | — | — | — | — |
| R2 | 70 | getDocs | releases | organizationId == | createdAt DESC | — | **NEEDED** |
| R3 | 82 | getDocs | release_artists | artistId == | — | — | AUTO |
| R4 | 89 | getDoc | releases | — | — | — | — |
| R5 | 103 | getDocs | releases | organizationId ==, status == | — | — | **NEEDED** |
| R6 | 121 | addDoc | releases | — | — | — | — |
| R7 | 129 | addDoc | activities | — | — | — | — |
| R8 | 152 | batch.set | releases | — | — | — | — |
| R9 | 166 | batch.set | workflows | — | — | — | — |
| R10 | 178 | batch.set | stages | — | — | — | — |
| R11 | 197 | batch.set | release_requirements | — | — | — | — |
| R12 | 207 | batch.set | activities | — | — | — | — |
| R13 | 219 | batch.set | activities | — | — | — | — |
| R14 | 261 | updateDoc | releases | — | — | — | — |
| R15 | 262 | addDoc | activities | — | — | — | — |
| R16 | 281 | updateDoc | releases | — | — | — | — |
| R17 | 282 | addDoc | activities | — | — | — | — |
| R18 | 296 | deleteDoc | releases | — | — | — | — |

### workflow-repository.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R19 | 46 | getDocs | workflows | releaseId == | — | 1 | AUTO |
| R20 | 58 | getDoc | workflows | — | — | — | — |
| R21 | 66 | getDocs | stages | workflowId == | order ASC | — | **NEEDED** |
| R22 | 78 | updateDoc | stages | — | — | — | — |
| R23 | 87 | updateDoc | workflows | — | — | — | — |
| R24 | 100 | addDoc | activities | — | — | — | — |
| R25 | 112 | getDocs | activities | releaseId == | createdAt DESC | max | **NEEDED** |

### organization-repository.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R26 | 25 | getDocs | memberships | userId ==, status == active | — | — | **NEEDED** |
| R27 | 30 | getDoc | organizations | — | — | — | — |
| R28 | 39 | getDocs | memberships | userId ==, status == pending | — | — | **NEEDED** |
| R29 | 44 | getDoc | organizations | — | — | — | — |
| R30 | 58 | addDoc | organizations | — | — | — | — |
| R31 | 61 | addDoc | memberships | — | — | — | — |
| R32 | 69 | getDoc | organizations | — | — | — | — |
| R33 | 77 | updateDoc | memberships | — | — | — | — |
| R34 | 83 | deleteDoc | memberships | — | — | — | — |
| R35 | 89 | updateDoc | memberships | — | — | — | — |
| R36 | 95 | getDocs | memberships | organizationId == | — | — | AUTO |
| R37 | 103 | getDocs | memberships | userId ==, status == active | — | — | **NEEDED** |
| R38 | 114 | getDocs | memberships | userId ==, status == active | — | — | **NEEDED** |
| R39 | 122 | getDoc | organizations | — | — | — | — |

### distribution-repository.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R40 | 39 | addDoc | distribution_packages | — | — | — | — |
| R41 | 55 | updateDoc | distribution_packages | — | — | — | — |
| R42 | 61 | getDocs | distribution_packages | releaseId == | createdAt DESC | 1 | **NEEDED** |
| R43 | 73 | getDocs | distribution_packages | releaseId == | createdAt DESC | — | **NEEDED** |
| R44 | 82 | getDoc | releases | — | — | — | — |
| R45 | 94 | addDoc | distribution_events | — | — | — | — |
| R46 | 105 | getDocs | distribution_events | packageId == | createdAt DESC | — | **NEEDED** |

### asset-repository.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R47 | 53 | addDoc | asset_references | — | — | — | — |
| R48 | 78 | updateDoc | asset_references | — | — | — | — |
| R49 | 84 | deleteDoc | asset_references | — | — | — | — |
| R50 | 90 | getDoc | asset_references | — | — | — | — |
| R51 | 98 | getDocs | asset_references | deliverableId == | uploadedAt DESC | — | **NEEDED** |
| R52 | 107 | getDocs | asset_references | releaseId == | uploadedAt DESC | — | **NEEDED** |
| R53 | 129 | getDocs | asset_references | releaseId == | — | — | AUTO |

### artist-repository.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R54 | 66 | addDoc | artists | — | — | — | — |
| R55 | 94 | updateDoc | artists | — | — | — | — |
| R56 | 100 | deleteDoc | artists | — | — | — | — |
| R57 | 106 | getDoc | artists | — | — | — | — |
| R58 | 114 | getDocs | artists | — | name ASC | max | AUTO |
| R59 | 123 | getDocs | release_artists | releaseId == | — | — | AUTO |
| R60 | 132 | getDocs | release_artists | artistId == | — | — | AUTO |
| R61 | 138 | getDoc | releases | — | — | — | — |
| R62 | 150 | getDocs | track_credits | artistId == | — | — | AUTO |
| R63 | 159 | getDoc | tracks | — | — | — | — |

### rights-repository.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R64 | 42 | addDoc | rights_holders | — | — | — | — |
| R65 | 56 | getDocs | rights_holders | — | — | — | AUTO |
| R66 | 63 | getDoc | rights_holders | — | — | — | — |
| R67 | 71 | deleteDoc | rights_holders | — | — | — | — |
| R68 | 82 | addDoc | release_ownerships | — | — | — | — |
| R69 | 94 | getDocs | release_ownerships | releaseId == | — | — | AUTO |
| R70 | 108 | addDoc | track_ownerships | — | — | — | — |
| R71 | 120 | getDocs | track_ownerships | trackId == | — | — | AUTO |

### task-service.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R72 | 25 | addDoc | tasks | — | — | — | — |
| R73 | 63 | updateDoc | tasks | — | — | — | — |
| R74 | 76 | updateDoc | tasks | — | — | — | — |
| R75 | 82 | deleteDoc | tasks | — | — | — | — |
| R76 | 88 | getDocs | tasks | stageId == | createdAt ASC | — | **NEEDED** |
| R77 | 98 | getDoc | tasks | — | — | — | — |
| R78 | 101 | updateDoc | tasks | — | — | — | — |
| R79 | 125 | updateDoc | tasks | — | — | — | — |
| R80 | 138 | addDoc | comments | — | — | — | — |
| R81 | 169 | getDocs | comments | taskId == | createdAt ASC | — | **NEEDED** |
| R82 | 178 | getDocs | tasks | assigneeId ==, status != done | status, priority DESC, createdAt DESC | — | **NEEDED** |

### rule-engine.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R83 | 33 | getDocs | tasks | releaseId ==, status != done | — | — | **NEEDED** |
| R84 | 34 | getDocs | stages | releaseId == | — | — | AUTO |
| R85 | 35 | getDocs | deliverables | releaseId == | — | — | AUTO |
| R86 | 36 | getDocs | release_requirements | releaseId == | — | — | AUTO |
| R87 | 37 | getDocs | campaigns | releaseId == | — | — | AUTO |
| R88 | 38 | getDocs | release_budgets | releaseId == | createdAt DESC | — | **NEEDED** |
| R89 | 39 | getDocs | dependencies | releaseId == | — | — | AUTO |
| R90 | 83 | getDocs | campaign_tasks | campaignId ==, status != done | — | — | **NEEDED** |
| R91 | 100 | getDocs | releases | organizationId == | — | — | AUTO |

### dependency-service.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R92 | 16 | addDoc | dependencies | — | — | — | — |
| R93 | 38 | updateDoc | dependencies | — | — | — | — |
| R94 | 44 | getDocs | dependencies | releaseId == | createdAt ASC | — | **NEEDED** |

### requirement-service.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R95 | 16 | addDoc | release_requirements | — | — | — | — |
| R96 | 29 | getDocs | release_requirements | releaseId == | createdAt ASC | — | **NEEDED** |
| R97 | 42 | updateDoc | release_requirements | — | — | — | — |
| R98 | 51 | updateDoc | release_requirements | — | — | — | — |
| R99 | 60 | updateDoc | release_requirements | — | — | — | — |

### deliverable-service.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R100 | 29 | addDoc | deliverables | — | — | — | — |
| R101 | 70 | updateDoc | deliverables | — | — | — | — |
| R102 | 90 | updateDoc | deliverables | — | — | — | — |
| R103 | 111 | updateDoc | deliverables | — | — | — | — |
| R104 | 125 | updateDoc | deliverables | — | — | — | — |
| R105 | 131 | getDocs | deliverables | releaseId == | createdAt DESC | — | **NEEDED** |
| R106 | 140 | getDocs | deliverables | stageId == | createdAt DESC | — | **NEEDED** |
| R107 | 149 | getDocs | deliverables | taskId == | createdAt DESC | — | **NEEDED** |

### campaign-service.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R108 | 16 | addDoc | campaigns | — | — | — | — |
| R109 | 40 | updateDoc | campaigns | — | — | — | — |
| R110 | 57 | updateDoc | campaigns | — | — | — | — |
| R111 | 73 | getDocs | campaigns | releaseId == | createdAt DESC | — | **NEEDED** |
| R112 | 92 | addDoc | campaign_tasks | — | — | — | — |
| R113 | 116 | updateDoc | campaign_tasks | — | — | — | — |
| R114 | 131 | getDocs | campaign_tasks | campaignId == | createdAt ASC | — | **NEEDED** |
| R115 | 140 | getDocs | deliverables | campaignId == | createdAt DESC | — | **NEEDED** |

### budget-service.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R116 | 9 | addDoc | release_budgets | — | — | — | — |
| R117 | 25 | getDocs | release_budgets | releaseId == | createdAt DESC | — | **NEEDED** |
| R118 | 43 | addDoc | cost_items | — | — | — | — |
| R119 | 60 | getDocs | cost_items | releaseId == | createdAt DESC | — | **NEEDED** |
| R120 | 79 | updateDoc | release_budgets | — | — | — | — |

### resource-service.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R121 | 8 | addDoc | resource_assignments | — | — | — | — |
| R122 | 21 | updateDoc | resource_assignments | — | — | — | — |
| R123 | 27 | getDocs | resource_assignments | userId == | — | — | AUTO |
| R124 | 36 | getDocs | resource_assignments | releaseId == | — | — | AUTO |
| R125 | 73 | getDocs | releases | organizationId == | — | — | AUTO |

### notification-service.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R126 | 17 | addDoc | notifications | — | — | — | — |
| R127 | 42 | updateDoc | notifications | — | — | — | — |
| R128 | 55 | updateDoc | notifications | — | — | — | — |
| R129 | 68 | getDocs | notifications | userId ==, archived == false | createdAt DESC | max | **NEEDED** |
| R130 | 83 | getDocs | notifications | userId ==, read == false, archived == false | — | — | **NEEDED** |

### approval-service.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R131 | 15 | addDoc | approval_requests | — | — | — | — |
| R132 | 38 | updateDoc | approval_requests | — | — | — | — |
| R133 | 55 | updateDoc | approval_requests | — | — | — | — |
| R134 | 71 | getDocs | approval_requests | approverId ==, status == pending | createdAt DESC | — | **NEEDED** |
| R135 | 85 | getDocs | approval_requests | deliverableId == | createdAt DESC | 1 | **NEEDED** |

### alert-engine.ts

| # | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|----|-----------|---------|---------|-------|-------|
| R136 | 14 | getDocs | operational_alerts | releaseId, rule, entityId, resolved == false | — | — | **NEEDED** |
| R137 | 25 | addDoc | operational_alerts | — | — | — | — |
| R138 | 45 | getDocs | operational_alerts | releaseId, rule, entityId, resolved == false | — | — | **NEEDED** |
| R139 | 56 | addDoc | operational_alerts | — | — | — | — |
| R140 | 72 | getDocs | releases | organizationId == | — | — | AUTO |
| R141 | 83 | getDocs | operational_alerts | releaseId ==, resolved == false | priority DESC, createdAt DESC | — | **NEEDED** |
| R142 | 100 | updateDoc | operational_alerts | — | — | — | — |

### Additional Service Queries

| # | File | Line | Op | Collection | Filters | OrderBy | Limit | Index |
|---|------|------|----|-----------|---------|---------|-------|-------|
| R143-153 | baseline-metrics.ts | 30 | getDocs | tasks/stages/deliverables/etc | releaseId in [ids] | — | 100 | AUTO |
| R154-161 | query-analyzer.ts | 24|33 | various | various | various | various | various | AUTO |
| R162-178 | integrity-validator.ts | 26|47|51|91 | various | various | various | various | AUTO |
| R179 | recommendation-engine.ts | 16 | getDocs | releases | organizationId ==, status != archived | — | — | **NEEDED** |
| R180-185 | recommendation-engine.ts | 25-30 | getDocs | stages/tasks/deliverables/etc | releaseId == | various | various | various |

---

## Bugs

| # | File | Line | Issue |
|---|------|------|-------|
| B1 | `integrity-validator.ts` | 41 | Queries `collection(db, 'budgets')` — should be `'release_budgets'` |
