# TASK-2001 — Distribution Workspace

## Concept

The Distribution Workspace is where a release is prepared for DSP
submission. Unlike the Deliverable Workspace (TASK-1401) which tracks
creative output, this workspace is about technical readiness — ensuring
every field, file, and format that DSPs require is present and correct.

Five sections: Metadata, Tracks, Artwork, Compliance, Packaging.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back    Distribution · Midnight Sessions                               │
│                                                                           │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ ● Metadata  │ │ ○ Tracks │ │○ Artwork │ │○Compliance│ │○Packaging│   │
│  │   (3 issues)│ │ (1 issue)│ │ (ready)  │ │ (1 issue)│ │ (ready) │   │
│  └─────────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                                           │
│  ─── Metadata ────────────────────────────────────────────────────────   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Field           │ Value                       │ Status     │       │ │
│  │──────────────────┼─────────────────────────────┼────────────│       │ │
│  │  Title           │ Midnight Sessions           │ ✓ Complete │       │ │
│  │  Version         │ Original                    │ ✓ Complete │       │ │
│  │  Artist          │ Artist X                    │ ✓ Complete │       │ │
│  │  Genre           │ Alternative R&B             │ ✓ Complete │       │ │
│  │  Subgenre        │ —                           │ ○ Optional │       │ │
│  │  Release Date    │ Oct 01, 2026                │ ✓ Complete │       │ │
│  │  Label           │ Acme Records                │ ✓ Complete │       │ │
│  │  UPC             │ —                           │ ✕ Missing  │ [Fix] │ │
│  │  Catalog Number  │ ACR-042                     │ ✓ Complete │       │ │
│  │  Copyright ℗     │ ℗ 2026 Acme Records         │ ✕ Missing  │ [Fix] │ │
│  │  Copyright ©     │ © 2026 Artist X             │ ✕ Missing  │ [Fix] │ │
│  │  Primary Language│ English                     │ ✓ Complete │       │ │
│  │  Explicit Rating │ Not Explicit                │ ✓ Complete │       │ │
│  │  Distributor     │ —                           │ ○ Optional │       │ │
│  │  Territory       │ Worldwide                   │ ○ Optional │       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ⚠ 3 fields missing: UPC, Copyright ℗, Copyright ©                       │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Section 1: Metadata

Release-level metadata fields. Each field is validated against DSP
requirements.

### Fields

| Field | Type | Required by DSP | Default | Validation |
|-------|------|----------------|---------|------------|
| Title | Text | Yes | — | 1-200 chars |
| Version | Text | No | "Original" | Free text |
| Artist | Text | Yes | — | Must match contributor |
| Genre | Select | Yes | — | From DSP taxonomy |
| Subgenre | Select | No | — | From DSP taxonomy |
| Release Date | Date | Yes | — | Must be future |
| Pre-order Date | Date | No | — | Before release date |
| Label | Text | Yes | Org name | Must match org |
| UPC | Text | Yes | — | 12-digit, GS1 GTIN-12, check digit validated |
| Catalog Number | Text | No | — | Label-specific |
| Copyright ℗ | Text | Yes | — | "℗ YYYY Label Name" |
| Copyright © | Text | Yes | — | "© YYYY Artist Name" |
| Primary Language | Select | Yes | English | ISO 639-1 |
| Explicit Rating | Select | Yes | — | Not Explicit / Explicit / Clean |
| Distributor | Text | No | — | Orchard, TuneCore, etc. |
| Territory | Multi-select | No | Worldwide | ISO 3166-1 |

### Status per Field

| Status | Meaning |
|--------|---------|
| ✓ Complete | Field is filled and valid |
| ✕ Missing | Required by DSP, not yet filled |
| ⚠ Invalid | Filled but fails DSP validation |
| ○ Optional | Not required |

---

## Section 2: Tracks

Per-track metadata validated against DSP requirements.

