# TASK-2002 — DSP Readiness Report

## Concept

An automated validation report that checks a release against DSP
submission requirements. Runs on demand (when the PM opens the
Distribution Workspace) and surfaces every issue that would cause a
DSP to reject the submission.

Four categories of issues:
1. **Missing ISRC** — Tracks without ISRC codes
2. **Missing UPC** — Release without UPC/EAN code
3. **Artwork Validation Failure** — Cover art doesn't meet specs
4. **Metadata Conflict** — Contradictory or invalid metadata

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  DSP Readiness Report · Midnight Sessions                                 │
│                                                                           │
│  Run: Aug 15, 2026 · 3:42 PM                    [Re-run validation]      │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │   Result: 🔴  NOT READY  ·  4 issues  ·  1 warning                   │ │
│  │                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Critical Issues (4) ──────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  ✕ Missing ISRC — Track 4 "Fading Echo"                            │ │
│  │     No ISRC assigned. All tracks must have an ISRC before           │ │
│  │     submission.                                                     │ │
│  │     Impact: Spotify, Apple Music, Amazon reject.                     │ │
│  │     ┌──────────┐ ┌──────────┐                                       │ │
│  │     │ Generate │ │  Assign  │                                       │ │
│  │     └──────────┘ └──────────┘                                       │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  ✕ Missing UPC                                                     │ │
│  │     No UPC code assigned to this release. A GS1 GTIN-12 (UPC) or   │ │
│  │     EAN-13 is required for physical and digital distribution.       │ │
│  │     Impact: All DSPs reject without UPC.                            │ │
│  │     ┌──────────┐                                                    │ │
│  │     │  Assign  │                                                    │ │
│  │     └──────────┘                                                    │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  ✕ Artwork resolution failure                                      │ │
│  │     Cover art is 2500×2500px. DSPs require minimum 3000×3000px.    │ │
│  │     Impact: Spotify, Apple Music, Tidal reject.                     │ │
│  │     Current: cover-art-v3.jpg (2500×2500, JPG, 3.8 MB)             │ │
│  │     ┌──────────┐                                                    │ │
│  │     │  Fix Now  │                                                    │ │
│  │     └──────────┘                                                    │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  ✕ Metadata conflict: Copyright © missing                          │ │
│  │     Release has Copyright ℗ ("℗ 2026 Acme Records") but           │ │
│  │     Copyright © is empty. Both are required for DSP submission.    │ │
│  │     Impact: All DSPs reject incomplete copyright.                   │ │
│  │     ┌──────────┐                                                    │ │
│  │     │  Fix Now  │                                                    │ │
│  │     └──────────┘                                                    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Warnings (1) ─────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  ⚠ Metadata conflict: Explicit flag mismatch                        │ │
│  │     Track 3 "City Lights" has explicit: No. But the lyrics         │ │
│  │     contain flagged content. Review the explicit flag for this     │ │
│  │     track before submitting.                                        │ │
│  │     Impact: May cause takedown if listener reports.                  │ │
│  │     ┌──────────┐                                                    │ │
│  │     │  Review  │                                                    │ │
│  │     └──────────┘                                                    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Passed Checks ─────────────────────────────────────────────────────  │
│                                                                           │
│  ✓ ISRC: Tracks 1–3 have valid ISRC codes                                │
│  ✓ Artwork: JPG format, sRGB, ≤20MB                                      │
│  ✓ Duration: All 4 tracks have valid durations                            │
│  ✓ Title: All 4 tracks have titles                                       │
│  ✓ Language: All 4 tracks have language set                               │
│  ✓ Release date: Oct 01, 2026 (future, valid)                            │
│  ✓ Label: "Acme Records" matches org name                                 │
│  ✓ Genre: "Alternative R&B" is in Spotify taxonomy                        │
│                                                                           │
│  ─── Per-DSP Summary ───────────────────────────────────────────────────  │
│                                                                           │
│  ┌────────────────┬──────────┬──────────┬──────────┐                    │
│  │ DSP            │ Issues   │ Warnings │ Ready    │                    │
│  ├────────────────┼──────────┼──────────┼──────────┤                    │
│  │ Spotify        │ 4        │ 1        │ ✕ No     │                    │
│  │ Apple Music    │ 4        │ 1        │ ✕ No     │                    │
│  │ Amazon Music   │ 4        │ 1        │ ✕ No     │                    │
│  │ Tidal          │ 4        │ 1        │ ✕ No     │                    │
│  │ Deezer         │ 4        │ 1        │ ✕ No     │                    │
│  │ YouTube Music  │ 4        │ 1        │ ✕ No     │                    │
│  └────────────────┴──────────┴──────────┴──────────┘                    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Check Categories

