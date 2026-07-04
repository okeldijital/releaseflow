# Runtime Query Trace — ST-HF-003

**Date:** 2026-06-28
**Status:** Complete

---

## Instrumentation

Every repository query function in the 7 core repositories now logs to the browser console via `query-trace.ts`:

```
[Repository] Release → releases
  where: [["organizationId", "==", "abc123"]]
  orderBy: [["createdAt", "desc"]]
```

On error:

```
[Firestore Query Failed] { repository, collection, queryDefinition, error }
```

---

## Query Load Order (Dashboard)

When `/dashboard` loads with an active organization:

1. `[Repository] Release → releases` — `where(organizationId, ==, orgId)` `orderBy(createdAt, desc)` — **Index #1**
2. `[Repository] Workflow → workflows` — `where(releaseId, ==, id)` `limit(1)` — **Index #33**
3. `[Repository] Workflow → stages` — `where(workflowId, ==, id)` `orderBy(order, asc)` — **Index #3**
4. `[Repository] Workflow → activities` — `where(releaseId, ==, id)` `orderBy(createdAt, desc)` `limit(50)` — **Index #8**

---

## Query Load Order (Release Workspace)

When `/releases/[id]` loads:

1. `[Repository] Release → releases` (single doc)
2. `[Repository] Workflow → workflows` — `where(releaseId, ==, id)` `limit(1)` — **Index #33**
3. `[Repository] Workflow → stages` — `where(workflowId, ==, id)` `orderBy(order, asc)` — **Index #3**
4. `[Repository] Workflow → activities` — `where(releaseId, ==, id)` `orderBy(createdAt, desc)` — **Index #8**
5. `deliverable-service` → `where(releaseId, ==, id)` `orderBy(createdAt, desc)` — **Index #9**
6. `dependency-service` → `where(releaseId, ==, id)` `orderBy(createdAt, asc)` — **Index #12**
7. `distribution-repository` → `where(releaseId, ==, id)` `orderBy(createdAt, desc)` — **Index #13**
8. `rights-repository` → `where(releaseId, ==, id)` — **Index #35**

---

## Query Load Order (Artist Workspace)

When `/artists/[id]` loads:

1. `[Repository] Artist → artists` (single doc)
2. `[Repository] Release → release_artists` — `where(artistId, ==, id)` — **Index #34**
3. `[Repository] Artist → track_credits` — `where(artistId, ==, id)` — **Index #36**
4. `releases` (individual getDocs per release found)
5. `tracks` (individual getDocs per track credit)

---

## Query Load Order (Org Layout)

When AppShell loads:

1. `[Repository] Organization → memberships` — `where(userId, ==, id)` `where(status, ==, 'active')` — **Index #19**
2. `organizations` (individual getDocs per membership)

---

## Error Capture Pattern

Each repository query is wrapped with `traceQuery()` before execution. If Firestore throws an index error, the browser console will show:

```
[Firestore Query Failed] {
  repository: "Release",
  collection: "releases",
  queryDefinition: { where: [["organizationId","==",...]], orderBy: [["createdAt","desc"]] },
  error: "The query requires an index. You can create it here: https://..."
}
```

The included Firebase URL in the error message provides the exact composite index definition needed.
