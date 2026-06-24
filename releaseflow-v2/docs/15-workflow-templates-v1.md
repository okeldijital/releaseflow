# Workflow Templates V1

## Principles

1. **Stages only** — no task automation, no conditional branching in V1.
2. **Ordered list** — each template is a sequential list of stages.
   Stages execute left to right.
3. **Template maps to ReleaseType** — Single, EP, Album, Remix each
   have a dedicated workflow template.
4. **Deliverables are files or data** that must exist before a stage can
   be marked complete.
5. **Approvals are optional** in V1 — flagged per stage but not enforced.

---

## Template: Single

```
  Planning  →  Production  →  Mixing  →  Mastering  →  Artwork  →  Distribution  →  Release
  ┌──────┐     ┌──────────┐   ┌──────┐    ┌────────┐   ┌──────┐    ┌────────────┐   ┌──────┐
  │  ○   │     │    ○     │   │  ○   │    │   ○    │   │  ○   │    │     ○      │   │  ○   │
  └──────┘     └──────────┘   └──────┘    └────────┘   └──────┘    └────────────┘   └──────┘

  Stages:   7
  Tracks:   1
  Default:  Single Pipeline
```

| # | Stage        | Description                    | Required Deliverables                     | Required Approvals       |
|---|--------------|--------------------------------|-------------------------------------------|--------------------------|
| 1 | Planning     | Scope, budget, schedule        | Release plan, track list, session booked  | None                     |
| 2 | Production   | Recording sessions             | Raw audio files (stems)                   | None                     |
| 3 | Mixing       | Audio mix                      | Stereo mix files (WAV 24/48)              | None                     |
| 4 | Mastering    | Final master                   | Master files (WAV 16/44.1)                | None                     |
| 5 | Artwork      | Cover art + assets             | Cover art (3000x3000 JPG/PNG)             | None                     |
| 6 | Distribution | Submit to stores               | All metadata, UPC, ISRC assigned          | None                     |
| 7 | Release      | Go live                        | Release date confirmed                    | None                     |

---

## Template: EP

```
  Planning  →  Production  →  Mixing  →  Mastering  →  Artwork  →  Distribution  →  Release
  ┌──────┐     ┌──────────┐   ┌──────┐    ┌────────┐   ┌──────┐    ┌────────────┐   ┌──────┐
  │  ○   │     │    ○     │   │  ○   │    │   ○    │   │  ○   │    │     ○      │   │  ○   │
  └──────┘     └──────────┘   └──────┘    └────────┘   └──────┘    └────────────┘   └──────┘

  Stages:   7
  Tracks:   3–6
  Default:  EP Pipeline
  Notes:    Identical to Single. Track count range is the differentiator.
```

| # | Stage        | Description                    | Required Deliverables                     | Required Approvals       |
|---|--------------|--------------------------------|-------------------------------------------|--------------------------|
| 1 | Planning     | Scope, budget, schedule        | Release plan, track list, session booked  | None                     |
| 2 | Production   | Recording sessions             | Raw audio files per track                 | None                     |
| 3 | Mixing       | Audio mix per track            | Stereo mix files (WAV 24/48) per track    | None                     |
| 4 | Mastering    | Final master per track         | Master files (WAV 16/44.1) per track      | None                     |
| 5 | Artwork      | Cover art + assets             | Cover art (3000x3000 JPG/PNG)             | None                     |
| 6 | Distribution | Submit to stores               | All metadata, UPC, ISRC per track         | None                     |
| 7 | Release      | Go live                        | Release date confirmed                    | None                     |

---

## Template: Album

```
  Planning  →  Production  →  Mixing  →  Mastering  →  Artwork  →  Distribution  →  Release
  ┌──────┐     ┌──────────┐   ┌──────┐    ┌────────┐   ┌──────┐    ┌────────────┐   ┌──────┐
  │  ○   │     │    ○     │   │  ○   │    │   ○    │   │  ○   │    │     ○      │   │  ○   │
  └──────┘     └──────────┘   └──────┘    └────────┘   └──────┘    └────────────┘   └──────┘

  Stages:   7
  Tracks:   7+
  Default:  Album Pipeline
  Notes:    Identical pipeline. Distinction is track count and metadata volume.
```