```
┌─ Tracks ────────────────────────────────────────────────────────────┐
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  # │ Title              │ Dur.  │ ISRC         │ Explicit│ Lang │ │
│  │────┼────────────────────┼───────┼──────────────┼─────────┼──────│ │
│  │  1 │ Midnight Sessions  │ 3:42  │ USABC2500001 │ No      │ en   │ │
│  │    │                    │  ✓    │ ✓            │ ✓       │ ✓    │ │
│  │  2 │ Late Night Drive   │ 4:15  │ USABC2500002 │ No      │ en   │ │
│  │    │                    │  ✓    │ ✓            │ ✓       │ ✓    │ │
│  │  3 │ City Lights        │ 3:28  │ USABC2500003 │ No      │ en   │ │
│  │    │                    │  ✓    │ ✓            │ ✓       │ ✓    │ │
│  │  4 │ Fading Echo        │ 5:01  │ —            │ No      │ en   │ │
│  │    │                    │  ✓    │ ✕ Missing    │ ✓       │ ✓    │ │
│  └────┴────────────────────┴───────┴──────────────┴─────────┴──────┘ │
│                                                                       │
│  ⚠ Track 4 "Fading Echo" is missing ISRC.                   [Fix]   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Per-Track Fields

| Field | Required | Validation |
|-------|----------|------------|
| Title | Yes | 1-200 chars |
| Duration | Yes | mm:ss format |
| ISRC | Yes | 12-char uppercase alphanumeric |
| Explicit | Yes | Not Explicit / Explicit / Clean |
| Language | Yes | ISO 639-1 |
| Track Number | Yes | 1-N, unique |
| Writers | No | Comma-separated names |
| Producers | No | Comma-separated names |

---

## Section 3: Artwork

Cover art validation against DSP specifications.

```
┌─ Artwork ───────────────────────────────────────────────────────────┐
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │              ┌─────────────────────────────────┐                │ │
│  │              │                                 │                │ │
│  │              │     [Cover Art v3 preview]      │                │ │
│  │              │                                 │                │ │
│  │              └─────────────────────────────────┘                │ │
│  │                                                                  │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │  Requirement          │ Value          │ Status            │ │ │
│  │  │───────────────────────┼────────────────┼───────────────────│ │ │
│  │  │  Resolution           │ 3000 × 3000px  │ ✓ Passed          │ │ │
│  │  │  Minimum              │ 3000 × 3000px  │ ✓ Passed          │ │ │
│  │  │  Format               │ JPG            │ ✓ Passed          │ │ │
│  │  │  Color space          │ sRGB           │ ✓ Passed          │ │ │
│  │  │  DPI                  │ 300            │ ✓ Passed          │ │ │
│  │  │  File size            │ 4.2 MB         │ ✓ Passed (≤20MB)  │ │ │
│  │  │  Text/logo safe zone  │ —              │ ⚠ Manual check   │ │ │
│  │  │  No URLs on art       │ —              │ ⚠ Manual check   │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  All automated checks passed. 2 manual checks pending.               │
└───────────────────────────────────────────────────────────────────────┘
```

### Artwork Checks

| Check | Type | DSP Requirement |
|-------|------|----------------|
| Resolution | Auto | 3000×3000px minimum for all major DSPs |
| Format | Auto | JPG or PNG |
| Color space | Auto | sRGB (RGB) |
| DPI | Auto | At least 72 DPI (300 recommended) |
| File size | Auto | Max 20MB |
| Square aspect ratio | Auto | Must be square (1:1) |
| No URLs or social handles | Manual | DSPs reject artwork with URLs |
| Text safe zone | Manual | Text/logo within a 10% margin from edges |
| No explicit content on cover | Manual | Must match explicit flag on release |

---

## Section 4: Compliance

Legal and content compliance fields.

```
┌─ Compliance ────────────────────────────────────────────────────────┐
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Field                   │ Value              │ Status          │ │
│  │──────────────────────────┼────────────────────┼─────────────────│ │
│  │  Parental Advisory       │ Not Explicit       │ ✓ Complete      │ │
│  │  Lyric Content Warning   │ —                  │ ○ Not needed     │ │
│  │  Territorial Restriction │ None               │ ✓ Complete      │ │
│  │  Licensing Confirmation  │ Confirmed          │ ✓ Complete      │ │
│  │  Sample Clearance        │ —                  │ ✕ Missing       │ │
│  │  Mechanical License      │ —                  │ ○ Not applicable│ │
│  │  Rights Holder Contact   │ admin@acme.com     │ ✓ Complete      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ⚠ Sample clearance requires confirmation. Track 2 contains a sample. │
│    ┌──────────────────────────────┐                                   │
│    │  Confirm sample clearance    │                                   │
│    └──────────────────────────────┘                                   │
└───────────────────────────────────────────────────────────────────────┘
```

### Compliance Fields

| Field | Required By | Description |
|-------|-------------|-------------|
| Parental Advisory | All DSPs | Maps to explicit flag |
| Lyric Content Warning | All DSPs | Required if explicit |
| Territorial Restriction | Apple Music | Geo-restrictions if any |
| Licensing Confirmation | Internal | PM confirms all rights secured |
| Sample Clearance | Internal | Per track, if samples used |
| Mechanical License | Internal | Per track, if covers |
| Rights Holder Contact | Internal | Support contact for DSPs |

---

## Section 5: Packaging

Defines what gets sent to each DSP in the submission bundle.

```
┌─ Packaging ─────────────────────────────────────────────────────────┐
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  DSP               │ Audio              │ Artwork  │ Metadata   │ │
│  │────────────────────┼────────────────────┼──────────┼────────────│ │
│  │  Spotify           │ ✓ Master WAV       │ ✓ v3     │ ✓ Complete │ │
│  │                    │ T1-T4 16/44.1      │ 3000×3000│ All fields │ │
│  │  ─────────────────┼────────────────────┼──────────┼────────────│ │
│  │  Apple Music       │ ✓ Master WAV       │ ✓ v3     │ ✓ Complete │ │
│  │                    │ T1-T4 16/44.1      │ 3000×3000│ All fields │ │
│  │  ─────────────────┼────────────────────┼──────────┼────────────│ │
│  │  Amazon Music      │ ✓ Master WAV       │ ✓ v3     │ ✓ Complete │ │
│  │                    │ T1-T4 16/44.1      │ 3000×3000│ All fields │ │
│  │  ─────────────────┼────────────────────┼──────────┼────────────│ │
│  │  Tidal             │ ✓ Master WAV       │ ✓ v3     │ ✓ Complete │ │
│  │                    │ T1-T4 16/44.1      │ 3000×3000│ All fields │ │
│  └────────────────────┴────────────────────┴──────────┴────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Submit to all 4 DSPs                                         │   │
│  └───────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

### Packaging per DSP

| DSP | Audio Format | Artwork | Metadata Format | Special Assets |
|-----|-------------|---------|-----------------|---------------|
| Spotify | WAV 16/44.1 | JPG 3000×3000 | DDEX or API | Spotify Canvas (optional) |
| Apple Music | WAV 16/44.1 | JPG 3000×3000 | DDEX or Apple XML | Apple Motion (optional) |
| Amazon Music | WAV 16/44.1 | JPG 3000×3000 | DDEX or Amazon XML | — |
| Tidal | FLAC or WAV 16/44.1 | JPG 3000×3000 | DDEX or Tidal API | — |
| Deezer | WAV 16/44.1 | JPG 3000×3000 | DDEX or API | — |
| YouTube Music | WAV 16/44.1 | JPG 3000×3000 | DDEX or API | Music video (optional) |

### Packaging Validation

Before submission, the packaging section checks:
- Audio files exist for all tracks in the required format
- Artwork is the approved version at correct resolution
- Metadata is complete (no missing required fields)
- DSP connections are active (TASK-1401 Integration section)
