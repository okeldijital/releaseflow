# BUILD-010 / BUG-010 / BUILD-010B — Artwork Upload Evidence

**Date:** 2026-07-21  
**Environment:** `localhost:3000` → Firebase `releaseflow-prod`  
**Organization:** `kSJZqhqlWtMRdHkkw0kJ` (BUG009B Live Label V5)  
**Operator account:** `bug009b.v5.8b35ba@example.com` (`sKqqdlepA8VcdjEVMoa56NiyDp43`)  
**Test title:** `Artwork Verification 2026-07-21 16:59:15`  
**Release ID (constant entire workflow):** `agykyzJniJlbku5iNq7O`

---

## Final validation

| Gate | Status |
|------|--------|
| Browser verification | **PASS** (S1–S6) |
| Firestore verification | **PASS** |
| Cloudinary destroy | **PASS** (HTTP 200, `result: ok`) |
| Evidence complete | **YES** (actual values) |
| No open defects | **YES** after BUG-010 |
| BUILD-010 Release Ready | **YES** |

**Final:** **PASS**  
**Operator:** BUILD-010B / BUG-010 agent session  
**Date:** 2026-07-21  

---

## BUG-010 fix

**File (historical BUILD-010A):** was `apps/web/src/app/api/artwork/destroy/route.ts`  
**Current (BUILD-014D):** `apps/web/src/app/api/media/destroy/route.ts`  

**Change:** Exclude `api_key` from Cloudinary destroy string-to-sign. Sign only `public_id` + `timestamp`. Algorithm (sorted params + SHA-1) unchanged. `api_key` still sent in form body.

---

## Browser scenarios

| Scenario | Result | Evidence |
|----------|--------|----------|
| S1 Upload | **PASS** | Artwork `PWFPJE3LWQ2iumZO7pFd`, Continue enabled |
| S2 Replace | **PASS** | Same Release + Artwork IDs; publicId `fasoezqcptm2wgfkxjv9` → `bosco9uey48kp5hhm4jk` |
| S3 Remove | **PASS** | destroy HTTP **200** body `{"success":true,"result":{"result":"ok"}}`; artwork count 0 |
| S4 Save Draft | **PASS** | Same Release ID; version 1 → 2 |
| S5 Resume | **PASS** | Uploader shown; no preview; artwork count 0 |
| S6 Complete | **PASS** | lifecycle `active`; same Release ID; version 5 |

---

## API (destroy)

| Field | Value |
|-------|--------|
| Endpoint | `POST /api/media/destroy` (was `/api/artwork/destroy` before BUILD-014D) |
| HTTP Status | **200** |
| Response Body | `{"success":true,"result":{"result":"ok"}}` |
| Signature probe (nonexistent id) | **200** `{"success":true,"result":{"result":"not found"}}` |

---

## Firestore

### Release (final)

| Field | Value |
|-------|--------|
| Release ID | `agykyzJniJlbku5iNq7O` |
| title | `Artwork Verification 2026-07-21 16:59:15` |
| lifecycle | **active** |
| version | **5** |
| updatedAt | `2026-07-21T17:18:28.497Z` |
| Docs for test title | **1** |

### Artwork

| Checkpoint | Count | Notes |
|------------|-------|--------|
| After upload | 1 | id `PWFPJE3LWQ2iumZO7pFd`, releaseId matches |
| After replace | 1 | same artwork id, updated publicId |
| After remove | **0** | FS record deleted |
| After complete | **0** | |

**Release remains** through remove and complete. **Release ID never changed.**

---

## Cloudinary

| Event | Result |
|-------|--------|
| Upload | Asset created under folder `releaseflow/kSJZqhqlWtMRdHkkw0kJ/releases/` |
| Replace | New publicId on same artwork doc |
| Destroy | API `result: **ok**` for `…/bosco9uey48kp5hhm4jk` |

---

## Release Identity Table

| Action | Release ID | Same ID |
|--------|------------|---------|
| Draft created | `agykyzJniJlbku5iNq7O` | ✅ |
| Upload | `agykyzJniJlbku5iNq7O` | ✅ |
| Replace | `agykyzJniJlbku5iNq7O` | ✅ |
| Remove | `agykyzJniJlbku5iNq7O` | ✅ |
| Save Draft | `agykyzJniJlbku5iNq7O` | ✅ |
| Resume | `agykyzJniJlbku5iNq7O` | ✅ |
| Complete | `agykyzJniJlbku5iNq7O` | ✅ |

---

## Live run log

| Step | Release ID | Artwork releaseId | Release count | Artwork count | Notes |
|------|------------|-------------------|---------------|---------------|-------|
| Upload | agykyzJniJlbku5iNq7O | agykyzJniJlbku5iNq7O | 1 | 1 | 2026-07-21T17:00:27Z |
| Replace | agykyzJniJlbku5iNq7O | agykyzJniJlbku5iNq7O | 1 | 1 | same artwork id |
| Remove | agykyzJniJlbku5iNq7O | — | 1 | 0 | destroy 200 ok |
| Save Draft | agykyzJniJlbku5iNq7O | — | 1 | 0 | version 2 |
| Resume | agykyzJniJlbku5iNq7O | — | 1 | 0 | uploader, no preview |
| Complete | agykyzJniJlbku5iNq7O | — | 1 | 0 | lifecycle active, version 5 |

---

## Commits (intended)

1. `fix(artwork): correct Cloudinary destroy signature` — BUG-010 only  
2. `feat(release): support artwork upload during release wizard` — BUILD-010 wizard feature  

---

## Acceptance criteria map

| Criterion | Status |
|-----------|--------|
| Remove returns HTTP 200 | ✅ |
| Cloudinary accepts destroy signature | ✅ |
| Asset deleted (destroy result ok) | ✅ |
| Artwork record removed | ✅ |
| Release unchanged / same ID | ✅ |
| Resume after remove correct | ✅ |
| Complete succeeds | ✅ |
| No unrelated code in BUG-010 | ✅ destroy route only |