| # | Stage        | Description                    | Required Deliverables                     | Required Approvals       |
|---|--------------|--------------------------------|-------------------------------------------|--------------------------|
| 1 | Planning     | Scope, budget, schedule        | Release plan, full track list, sessions   | None                     |
| 2 | Production   | Recording sessions             | Raw audio files per track                 | None                     |
| 3 | Mixing       | Audio mix per track            | Stereo mix files (WAV 24/48) per track    | None                     |
| 4 | Mastering    | Final master per track         | Master files (WAV 16/44.1) per track      | None                     |
| 5 | Artwork      | Cover art + booklet assets     | Cover art + booklet (3000x3000 JPG/PNG)  | None                     |
| 6 | Distribution | Submit to stores               | All metadata, UPC, ISRC per track         | None                     |
| 7 | Release      | Go live                        | Release date confirmed                    | None                     |

---

## Template: Remix

```
  Planning  →  Production  →  Mixing  →  Mastering  →  Artwork  →  Distribution  →  Release
  ┌──────┐     ┌──────────┐   ┌──────┐    ┌────────┐   ┌──────┐    ┌────────────┐   ┌──────┐
  │  ○   │     │    ○     │   │  ○   │    │   ○    │   │  ○   │    │     ○      │   │  ○   │
  └──────┘     └──────────┘   └──────┘    └────────┘   └──────┘    └────────────┘   └──────┘

  Stages:   7
  Tracks:   1
  Default:  Remix Pipeline
  Notes:    Production involves stem preparation, not recording.
```

| # | Stage        | Description                       | Required Deliverables                     | Required Approvals       |
|---|--------------|-----------------------------------|-------------------------------------------|--------------------------|
| 1 | Planning     | Remix direction, stem acquisition | Stem files from original, remix brief    | None                     |
| 2 | Production   | Sound design, arrangement         | Remix session files, arrangement notes   | None                     |
| 3 | Mixing       | Remix mix                         | Stereo mix (WAV 24/48)                    | None                     |
| 4 | Mastering    | Final remix master                | Master file (WAV 16/44.1)                 | None                     |
| 5 | Artwork      | Remix-specific art                | Remix cover art (3000x3000 JPG/PNG)       | None                     |
| 6 | Distribution | Submit to stores                  | All metadata, UPC, ISRC, remixer credits  | None                     |
| 7 | Release      | Go live                           | Release date confirmed                    | None                     |

---

## Template Comparison

```
Stage           │ Single │ EP     │ Album  │ Remix
────────────────┼────────┼────────┼────────┼───────
Planning        │ ●      │ ●      │ ●      │ ●
Production      │ ●      │ ●      │ ●      │ ●
Mixing          │ ●      │ ●      │ ●      │ ●
Mastering       │ ●      │ ●      │ ●      │ ●
Artwork         │ ●      │ ●      │ ●      │ ●
Distribution    │ ●      │ ●      │ ●      │ ●
Release         │ ●      │ ●      │ ●      │ ●
────────────────┼────────┼────────┼────────┼───────
Total stages    │ 7      │ 7      │ 7      │ 7
```

---

## Deliverable Types

| Type              | Format            | Max Size | Notes                        |
|-------------------|-------------------|----------|------------------------------|
| Audio (Stems)     | WAV, AIFF         | 2GB/file | 24-bit / 48kHz recommended   |
| Audio (Mix)       | WAV, AIFF         | 1GB/file | 24-bit / 48kHz               |
| Audio (Master)    | WAV, FLAC         | 1GB/file | 16-bit / 44.1kHz             |
| Image (Cover)     | JPG, PNG          | 20MB     | 3000x3000px minimum          |
| Image (Booklet)   | PDF, JPG, PNG     | 50MB     | Multi-page allowed           |
| Document (Plan)   | Markdown (inline) | —        | Stored as release metadata   |

---

## Stage Detail (Admin View)

