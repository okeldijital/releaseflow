# TASK-1602 — Requirements Workspace

## Concept

Every release template defines what is required before the release can
ship. The Requirements Workspace groups these requirements by category
(Audio, Artwork, Metadata, Distribution) and shows, at a glance, what
is met, what is pending, and what is missing.

Where the Deliverable Workspace (TASK-1401) tracks *what people have
produced*, the Requirements Workspace tracks *what the template demands*.
A requirement is satisfied when a matching deliverable exists in the
approved state.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back    Requirements · Midnight Sessions · Single                     │
│                                                                           │
│  ─── Audio ─────────────────────────────────────── 3 of 4 met ──────────  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  ✓ Raw audio stems (per track)                         👤 Producer   ││
│  │    WAV, 24/48 · 1 per track · All 4 tracks delivered                 ││
│  │    Satisfied by: stems-v2 (all 4 tracks) · Approved Jul 20           ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │  ✓ Stereo mix files (per track)                       👤 Sam, Mix    ││
│  │    WAV, 24/48 · 1 per track · All 4 tracks delivered                 ││
│  │    Satisfied by: mix-v1 (T1-T4) · Submitted Jul 28                   ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │  ✓ Master files (per track)                           👤 Sam, Mast.  ││
│  │    WAV, 16/44.1 · 1 per track · All 4 tracks delivered               ││
│  │    Satisfied by: master-v2 (T1-T4) · Approved Aug 02                 ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │  ○ Instrumental versions (optional)                    👤 Producer   ││
│  │    WAV, 16/44.1 · Per track · Not required                          ││
│  │    — Skipped                                                          ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ─── Artwork ────────────────────────────────────── 1 of 1 met ─────────  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  ✓ Cover art                                          👤 Taylor, Des. ││
│  │    JPG/PNG, 3000×3000px, front cover · Required                     ││
│  │    Satisfied by: cover-art-v3 · Approved Aug 10                      ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ─── Metadata ──────────────────────────────────── 2 of 4 met ──────────  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  ✓ Release metadata                                   👤 Alex, PM    ││
│  │    Title, type, date, genre, label, copyright · Required             ││
│  │    Title: "Midnight Sessions" · Genre: Alt R&B · Date: Oct 01       ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │  ✓ Contributors                                       👤 Alex, PM    ││
│  │    Artist + Producer minimum · Required                               ││
│  │    Artist X (Artist) ✓ · Producer Z (Producer) ✓ · Writer ✓        ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │  ✕ Track metadata (per track)                         👤 Alex, PM    ││
│  │    Title, duration, ISRC, language per track · Required              ││
│  │    Track 4 "Fading Echo" missing: ISRC, language                    ││
│  │    ┌────────────┐                                                     ││
│  │    │  Fix Now   │                                                     ││
│  │    └────────────┘                                                     ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │  ○ Writer credits (optional)                           👤 Artist     ││
│  │    Composer/songwriter per track · Recommended                       ││
│  │    — Not yet entered                                                   ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ─── Distribution ──────────────────────────────── 0 of 3 met ──────────  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  ✕ UPC code                                           👤 Alex, PM    ││
│  │    GS1 GTIN-12 (12 digits) · Required                                ││
│  │    — Not assigned                                                      ││
│  │    ┌────────────┐                                                     ││
│  │    │  Assign    │                                                     ││
│  │    └────────────┘                                                     ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │  ✕ ISRC codes (per track)                             👤 Alex, PM    ││
│  │    12-char uppercase alphanumeric per track · Required               ││
│  │    Track 1: missing · Track 2: missing · T3: missing · T4: missing  ││
│  │    ┌────────────┐                                                     ││
│  │    │  Generate  │                                                     ││
│  │    └────────────┘                                                     ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │  ✕ Metadata sheet                                     👤 Alex, PM    ││
│  │    Genre, credits, copyright for DSP submission · Required           ││
│  │    — Not submitted                                                     ││
│  │    ┌────────────┐                                                     ││
│  │    │  Prepare   │                                                     ││
│  │    └────────────┘                                                     ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ─── Summary ──────────────────────────────────────────────────────────  │
│  Met: 6    Pending: 3    Optional: 2    Total Required: 9    Gap: 33%   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Requirement States

| State | Icon | Meaning |
|-------|------|---------|
| Met | ✓ | Requirement is satisfied — approved deliverable exists or metadata is complete |
| Pending | ✕ | Requirement is required but not yet met |
| At Risk | ⚠ | Met but the deliverable is not yet approved (submitted, awaiting review) |
| Optional | ○ | Template does not require this. Skips can be commanded. |

---

## Requirement → Deliverable Mapping

Each requirement in the workspace is linked to the deliverable(s) that
satisfy it:

```
Requirement:  "Stereo mix files (WAV 24/48, per track)"
Satisfied by: Deliverable: "Stereo Mix" — 4 tracks uploaded, v1
              Status: Submitted (awaiting review)
              Owner: Sam Wilson, Mix Engineer
```

If a requirement has no linked deliverable, it shows as ✕ Pending with a
"Fix Now" / "Assign" / "Generate" action button.

---

## Category Definitions

### Audio Requirements

| Requirement | Template | Check |
|-------------|----------|-------|
| Raw stems (per track) | All | 1 file per track, WAV/AIFF 24/48, delivered + approved |
| Stereo mix (per track) | All | 1 file per track, WAV/AIFF 24/48, delivered + approved |
| Master file (per track) | All | 1 file per track, WAV/FLAC 16/44.1, delivered + approved |
| Instrumental versions (optional) | Single, EP, Album | Per track if desired |

### Artwork Requirements

| Requirement | Template | Check |
|-------------|----------|-------|
| Cover art | All | JPG/PNG, 3000×3000px, delivered + approved |
| Booklet (optional) | Album | PDF/JPG/PNG, multi-page |
| Alternate cover (optional) | All | JPG/PNG, 3000×3000px |

### Metadata Requirements

| Requirement | Template | Check |
|-------------|----------|-------|
| Release metadata | All | Title, type, release date, genre, label, copyright all set |
| Contributors (required roles) | All | Artist + Producer assigned minimum; Writer for Album |
| Track metadata (per track) | All | Title, duration, ISRC, language per track |
| Writer credits (optional) | All | Composer/songwriter per track |

### Distribution Requirements

| Requirement | Template | Check |
|-------------|----------|-------|
| UPC code | All | GS1 GTIN-12 assigned, validated check digit |
| ISRC codes (per track) | All | 12-char uppercase per track |
| Metadata sheet | All | Genre, credits, copyright prepared for DSP |
| DSP assets (optional) | All | Spotify Canvas, Apple Motion, etc. |

---

## Actions

Each pending requirement gets a contextual action:

| Requirement Type | Available Actions |
|-----------------|-------------------|
| Missing deliverable (no file) | "Assign Owner" — picks from org, creates linked deliverable |
| Missing metadata (field empty) | "Fix Now" — opens inline editor for the field |
| Missing ISRC | "Generate" — auto-generates ISRC codes for tracks without them |
| Missing UPC | "Assign" — opens UPC code input form |
| Missing contributor | "Add Contributor" — opens contributor assignment modal |
| Optional, skipped | "Enable" — marks optional requirement as required for this release |

---

## Mobile View

```
┌──────────────────────────────┐
│  Requirements                │
│                               │
│  🎵 Audio — 3/4 met          │
│  ████████████████░░░░ 75%    │
│                               │
│  ✓ Raw stems     👤 Producer │
│  ✓ Stereo mix    👤 Sam      │
│  ✓ Master file   👤 Sam      │
│  ○ Instrumental               │
│                               │
│  🎨 Artwork — 1/1 met        │
│  ████████████████████ 100%   │
│                               │
│  ✓ Cover art     👤 Taylor   │
│                               │
│  📋 Metadata — 2/4 met       │
│  ████████████░░░░░░░░ 50%    │
│                               │
│  ✓ Release info  👤 Alex     │
│  ✓ Contributors  👤 Alex     │
│  ✕ Track data    👤 Alex     │
│    [Fix Now]                  │
│  ○ Writer credits             │
│                               │
│  📡 Distribution — 0/3 met   │
│  ░░░░░░░░░░░░░░░░░░░░ 0%     │
│                               │
│  ✕ UPC code                 │
│    [Assign]                   │
│  ✕ ISRC codes               │
│    [Generate]                 │
│  ✕ Metadata sheet           │
│    [Prepare]                  │
└──────────────────────────────┘
```

---

## Data Model

```typescript
interface Requirement {
  id: string;
  releaseId: string;
  category: RequirementCategory;
  template: ReleaseTemplate;        // Single, EP, Album, Remix
  label: string;                    // "Raw audio stems (per track)"
  description: string;              // "WAV/AIFF 24/48, 1 file per track"
  required: boolean;                // false = optional
  status: RequirementStatus;
  satisfiedBy?: {
    deliverableId?: string;         // FK to Deliverable (TASK-1401)
    versionId?: string;             // FK to specific version that satisfies
    dataFields?: Record<string, string>;  // For metadata requirements
  };
  owner?: { id: string; name: string };
}

type RequirementCategory = 'audio' | 'artwork' | 'metadata' | 'distribution';
type RequirementStatus = 'met' | 'pending' | 'at_risk' | 'optional';
```
