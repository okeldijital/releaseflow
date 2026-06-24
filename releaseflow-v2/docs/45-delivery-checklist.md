# TASK-2003 — Delivery Checklist

## Concept

The final human checklist before submitting a release to DSPs. Unlike the
automated DSP Readiness Report (TASK-2002) which validates technical
requirements, the Delivery Checklist ensures operational readiness — the
PM walks through each item, confirms it visually or manually, and checks
it off.

Each item is a binary state: ✓ complete or ✗ pending. Items are grouped
by category and ordered by dependency.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Delivery Checklist · Midnight Sessions                    Submit to DSPs │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Progress: ████████████████████████░░░░░░░░░░  8/12 check · 67%    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Audio ────────────────────────────────────────────────────────────  │
│                                                                           │
│  ☑ ✓ Master WAV — all 4 tracks delivered and approved                   │
│       T1-T4 passed review. Sam Wilson approved Aug 12.                    │
│                                                                           │
│  ☑ ✓ Mix WAV — all 4 tracks delivered                                    │
│       T1-T4 mix files uploaded. Sam Wilson submitted Aug 10.              │
│                                                                           │
│  ─── Artwork ──────────────────────────────────────────────────────────  │
│                                                                           │
│  ☑ ✓ Cover Artwork — v3 approved, 3000×3000 JPG                          │
│       Taylor submitted v3 Aug 14. Sam A&R approved Aug 15.               │
│                                                                           │
│  ─── Identifiers ───────────────────────────────────────────────────────  │
│                                                                           │
│  ☑ ✓ ISRC — Tracks 1–3 have valid ISRC codes                             │
│       T1: USABC2500001 · T2: USABC2500002 · T3: USABC2500003             │
│                                                                           │
│  ☐ ✗ ISRC — Track 4 is missing                                         │
│       "Fading Echo" has no ISRC. Must be assigned before submit.         │
│       Assignee: Alex (PM)                                                │
│       ┌──────────┐                                                       │
│       │  Assign  │                                                       │
│       └──────────┘                                                       │
│                                                                           │
│  ☐ ✗ UPC — no UPC code assigned                                        │
│       GS1 GTIN-12 required for all DSPs.                                │
│       Assignee: Alex (PM)                                                │
│       ┌──────────┐                                                       │
│       │  Assign  │                                                       │
│       └──────────┘                                                       │
│                                                                           │
│  ─── Metadata ──────────────────────────────────────────────────────────  │
│                                                                           │
│  ☑ ✓ Title & Artist — "Midnight Sessions" by "Artist X"                  │
│       Both fields complete and match contributor credits.                │
│                                                                           │
│  ☑ ✓ Genre — "Alternative R&B" set                                       │
│       Confirmed in DSP taxonomy.                                          │
│                                                                           │
│  ☑ ✓ Release Date — Oct 01, 2026                                         │
│       Street date set and confirmed with Marketing.                      │
│                                                                           │
│  ☑ ✓ Label — "Acme Records" matches organization                         │
│       Pre-filled from org settings.                                       │
│                                                                           │
│  ☐ ✗ Copyright ℗ — "℗ 2026 Acme Records" not yet set                  │
│       Required by all DSPs.                                               │
│       Assignee: Alex (PM)                                                │
│       ┌──────────┐                                                       │
│       │   Fix    │                                                       │
│       └──────────┘                                                       │
│                                                                           │
│  ☐ ✗ Copyright © — "© 2026 Artist X" not yet set                       │
│       Required by all DSPs.                                               │
│       Assignee: Alex (PM)                                                │
│       ┌──────────┐                                                       │
│       │   Fix    │                                                       │
│       └──────────┘                                                       │
│                                                                           │
│  ─── Review ────────────────────────────────────────────────────────────  │
│                                                                           │
│  ☐ ✗ Final listen — A&R confirms all masters                             │
│       Sam (A&R) must do final listen of all 4 mastered tracks.           │
│       Assignee: Sam (A&R)                                                │
│       ┌──────────┐                                                       │
│       │  Review  │                                                       │
│       └──────────┘                                                       │
│                                                                           │
│  ─── Summary ───────────────────────────────────────────────────────────  │
│                                                                           │
│  8 of 12 checks passed · 4 remaining                                     │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ⚠  Cannot submit yet — 4 items remain unchecked.                │    │
│  │                                                                   │    │
│  │  ┌──────────────────────────────────────────────────────────┐    │    │
│  │  │  Submit to DSPs  (disabled until all items complete)      │    │    │
│  │  └──────────────────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Full Checklist Items

### Audio

| # | Item | Category | Dependency |
|---|------|----------|------------|
| 1 | Master WAV — all tracks delivered and approved | Audio | Mastering stage complete |
| 2 | Mix WAV — all tracks delivered | Audio | Mixing stage complete |
| 3 | Stems — all raw stems delivered | Audio | Production stage complete |

### Artwork

| # | Item | Category | Dependency |
|---|------|----------|------------|
| 4 | Cover Artwork — approved, 3000×3000, JPG/PNG | Artwork | Artwork stage complete |
| 5 | Booklet — approved, PDF (Album only) | Artwork | Artwork stage complete (if applicable) |

