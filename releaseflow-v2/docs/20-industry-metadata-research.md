# Industry Metadata Research

## Source Standards

This document maps metadata fields to industry standards:

- **DDEX** (Digital Data Exchange) — standard for music metadata exchange
- **RIAA** — Recording Industry Association of America guidelines
- **IFPI** — International Federation of the Phonographic Industry (ISRC, UPC)
- **DSP Requirements** — Spotify, Apple Music, Amazon Music submission specs

---

## Track-Level Metadata

### 1. ISRC (International Standard Recording Code)

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Standard      | ISO 3901, maintained by IFPI                   |
| Format        | 12 characters: CC-XXX-YY-NNNNN                 |
| Breakdown     | Country (2) + Registrant (3) + Year (2) + Designation (5) |
| Scope         | Per track, per recording (not per release)     |
| Requirement   | **Required by all DSPs**                       |
| Uniqueness    | Globally unique, never reassigned              |
| Timing        | Assign before distribution submission          |
| Auto-generate | Possible if we register as an ISRC manager     |

```
  US  ABC  25  00001
  │   │    │    └── Designation (5 digits)
  │   │    └─────── Year of registration (2 digits)
  │   └──────────── Registrant code (3 alphanumeric)
  └──────────────── Country code (2 alpha)
```

**Recommendation:** Provide auto-generation with manual override.
Display in format `USABC2500001`.

---

### 2. Writers (Songwriters / Composers)

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Standard      | PRO (Performance Rights Organization) metadata |
| Format        | Comma-separated list of names                  |
| Role          | PRO_NAME (e.g., "WRITER", "COMPOSER")          |
| Requirement   | **Required** for publishing royalty tracking   |
| IPI Number    | Interested Party Identifier (linked to PRO)    |
| Split %       | Optional for publishing splits                 |

**Recommendation:** Free-text field with autocomplete from org
contributor list. Store both name and IPI when available.

---

### 3. Publishers

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Standard      | DDEX ReleaseMessage                            |
| Format        | Publisher name + ownership share               |
| Requirement   | **Required** for mechanical licensing          |
| Relationship  | 1:N (a track can have multiple publishers)     |
| Sub-publishing| Territorial sub-publisher information optional |

**Recommendation:** Link to org publisher list. Allow percentage
split assignment per track.

---

### 4. Explicit Flag

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Standard      | DSP Content Rating (all major platforms)       |
| Values        | TRUE / FALSE / CLEAN (explicit version exists) |
| Requirement   | **Required** — all DSPs reject without it      |
| Impact        | Affects search, parental controls, advertising |
| CLEAN usage   | Track has both explicit and clean versions     |

**Recommendation:** Three-state toggle: Explicit, Not Explicit, Clean.
Default to Not Explicit.

---

### 5. Language

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Standard      | ISO 639-1 / ISO 639-2 (two-letter code)        |
| Requirement   | **Recommended** by most DSPs                   |
| Values        | en, es, fr, de, etc.                           |
| Multi-language| Primary language only (for categorization)     |

**Recommendation:** Dropdown with ISO 639-1 codes. Optional field,
default "en".

---

## Release-Level Metadata

### 6. UPC (Universal Product Code)

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Standard      | GS1 GTIN-12 (North America) / EAN-13 (global)  |
| Format        | 12 digits (UPC-A) or 13 digits (EAN)           |
| Scope         | One per release (not per track)                |
| Requirement   | **Required** by all retailers and DSPs         |
| Assignment    | Label must purchase from GS1                   |
| Barcode image | Generated from numeric code                    |
| Timing        | Required before distribution                   |

```
  UPC-A:  7 65432 12345 6
          │ │               └── Check digit
          │ └────────────────── Item reference
          └──────────────────── Company prefix (label)
```

**Recommendation:** Manual entry field with GS1 prefix prefix
auto-detection. Validate check digit on input.

---

### 7. Catalog Number

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Standard      | Label-specific (no global standard)            |
| Format        | Varies: ABC001, CAT-2025-001, etc.             |
| Scope         | Internal label inventory tracking              |
| Requirement   | **Optional** — not required by DSPs            |
| Uniqueness    | Unique within the label's catalog              |

