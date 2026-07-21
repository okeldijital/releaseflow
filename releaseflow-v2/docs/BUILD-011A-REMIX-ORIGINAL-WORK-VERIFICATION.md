# BUILD-011A — Remix Original Work Metadata Verification

**Date:** 2026-07-21  
**Result:** **PASS** (all scenarios)  
**Environment:** `localhost:3000` → Firebase `releaseflow-prod`  
**Organization:** `kSJZqhqlWtMRdHkkw0kJ`  
**Operator account:** `bug009b.v5.8b35ba@example.com`  
**Release used for new tracks:** `agykyzJniJlbku5iNq7O`  

**No product code changes during this verification.**

---

## Browser verification

| Scenario | Result |
|----------|--------|
| Create Remix (section appears + order) | **PASS** |
| Validation | **PASS** |
| Save Remix | **PASS** |
| Edit Remix | **PASS** |
| Details page | **PASS** |
| Non-remix | **PASS** |
| Type change Remix → Original | **PASS** |
| Regression | **PASS** |

---

## Firestore evidence

### Remix track (after create + edit of Original Work)

| Field | Value |
|-------|--------|
| Track ID | `2TSUpc6fvz38ohOg4PbW` |
| Recording Type (at create) | `remix` |
| Title (display) | `Fleetwood Mac – BUILD011 Remix 2026-07-21 18:02:43 (DJ X BUILD011 Remix)` |
| originalWork (after edit) | see below |

```json
{
  "title": "Dreams (Edited)",
  "primaryArtistId": "Xvlr7oTp8It3tPCypKZY",
  "featuredArtistIds": []
}
```

- Nested object on the **track document**  
- No original-work subcollections  
- No duplicate track documents for the create  

### After type change Remix → Original (same track)

| Field | Value |
|-------|--------|
| Track ID | `2TSUpc6fvz38ohOg4PbW` |
| Recording Type | `original` |
| originalWork | **`null`** |

### Non-remix track

| Field | Value |
|-------|--------|
| Track ID | `G58uIBJkQjgUL9WPGVYC` |
| Recording Type | `original` |
| originalWork | **`null`** |

---

## Scenario notes

### S1 — Create Remix / order
Text positions (case-insensitive): Recording Type (374) → Original Work (416) → Original Song Title (483) → Original Primary Artist (504) → existing ORIGINAL ARTISTS metadata (645).

### S2 — Validation
Blank Original Song Title + Original Primary Artist → both required errors; Featured not required; stayed on basics step.

### S3–S4 — Save + Firestore
Create Track succeeded; nested `originalWork` with title `Dreams`, primaryArtistId Fleetwood Mac.

### S5–S6 — Edit + Details
Title updated to `Dreams (Edited)` and shown under Original Work on details.

### S7–S8 — Non-remix + type change
Original type never shows Original Work UI; save stores `originalWork: null`. Switching remix → original hides section and clears nested field on save.

### S9 — Regression
Original track details have no Original Work form fields; edit form still exposes artist/type controls.

---

## Acceptance criteria

| Criterion | Status |
|-----------|--------|
| Original Work only for Remix | ✅ |
| Section order matches spec | ✅ |
| Validation only for Remix required fields | ✅ |
| Nested `originalWork` in Firestore | ✅ |
| Edit persists | ✅ |
| Details displays Original Work | ✅ |
| Type change clears originalWork on save | ✅ |
| Non-remix unchanged | ✅ |
| No unrelated defects observed | ✅ |

---

## Recommended commit (not applied in this step)

```
feat(track): support original work metadata for remix tracks
```

Screenshots: `/tmp/build-011a/shots/`  
Machine evidence: `/tmp/build-011a/evidence.json` (written by verifier when run from `/tmp/build-010b` as `evidence.json` in that folder if copied — primary log above).