### Identifiers

| # | Item | Category | Dependency |
|---|------|----------|------------|
| 6 | ISRC — all tracks have valid ISRC codes | Identifiers | ISRC assigned per track |
| 7 | UPC — GS1 GTIN-12 assigned and valid | Identifiers | UPC assigned to release |
| 8 | Catalog Number — assigned (optional) | Identifiers | Label assigns |

### Metadata

| # | Item | Category | Dependency |
|---|------|----------|------------|
| 9 | Title & Artist — confirmed and matching credits | Metadata | Release + track metadata complete |
| 10 | Genre — confirmed in DSP taxonomy | Metadata | Genre field set |
| 11 | Release Date — street date confirmed | Metadata | Date set + Marketing aligned |
| 12 | Label — matches organization name | Metadata | Org name → release mapping |
| 13 | Copyright ℗ — "℗ YYYY Label Name" | Metadata | Copyright ℗ field set |
| 14 | Copyright © — "© YYYY Artist Name" | Metadata | Copyright © field set |
| 15 | Explicit Flag — set correctly on all tracks | Metadata | Per-track explicit flag |
| 16 | Language — set on all tracks | Metadata | Per-track language set |
| 17 | Track Duration — within DSP limits | Metadata | All durations ≥30 seconds |

### Review

| # | Item | Category | Dependency |
|---|------|----------|------------|
| 18 | Final listen — A&R confirms all masters | Review | Mastering complete + approved |
| 19 | Artwork review — Designer confirms final version | Review | Artwork approved |
| 20 | Metadata review — PM confirms all fields | Review | Metadata section complete |

### Optional (Not Blocking)

| # | Item | Category | Dependency |
|---|------|----------|------------|
| 21 | Spotify Canvas — uploaded (optional) | Optional | DSP Assets |
| 22 | Apple Motion — uploaded (optional) | Optional | DSP Assets |
| 23 | Press Release — finalized (optional) | Optional | Marketing |
| 24 | Social Media Kit — ready (optional) | Optional | Marketing |

---

## Behaviors

### Check-off

Clicking an unchecked item:
1. Checkbox fills with ✓ animation.
2. Item background fades to a completed state (muted green tint).
3. Progress bar updates: "9/12 checks · 75%".
4. If this was the last item, the submit button enables with a subtle
   glow pulse.

### Uncheck

Clicking a checked item toggles it back to unchecked. This is useful
if something changes (e.g., a new version of artwork is uploaded after
the checklist was marked complete).

### Tooltip on Hover

Hovering an item shows:
- Who last checked/unchecked it and when
- Dependency status (e.g., "Cover Art v3: approved Aug 15 by Sam A&R")
- Any notes from the last reviewer

### Submit Button

```
  ┌──────────────────────────────────────────────────────────┐
  │  Submit to DSPs  (disabled)                              │
  │  ───────────────────────────────────────────────────── │
  │  4 items remaining before submission is allowed.        │
  └──────────────────────────────────────────────────────────┘
```

When all items are checked:
```
  ┌──────────────────────────────────────────────────────────┐
  │  🚀 Submit to Spotify, Apple Music, Amazon Music, Tidal  │
  └──────────────────────────────────────────────────────────┘
```

---

## Template Per Release Type

The checklist adapts to the release type:

| Item | Single | EP | Album | Remix |
|------|--------|----|-------|-------|
| Cover Artwork | ✓ | ✓ | ✓ | ✓ |
| Booklet | — | — | ✓ | — |
| Stems | ✓ | ✓ | ✓ | ✓ (per track) |
| Master WAV | ✓ (1 trk) | ✓ (3-6 trk) | ✓ (7+ trk) | ✓ (1 trk) |
| ISRC | ✓ (1) | ✓ (3-6) | ✓ (7+) | ✓ (1) |

---

## Data Model

```typescript
interface DeliveryChecklist {
  id: string;
  releaseId: string;
  items: ChecklistItem[];
  progress: number;             // Completed ÷ total required
  isComplete: boolean;
  lastUpdatedAt: Timestamp;
}

interface ChecklistItem {
  id: string;
  category: 'audio' | 'artwork' | 'identifiers' | 'metadata' | 'review' | 'optional';
  label: string;                // "Master WAV — all 4 tracks delivered and approved"
  description: string;          // "T1-T4 passed review. Sam Wilson approved Aug 12."
  status: 'complete' | 'pending';
  required: boolean;            // false for optional items
  requiresDspSubmission: boolean; // If true, blocks submit
  assignee?: { id: string; name: string };
  dependency: {
    type: 'deliverable' | 'field' | 'approval';
    resourceId: string;        // FK to deliverable, metadata field, or approval
    status: string;            // Current status of the dependency
  };
  checkedBy?: { id: string; name: string };
  checkedAt?: Timestamp;
  uncheckedBy?: { id: string; name: string };
  uncheckedAt?: Timestamp;
  notes?: string;
  order: number;               // Sort order within category
}
```