**Recommendation:** Text field with pattern validation configurable
per org (regex). Auto-increment suggestion based on label prefix.

---

### 8. Copyright (℗ Sound Recording / © Cover Art)

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Standard      | ℗ = sound recording copyright                 |
|               | © = cover art / liner notes copyright          |
| Format        | ℗ [Year] [Rights Holder]                       |
| Requirement   | **Required** by all DSPs                       |
| Lineage       | ℗ Owner may differ from © Owner                |
| Display       | Shown in DSP metadata on track page            |

```
  Examples:
  ℗ 2025 Acme Records Inc.
  ℗ 2025 Artist X under exclusive license to Acme Records
  © 2025 Acme Records Inc.
```

**Recommendation:** Auto-suggest "℗ {currentYear} {orgName}". Allow
separate ℗ and © fields. Free-text format.

---

### 9. Label

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Standard      | DSP store metadata                             |
| Format        | Label name as registered with distributor      |
| Requirement   | **Required** — identifies the releasing entity |
| Consistency   | Must match exactly across all releases         |
| Variations    | Parent label + imprint possible                |

**Recommendation:** Pre-populated from org profile. Single select
from org's registered labels list.

---

## Summary: Required vs Recommended vs Optional

```
Field          │ Required │ Recommended │ Optional │ Standard
───────────────┼──────────┼─────────────┼──────────┼─────────────────
ISRC (track)   │ ✓        │             │          │ ISO 3901 / IFPI
Writers        │ ✓        │             │          │ PRO metadata
Publishers     │ ✓        │             │          │ DDEX
Explicit flag  │ ✓        │             │          │ DSP content rating
UPC (release)  │ ✓        │             │          │ GS1 GTIN-12/EAN
Copyright (℗)  │ ✓        │             │          │ DDEX, DSP standard
Label          │ ✓        │             │          │ DSP store metadata
───────────────┼──────────┼─────────────┼──────────┼─────────────────
Language       │          │ ✓           │          │ ISO 639-1
Copyright (©)  │          │ ✓           │          │ DDEX
Catalog Number │          │             │ ✓        │ Label-specific
Version        │          │             │ ✓        │ Free-text
IPI Number     │          │             │ ✓        │ CISAC / PRO
Split %        │          │             │ ✓        │ Publisher-level
Barcode Image  │          │             │ ✓        │ Generated from UPC
```

---

## DSP-Specific Requirements Matrix

```
Metadata Field        │ Spotify │ Apple Music │ Amazon Music │ Tidal
──────────────────────┼─────────┼─────────────┼──────────────┼───────
ISRC                  │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
UPC                   │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Explicit flag         │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Copyright ℗           │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Label                 │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Writers               │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Publishers            │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Language              │ ✓ rec   │ ✓ rec       │ ✓ rec        │ ✓ rec
Genre                 │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Subgenre              │ ✓ opt   │ ✓ opt       │ ✓ opt        │ ✓ opt
Release Date          │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Track Title           │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Track Duration        │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Artwork (3000x3000)   │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Parental Advisory     │ ✓ req   │ ✓ req       │ ✓ req        │ ✓ req
Lyrics                │ ✓ opt   │ ✓ opt       │ ✓ opt        │ ✓ opt
Credits               │ ✓ opt   │ ✓ req       │ ✓ opt        │ ✓ opt
```

---

## V1 Implementation Scope

### Required (Sprint 003)

| Entity  | Fields                                      |
|---------|---------------------------------------------|
| Track   | title, duration, isrc, explicit, writers    |
| Release | title, genre, releaseDate, label, copyright, upc |

### Recommended (Sprint 004+)

| Entity  | Fields                                      |
|---------|---------------------------------------------|
| Track   | language, publishers, ipi, split            |
| Release | catalogNumber, copyrightCover, version      |

### Optional (Future)

| Entity  | Fields                                      |
|---------|---------------------------------------------|
| Track   | lyrics, credits, mood, bpm, key             |
| Release | barcodeImage, preorderDate, territorialRights|