```
  ┌──────────────────────────────────────────────────────────────┐
  │  Edit Workflow: Single Pipeline                              │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────────┐│
  │  │  ≡  Planning                       ⚙ can_skip: false    ││
  │  │     └ Required deliverables: Release plan, track list   ││
  │  │     └ Required approvals: 0                             ││
  │  ├──────────────────────────────────────────────────────────┤│
  │  │  ≡  Production                     ⚙ can_skip: false    ││
  │  │     └ Required deliverables: Raw audio files            ││
  │  │     └ Required approvals: 0                             ││
  │  ├──────────────────────────────────────────────────────────┤│
  │  │  ≡  Mixing                         ⚙ can_skip: false    ││
  │  │     └ Required deliverables: Stereo mix (WAV 24/48)    ││
  │  │     └ Required approvals: 0                             ││
  │  ├──────────────────────────────────────────────────────────┤│
  │  │  [+] Add stage                                           ││
  │  └──────────────────────────────────────────────────────────┘│
  │                                                              │
  │  Drag to reorder   |   × to remove   |   ⚙ stage settings   │
  └──────────────────────────────────────────────────────────────┘
```

---

## Default Stage Properties (V1)

| Property             | Value     | Notes                                |
|----------------------|-----------|--------------------------------------|
| Name                 | string    | Human-readable stage name            |
| Order                | integer   | Position in sequence                 |
| CanSkip              | boolean   | Allow stage to be skipped            |
| RequiredDeliverables | string[]  | List of deliverable types needed     |
| RequiredApprovals    | integer   | Number of approvals needed (0 in V1) |

---

## Hidden Template Metadata

Each template carries metadata that is not exposed in the V1 UI but is
stored with the template definition for future automation.

### Schema

```json
{
  "template": "Single",
  "stages": [
    { "name": "Planning", "order": 1, "canSkip": false },
    { "name": "Production", "order": 2, "canSkip": false },
    { "name": "Mixing", "order": 3, "canSkip": false },
    { "name": "Mastering", "order": 4, "canSkip": false },
    { "name": "Artwork", "order": 5, "canSkip": false },
    { "name": "Distribution", "order": 6, "canSkip": false },
    { "name": "Release", "order": 7, "canSkip": false }
  ],
  "requiredContributorRoles": ["Artist", "Producer"],
  "requiredDeliverables": {
    "Planning": ["Release plan", "Track list"],
    "Production": ["Raw audio files"],
    "Mixing": ["Stereo mix (WAV 24/48)"],
    "Mastering": ["Master file (WAV 16/44.1)"],
    "Artwork": ["Cover art (3000x3000)"],
    "Distribution": ["All metadata", "UPC", "ISRC"],
    "Release": ["Release date confirmed"]
  }
}
```

### Per-Template Values

| Template | requiredContributorRoles                              |
|----------|-------------------------------------------------------|
| Single   | `["Artist", "Producer"]`                              |
| EP       | `["Artist", "Producer"]`                              |
| Album    | `["Artist", "Producer", "Writer"]`                    |
| Remix    | `["Artist", "Remixer", "Producer"]`                   |

### Binding to requiredDeliverables (per stage)

Each template's stage definitions include a `requiredDeliverables` array.
In V1 this is stored as metadata only (not enforced). In Sprint 004+,
stage advancement will check that all required deliverables exist before
allowing completion.

---

## Template → Release Binding

```
  On release creation:

  1. User selects ReleaseType (Single, EP, Album, Remix)
  2. System maps ReleaseType → WorkflowTemplate
  3. WorkflowTemplate stages are copied to the Release as
     live Stage records
  4. Release.state is set to DRAFT
  5. Release moves to PLANNING when first stage starts
```

---

## Future Approval Hooks (Post-V1)

```
  Stage: Mixing
    Required approval: Artist confirms mix before mastering

  Stage: Mastering
    Required approval: Artist + A&R approve master

  Stage: Distribution
    Required approval: Admin or Owner approves release
```

No approvals are enforced in V1. All stages advance upon manual
completion of deliverables.
