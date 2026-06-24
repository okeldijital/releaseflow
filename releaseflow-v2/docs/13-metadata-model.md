# Metadata Model

## Release Metadata

```
┌─────────────────────────────────────────────────────────────┐
│  Release Metadata                                            │
│  ─────────────────────────────────────────────               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Title *                               ┌──────────┐  │   │
│  │  ┌──────────────────────────────────┐  │  Autosave │  │   │
│  │  │ Midnight Sessions                │  └──────────┘  │   │
│  │  └──────────────────────────────────┘                │   │
│  │                                                      │   │
│  │  Version                                             │   │
│  │  ┌──────────────────────────────────┐                │   │
│  │  │ Original Version                 │                │   │
│  │  └──────────────────────────────────┘                │   │
│  │                                                      │   │
│  │  Genre                  Subgenre                     │   │
│  │  ┌──────────────────┐   ┌──────────────────┐        │   │
│  │  │ Electronic ▼     │   │ Deep House ▼     │        │   │
│  │  └──────────────────┘   └──────────────────┘        │   │
│  │                                                      │   │
│  │  Release Date *                                      │   │
│  │  ┌──────────────────────────────────┐                │   │
│  │  │ Aug 15, 2026                 📅  │                │   │
│  │  └──────────────────────────────────┘                │   │
│  │                                                      │   │
│  │  Label *                                             │   │
│  │  ┌──────────────────────────────────┐                │   │
│  │  │ Acme Records                     │                │   │
│  │  └──────────────────────────────────┘                │   │
│  │                                                      │   │
│  │  UPC                                                   │   │
│  │  ┌──────────────────────────────────┐                │   │
│  │  │ 765432123456                     │                │   │
│  │  └──────────────────────────────────┘                │   │
│  │                                                      │   │
│  │  Catalog Number                                       │   │
│  │  ┌──────────────────────────────────┐                │   │
│  │  │ ACME-001                         │                │   │
│  │  └──────────────────────────────────┘                │   │
│  │                                                      │   │
│  │  Copyright ℗                                         │   │
│  │  ┌──────────────────────────────────┐                │   │
│  │  │ ℗ 2026 Acme Records             │                │   │
│  │  └──────────────────────────────────┘                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  * Required field                                            │
└──────────────────────────────────────────────────────────────┘
```

### Field Definitions

| Field        | Type    | Required | Notes                                |
|--------------|---------|----------|--------------------------------------|
| Title        | string  | Yes      | Primary release title                |
| Version      | string  | No       | "Original", "Deluxe", "Reissue"      |
| Genre        | enum    | Yes      | From predefined taxonomy             |
| Subgenre     | enum    | No       | Optional refinement of genre         |
| Release Date | date    | Yes      | Target street date                   |
| Label        | string  | Yes      | Pre-filled from org                  |
| UPC          | string  | No       | GS1 GTIN-12/EAN; validates check dig |
| Catalog Number| string  | No       | Label-specific inventory code        |
| Copyright    | string  | No       | ℗ year + owner (auto-suggested)      |

---

## Track Metadata

```
┌─────────────────────────────────────────────────────────────┐
│  Track Metadata                                              │
│  ─────────────────────────────────────────────               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Track 1 of 3                               ⚙ More   │   │
│  │  ────────────────────────────────────────            │   │
│  │                                                      │   │
│  │  Title *                                             │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Midnight (Original Mix)                      │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  Version                                             │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Original Mix                                 │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  Writers                            Producers        │   │
│  │  ┌──────────────────────┐   ┌────────────────────┐  │   │
│  │  │ Artist X             │   │ Producer Z         │  │   │
│  │  │ Alex Taylor          │   │                    │  │   │
│  │  └──────────────────────┘   └────────────────────┘  │   │
│  │                                                      │   │
│  │  Duration (mm:ss) *                                  │   │
│  │  ┌──────────────────────┐                            │   │
│  │  │ 03:45                │                            │   │
│  │  └──────────────────────┘                            │   │
│  │                                                      │   │
│  │  ISRC                                                │   │
│  │  ┌──────────────────────┐                            │   │
│  │  │ USABC1234567         │  ← Auto-generated          │   │
│  │  └──────────────────────┘                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──┐ ┌──┐ ┌──┐                                             │
│  │ 1│ │ 2│ │ 3│    ← Track pagination / tabs                │
│  └──┘ └──┘ └──┘                                             │
│                                                              │
│  ✚ Add track                                                 │
└──────────────────────────────────────────────────────────────┘
```

### Field Definitions

| Field        | Type    | Required | Notes                              |
|--------------|---------|----------|------------------------------------|
| Title        | string  | Yes      | Track title                        |
| Version      | string  | No       | "Original Mix", "Radio Edit", etc. |
| Writers      | string[]| No       | Composer / songwriter credits      |
| Producers    | string[]| No       | Producer credits                   |
| Duration     | mm:ss   | Yes      | Total runtime                      |
| ISRC         | string  | No       | Auto-generated if empty            |
| Language     | enum    | No       | ISO 639-1; defaults to "en"        |
| Explicit Flag| boolean | No       | true/false/clean; defaults to false|

---

## Field Grouping (Form Layout)

### Sidebar Panel (Release Metadata)

```
┌──────────────────────────────┐
│  Release Details              │
│  ──────────────────────────  │
│                              │
│  Status        ● In Progress │
│  Type          Album         │
│  Tracks        12            │
│  Duration      47:23         │
│  UPC           TBD           │
│  Created       May 1, 2026   │
│  Updated       Jun 15, 2026  │
└──────────────────────────────┘
```

### Track List Table Columns

```
┌────┬──────────────────┬────────────┬──────────┬──────────┬─────────┐
│  # │ Title             │ Duration   │ ISRC     │ Writers  │ Status  │
├────┼──────────────────┼────────────┼──────────┼──────────┼─────────┤
│  1 │ Midnight (Orig.)  │ 03:45      │ US...001 │ Artist X │ Draft   │
│  2 │ Sunrise (Radio)   │ 03:12      │ US...002 │ Artist X │ Draft   │
└────┴──────────────────┴────────────┴──────────┴──────────┴─────────┘
```

---

## Validation Rules

| Field            | Rule                                          |
|------------------|-----------------------------------------------|
| Title            | 1–200 chars, trimmed                          |
| Version          | Max 100 chars                                 |
| Duration         | Must match regex `/^\d{1,3}:\d{2}$/`          |
| ISRC             | 12 alphanumeric, auto-format uppercase         |
| Release Date     | Must not be in the past for new releases      |
| Genre            | Must match predefined taxonomy                |
| Copyright        | Auto-suggest "℗ {year} {label}"               |

---

## Data Flow

```
  ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
  │  Create Flow  │────►│  Metadata Store  │────►│  DSP Submission  │
  │  (5 steps)    │     │  (editable)      │     │  (locked before  │
  └──────────────┘     └──────────────────┘     │  distribution)   │
                                                └──────────────────┘
                            │
                            ▼
                     ┌──────────────────┐
                     │  Reporting /      │
                     │  Analytics        │
                     └──────────────────┘
```

- Metadata can be edited at any point before distribution submission.
- Once submitted to a store, the metadata snapshot is frozen.
- Edits after distribution require a metadata update resubmission.