### 1. Missing ISRC

| Check | Severity | Description |
|-------|----------|-------------|
| ISRC assigned | Critical | Every track must have a 12-char ISRC |
| ISRC format valid | Critical | Must match `[A-Z]{2}[A-Z0-9]{3}\d{2}\d{5}` |
| ISRC unique | Critical | No duplicates across the release |
| ISRC not reassigned | Warning | Check against assigned ISRCs for other releases |

### 2. Missing UPC

| Check | Severity | Description |
|-------|----------|-------------|
| UPC assigned | Critical | Release must have a UPC or EAN-13 |
| UPC format valid | Critical | Must be 12 digits (UPC-A) or 13 digits (EAN-13) |
| UPC check digit valid | Critical | Last digit must match GS1 check digit algorithm |
| UPC unique | Warning | Check against assigned UPCs for other releases |

### 3. Artwork Validation

| Check | Severity | Description |
|-------|----------|-------------|
| Resolution minimum | Critical | Must be ≥3000×3000px |
| Square aspect ratio | Critical | Width must equal height |
| Format allowed | Critical | Must be JPG or PNG |
| Color space | Critical | Must be RGB/sRGB |
| File size limit | Critical | Must be ≤20MB (most DSPs) |
| No embedded text URLs | Warning | Auto-scan for URLs/social handles |
| Text safe zone | Warning | Manual check recommendation |

### 4. Metadata Conflicts

| Check | Severity | Description |
|-------|----------|-------------|
| Copyright ℗ present | Critical | Required by all DSPs |
| Copyright © present | Critical | Required by all DSPs |
| Genre in taxonomy | Critical | Must match DSP genre taxonomy |
| Explicit flag set | Critical | Must be set on every track |
| Language set | Critical | Must be ISO 639-1 on every track |
| Duration valid | Critical | Must be within DSP limits (min 30s) |
| Title present | Critical | Release and all track titles |
| Artist name matches | Warning | Release artist should match credit |
| Explicit flag vs lyrics | Warning | Content analysis mismatch |
| Track count vs template | Warning | Single should have 1 track, etc. |

---

## Report Behavior

### When It Runs

| Trigger | Behavior |
|---------|----------|
| Open Distribution Workspace | Runs automatically on first load |
| "Re-run validation" button | Runs on demand, shows spinner |
| Field edited in Metadata/Tracks | Incremental re-check of affected field only |
| New version of artwork uploaded | Re-checks artwork category |
| Nightly cron | Runs on all releases in READY/PLANNING status |

### Result Summary

| Result | Criteria |
|--------|----------|
| 🟢 READY | 0 critical issues, 0 warnings |
| 🟡 READY WITH WARNINGS | 0 critical issues, 1+ warnings |
| 🔴 NOT READY | 1+ critical issues |

---

## Per-DSP Variations

Some DSPs have unique requirements beyond the baseline:

| DSP | Unique Check |
|-----|-------------|
| Spotify | Canvas video: 9:16 aspect, 3-8 seconds, MP4 ≤100MB |
| Apple Music | Apple Motion: specific codec, ≤30 seconds. Apple ID artist page must exist. |
| Amazon Music | HD audio requires 24-bit FLAC |
| Tidal | Master Quality requires MQA or 24-bit FLAC |
| Deezer | 360 Reality Audio format if applicable |
| YouTube Music | Music video must be uploaded to a YouTube channel |

These checks only run when the DSP is selected in Packaging.

---

## Data Model

```typescript
interface DSPReadinessReport {
  id: string;
  releaseId: string;
  runAt: Timestamp;
  result: 'ready' | 'ready_with_warnings' | 'not_ready';
  issues: DSPIssue[];
  dspResults: PerDSPResult[];
}

interface DSPIssue {
  id: string;
  category: 'missing_isrc' | 'missing_upc' | 'artwork_failure' | 'metadata_conflict';
  check: string;               // "ISRC assigned", "Resolution minimum", etc.
  severity: 'critical' | 'warning';
  title: string;               // "Missing ISRC — Track 4 'Fading Echo'"
  description: string;         // Full explanation
  impact: string;              // "Spotify, Apple Music, Amazon reject."
  currentValue?: string;       // "2500×2500px" — what the current value is
  expectedValue?: string;      // "≥3000×3000px" — what it should be
  affectedDspIds: string[];    // Which DSPs care about this issue
  fixAction: 'generate' | 'assign' | 'fix_now' | 'review' | 'upload';
  fixUrl: string;              // Deep link to where the fix can be made
}

interface PerDSPResult {
  dspId: string;               // "spotify", "apple_music", etc.
  dspName: string;             // "Spotify"
  criticalCount: number;
  warningCount: number;
  ready: boolean;
}
```
