# Firestore Query Map — RC1-HF-001

**Date:** 2026-06-28

---

## Query Inventory by Collection

### `releases` (5 queries)
| Query | Location | Index |
|-------|----------|-------|
| `where(organizationId, ==)` `orderBy(createdAt, desc)` | release-repository.ts:70 | [#1] |
| `where(organizationId, ==)` `where(status, ==)` | release-repository.ts:105 | [#2] |
| `where(organizationId, ==)` `where(status, !=, 'archived')` | recommendation-engine.ts:17 | TODO |
| `where(organizationId, ==)` `orderBy(createdAt, desc)` | budgets/page.tsx:25 | [#1] |
| `where(organizationId, ==)` `limit(10)` | query-analyzer.ts:25 | — |

### `stages` (3 queries)
| Query | Location | Index |
|-------|----------|-------|
| `where(workflowId, ==)` `orderBy(order, asc)` | workflow-repository.ts:67 | [#3] |
| `where(status, ==, 'blocked')` | various P2 pages | [#4] |

### `tasks` (4 queries)
| Query | Location | Index |
|-------|----------|-------|
| `where(stageId, ==)` `orderBy(createdAt, asc)` | task-service.ts:89 | [#5] |
| `where(releaseId, in)` `where(status, !=)` `orderBy(dueDate, asc)` | brief/page.tsx:66 | [#6] |
| `where(assigneeId, ==)` `where(status, !=)` `orderBy(dueDate, asc)` | task-service.ts:179 | [#7] |

### `activities` (1 query)
| Query | Location | Index |
|-------|----------|-------|
| `where(releaseId, ==)` `orderBy(createdAt, desc)` `limit(50)` | workflow-repository.ts:113 | [#8] |

### `deliverables` (3 queries)
| Query | Location | Index |
|-------|----------|-------|
| `where(releaseId, ==)` `orderBy(createdAt, desc)` | deliverable-service.ts:132 | [#9] |
| `where(stageId, ==)` `orderBy(createdAt, desc)` | deliverable-service.ts:141 | [#10] |
| `where(taskId, ==)` `orderBy(createdAt, desc)` | deliverable-service.ts:150 | [#11] |

### `dependencies` (1 query)
| Query | Location | Index |
|-------|----------|-------|
| `where(releaseId, ==)` `orderBy(createdAt, asc)` | dependency-service.ts:45 | [#12] |

### `distribution_packages` (2 queries)
| Query | Location | Index |
|-------|----------|-------|
| `where(releaseId, ==)` `orderBy(createdAt, desc)` `limit(1)` | distribution-repository.ts:62 | [#13] |
| `where(releaseId, ==)` `orderBy(createdAt, desc)` | distribution-repository.ts:74 | [#13] |

### `distribution_events` (1 query)
| Query | Location | Index |
|-------|----------|-------|
| `where(packageId, ==)` `orderBy(createdAt, desc)` | distribution-repository.ts:106 | [#14] |

### `campaigns` (3 queries)
| Query | Location | Index |
|-------|----------|-------|
| `where(releaseId, ==)` `orderBy(createdAt, desc)` | campaign-service.ts:74 | [#15] |
| `where(releaseId, ==)` `where(status, ==)` | campaign/page.tsx | [#29] |

### `memberships` (3 queries)
| Query | Location | Index |
|-------|----------|-------|
| `where(userId, ==)` `where(status, ==, 'active')` | organization-repository.ts:25 | [#19] |
| `where(userId, ==)` `where(status, ==, 'pending')` | organization-repository.ts:39 | [#19] |
| `where(organizationId, ==)` | organization-repository.ts:95 | [#20] |

### `asset_references` (3 queries)
| Query | Location | Index |
|-------|----------|-------|
| `where(deliverableId, ==)` `orderBy(uploadedAt, desc)` | asset-repository.ts:99 | [#21] |
| `where(releaseId, ==)` `orderBy(uploadedAt, desc)` | asset-repository.ts:108 | [#22] |

### `artists` (1 query)
| Query | Location | Index |
|-------|----------|-------|
| `orderBy(name, asc)` `limit(50)` | artist-repository.ts:115 | [#23] |

### `operational_alerts` (2 queries)
| Query | Location | Index |
|-------|----------|-------|
| `where(releaseId, ==)` `where(resolved, ==, false)` `orderBy(priority, desc)` | (legacy) | [#31] |
| `where(organizationId, ==)` | (legacy) | [#32] |
