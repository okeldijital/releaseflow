# Asset Domain Recovery Report — ST-004.2

**Sprint:** ST-004 Phase 2
**Date:** 2026-06-28
**Status:** Complete

---

## Architecture Achieved

```
/assets, release Assets tab, artist Assets tab  (0 Firestore imports)
      │
      ▼
useAsset() / useAssetsByRelease() / useReleaseAssets()  ← hooks/useAsset.ts
      │
      ▼
asset-service.ts  ← validation, business rules, completeness checking
      │
      ▼
asset-repository.ts  ← all Firestore persistence + file type validation
      │
      ▼
Firestore
```

---

## Files Changed

| File | Change | Firestore |
|------|--------|-----------|
| `lib/asset-repository.ts` | **NEW** — 10 functions, CRUD + validation rules | Yes (allowed) |
| `lib/asset-service.ts` | **REWRITTEN** — delegates to repo, adds business logic | 0 |
| `hooks/useAsset.ts` | **NEW** — useAsset, useAssetsByRelease, useReleaseAssets, useAssetValidation | 0 |
| `app/(app)/assets/page.tsx` | **REFACTORED** — org-aware empty state | 0 |

---

## AssetRepository API

| Function | Description |
|----------|-------------|
| `addAsset(fields)` | Create asset reference with timestamps |
| `updateAsset(id, fields)` | Partial update |
| `deleteAsset(id)` | Hard delete |
| `getAsset(id)` | Fetch by ID |
| `getAssetsByDeliverable(id)` | Assets scoped to a deliverable |
| `getAssetsByRelease(id)` | Assets scoped to a release |
| `validateAssetRef(filename, size)` | File extension + size validation |
| `getAssetCountByRelease(id)` | Count assets for a release |
| `checkAssetCompleteness(id)` | Artwork/audio presence check |

---

## AssetService API

| Function | Description |
|----------|-------------|
| `createAsset(fields)` | Validates filename, URL, type; delegates to repo |
| `editAsset(id, fields)` | Delegates to repo |
| `removeAsset(id)` | Delegates to repo |
| `fetchAsset(id)` | Proxy to repo |
| `fetchAssetsByDeliverable(id)` | Proxy to repo |
| `fetchAssetsByRelease(id)` | Proxy to repo |
| `validateAsset(filename, size)` | File validation |
| `fetchAssetCompleteness(id)` | Artwork + audio completeness |
| `getReleaseAssetsSummary(id)` | Completeness + readiness blockers |

---

## Validation Rules

| Type | Extensions | Max Size |
|------|-----------|----------|
| Artwork | jpg, jpeg, png, tiff | 50 MB |
| Audio | wav, flac, mp3, aiff, aif | 500 MB |
| Video | mp4, mov, avi | 2 GB |
| Document | pdf, doc, docx, txt | 25 MB |
| Image | jpg, jpeg, png, tiff, gif, webp | 50 MB |

---

## Readiness Integration

```typescript
const { completeness, readinessBlockers } = await getReleaseAssetsSummary(releaseId);
// completeness: { hasArtwork: boolean, hasAudio: boolean, total: number, missing: string[] }
// readinessBlockers: ["Artwork asset required for distribution", ...]
```

---

## Verification

| Check | Result |
|-------|--------|
| TypeScript | ✅ 6/6 packages |
| Build | ✅ Compiled |
| Tests | ✅ 327 passed (20/20 files) |
| `/assets` page Firestore | ✅ 0 |
| Asset hook Firestore | ✅ 0 |
| Asset service Firestore | ✅ 0 |

---

## Five Domains Recovered

| # | Domain | Repository | Service | Hook |
|---|--------|-----------|---------|------|
| 1 | Organization | `organization-repository.ts` | — | — |
| 2 | Release | `release-repository.ts` | `release-service.ts` | `useRelease` |
| 3 | Workflow | `workflow-repository.ts` | `workflow-service.ts` | `useWorkflow` |
| 4 | Artist | `artist-repository.ts` | `artist-service.ts` | `useArtist` |
| 5 | Asset | `asset-repository.ts` | `asset-service.ts` | `useAsset` |

All follow: **Page → Hook → Service → Repository → Firestore**
