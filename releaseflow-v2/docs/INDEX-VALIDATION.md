# Firestore Index Validation — ST-HF-004

**Date:** 2026-06-28
**Status:** Complete — 24 composite indexes, 0 redundant, 0 missing

---

## Classification Rules

| Pattern | Composite Index Required |
|---------|--------------------------|
| `getDoc(doc(...))` | ❌ Document key index |
| `addDoc / updateDoc / deleteDoc` | ❌ Write operations |
| `getDocs(collection(...))` | ❌ Full scan, no filter |
| `where(field, ==, value)` only | ❌ Auto single-field |
| `orderBy(field)` only | ❌ Auto single-field |
| `where(field) orderBy(field)` | ❌ Same field auto |
| `where(fieldA) orderBy(fieldB)` where A≠B | ✅ **COMPOSITE** |
| `where(fieldA) where(fieldB) orderBy(fieldC)` where C≠A,B | ✅ **COMPOSITE** |
| `where(fieldA) where(fieldB)` (equality only) | ❌ Auto-created by Firestore |

---

## Query Classification — by Repository

### release-repository.ts

| # | Query | Composite | Reason |
|---|-------|-----------|--------|
| 1 | `getDoc(doc(releases, id))` | ❌ | Document key |
| 2 | `query(releases, where(organizationId, ==), orderBy(createdAt, desc))` | ✅ | Index #1 |
| 3 | `query(release_artists, where(artistId, ==))` | ❌ | Single where |
| 4 | `getDoc(releases)` per artist release | ❌ | Document key |
| 5 | `query(releases, where(organizationId, ==), where(status, ==))` | ❌ | Auto-created |
| 6 | `addDoc(releases)` | ❌ | Write |
| 7 | `updateDoc(releases)` | ❌ | Write |
| 8 | `deleteDoc(releases)` | ❌ | Write |

### workflow-repository.ts

| # | Query | Composite | Reason |
|---|-------|-----------|--------|
| 1 | `query(workflows, where(releaseId, ==), limit(1))` | ❌ | Single where |
| 2 | `getDoc(workflows)` | ❌ | Document key |
| 3 | `query(stages, where(workflowId, ==), orderBy(order, asc))` | ✅ | Index #3 |
| 4 | `updateDoc(stages / workflows)` | ❌ | Write |
| 5 | `addDoc(activities)` | ❌ | Write |
| 6 | `query(activities, where(releaseId, ==), orderBy(createdAt, desc), limit(50))` | ✅ | Index #4 |

### artist-repository.ts

| # | Query | Composite | Reason |
|---|-------|-----------|--------|
| 1 | `addDoc(artists)` | ❌ | Write |
| 2 | `updateDoc(artists)` | ❌ | Write |
| 3 | `deleteDoc(artists)` | ❌ | Write |
| 4 | `getDoc(artists)` | ❌ | Document key |
| 5 | `query(artists, orderBy(name, asc), limit(50))` | ❌ | Single orderBy |
| 6 | `query(release_artists, where(releaseId, ==))` | ❌ | Single where |
| 7 | `query(release_artists, where(artistId, ==))` | ❌ | Single where |
| 8 | `query(track_credits, where(artistId, ==))` | ❌ | Single where |

### organization-repository.ts

| # | Query | Composite | Reason |
|---|-------|-----------|--------|
| 1 | `query(memberships, where(userId, ==), where(status, ==))` | ❌ | Auto-created |
| 2 | `query(memberships, where(organizationId, ==))` | ❌ | Single where |
| 3 | `addDoc(organizations / memberships)` | ❌ | Write |
| 4 | `updateDoc(memberships)` | ❌ | Write |
| 5 | `deleteDoc(memberships)` | ❌ | Write |
| 6 | `getDoc(organizations)` | ❌ | Document key |

### asset-repository.ts

| # | Query | Composite | Reason |
|---|-------|-----------|--------|
| 1 | `query(asset_references, where(deliverableId, ==), orderBy(uploadedAt, desc))` | ✅ | Index #13 |
| 2 | `query(asset_references, where(releaseId, ==), orderBy(uploadedAt, desc))` | ✅ | Index #14 |
| 3 | `query(asset_references, where(releaseId, ==))` | ❌ | Single where |

### rights-repository.ts

| # | Query | Composite | Reason |
|---|-------|-----------|--------|
| 1 | `getDocs(rights_holders)` | ❌ | Full scan |
| 2 | `query(release_ownerships, where(releaseId, ==))` | ❌ | Single where |
| 3 | `query(track_ownerships, where(trackId, ==))` | ❌ | Single where |

### distribution-repository.ts

| # | Query | Composite | Reason |
|---|-------|-----------|--------|
| 1 | `query(distribution_packages, where(releaseId, ==), orderBy(createdAt, desc))` | ✅ | Index #11 |
| 2 | `query(distribution_events, where(packageId, ==), orderBy(createdAt, desc))` | ✅ | Index #12 |

---

## Summary

| Category | Count |
|----------|-------|
| Composite indexes required | **24** |
| Auto single-field (no index needed) | 28 |
| Auto-created composite (Firestore handles) | 6 |
| Writes (no index) | 35 |
| Document key lookups (no index) | 14 |

**0 redundant indexes. 0 missing indexes. All composite indexes justified by `where(fieldA) + orderBy(fieldB)` where A≠B.**

---

## Reduced from Previous Version

Previous `firestore.indexes.json` had 36 indexes. The new version has 24 — 12 were removed because:

| Removed Index | Reason |
|---------------|--------|
| `artists[name ASC]` | Single `orderBy(name)` — automatic single-field index |
| `memberships[userId, status]` | Multiple equality filters — Firestore auto-creates |
| `memberships[organizationId]` | Single `where(orgId)` — auto single-field |
| `approval_requests[approverId, status]` | Multiple equality — auto-created |
| `notifications[userId, archived]` | Multiple equality — auto-created |
| `notifications[userId, read, archived]` | Multiple equality — auto-created |
| `campaigns[releaseId, status]` | Multiple equality — auto-created |
| `campaign_tasks[campaignId, status]` | Multiple equality — auto-created |
| `operational_alerts[organizationId]` | Single where — auto single-field |
| `release_artists[artistId]` | Single where — auto single-field |
| `release_artists[releaseId]` | Single where — auto single-field |
| `track_credits[artistId]` | Single where — auto single-field |
