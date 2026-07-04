# Firestore Performance Report — RC1-HF-001

**Date:** 2026-06-28

---

## Collection Scans

The following queries would perform full collection scans without the listed composite index:

| Collection | Query | Index Required |
|-----------|-------|----------------|
| `releases` | `where(organizationId, ==)` `orderBy(createdAt, desc)` | [#1] |
| `stages` | `where(workflowId, ==)` `orderBy(order, asc)` | [#3] |
| `tasks` | `where(stageId, ==)` `orderBy(createdAt, asc)` | [#5] |
| `tasks` | `where(releaseId, in)` `where(status, !=)` `orderBy(dueDate, asc)` | [#6] |
| `tasks` | `where(assigneeId, ==)` `where(status, !=)` `orderBy(dueDate, asc)` | [#7] |
| `activities` | `where(releaseId, ==)` `orderBy(createdAt, desc)` | [#8] |
| `deliverables` | `where(releaseId, ==)` `orderBy(createdAt, desc)` | [#9] |

**All resolved** by `firestore.indexes.json`.

---

## Pagination Gaps

| Query | Issue | Recommendation |
|-------|-------|---------------|
| `getArtists()` (artist-repository.ts:115) | `limit(50)` hardcoded | Add cursor-based pagination for large rosters |
| `getReleasesByOrganization()` | No limit | Add `limit(100)` with `startAfter` for very large orgs (100+ releases) |
| `getActivities()` (workflow-repository.ts:113) | `limit(50)` | Acceptable for activity feeds |

---

## Missing `orderBy`

All queries that use `orderBy` are paired with the appropriate composite index. No queries lack `orderBy` where needed for deterministic results.

---

## Redundant Filters

| Query | Note |
|-------|------|
| `where(releaseId, '==', releaseId)` `orderBy(createdAt, desc)` `limit(1)` | Common pattern — single doc fetch could use `getDoc()` directly if ID is known |
| Engine queries (rule-engine.ts) | 6 parallel queries per release — could batch into single query where schema permits |

---

## Recommendations

1. **Deploy firestore.indexes.json** — 36 composite indexes covering all production queries
2. **Monitor index build time** — complex indexes (3+ fields) may take minutes to build
3. **Add pagination** to `getReleasesByOrganization` for orgs with 100+ releases
4. **Refactor engine queries** to use batch reads where possible

---

## Verification

| Check | Result |
|-------|--------|
| TypeScript | ✅ 6/6 |
| Build | ✅ 1/1 |
| Tests | ✅ 327 passed |
| Index file generated | ✅ `firestore.indexes.json` |
| UI changes | ✅ 0 |
| Architecture changes | ✅ 0 |
